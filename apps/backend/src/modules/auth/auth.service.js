import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { conflict, unauthorized } from '../../utils/httpError.js';
import { generateRefreshToken, hashToken, signAccessToken } from '../../utils/tokens.js';

const BCRYPT_ROUNDS = 12;
// Hash falso para que el login tarde lo mismo exista o no el email (evita enumerar usuarios)
const DUMMY_HASH = bcrypt.hashSync('nova-dummy-password', BCRYPT_ROUNDS);

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.created_at,
});

async function issueTokens(db, user, client) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const { rows } = await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, client, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [user.id, hashToken(refreshToken), client, expiresAt],
  );

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    refreshTokenId: rows[0].id,
    refreshExpiresAt: expiresAt,
  };
}

export async function register({ name, email, password, client }) {
  const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rowCount > 0) throw conflict('Ya existe una cuenta con ese email');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash],
    );
    const user = rows[0];
    const tokens = await issueTokens(db, user, client);
    return { user: publicUser(user), ...tokens };
  });
}

export async function login({ email, password, client }) {
  const { rows } = await query(
    `SELECT id, name, email, role, password_hash, is_active, created_at
     FROM users WHERE email = $1`,
    [email],
  );
  const user = rows[0];

  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw unauthorized('Email o contraseña incorrectos');
  if (!user.is_active) throw unauthorized('La cuenta está desactivada');

  const tokens = await issueTokens({ query }, user, client);
  return { user: publicUser(user), ...tokens };
}

// Rotación: cada refresh invalida el token usado y entrega uno nuevo.
// Si alguien reutiliza un token ya rotado, se asume robo y se cierran todas las sesiones.
export async function refresh(rawToken, client) {
  if (!rawToken) throw unauthorized('Falta el refresh token');

  const result = await withTransaction(async (db) => {
    const { rows } = await db.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at,
              u.id AS uid, u.name, u.email, u.role, u.is_active, u.created_at
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
       FOR UPDATE OF rt`,
      [hashToken(rawToken)],
    );
    const row = rows[0];
    if (!row) throw unauthorized('Sesión inválida');

    if (row.revoked_at) {
      await db.query(
        'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
        [row.user_id],
      );
      // No lanzamos el error aquí: haría ROLLBACK y se desharía la revocación
      return { reused: true };
    }
    if (row.expires_at < new Date()) throw unauthorized('Sesión expirada');
    if (!row.is_active) throw unauthorized('La cuenta está desactivada');

    const user = { id: row.uid, name: row.name, email: row.email, role: row.role, created_at: row.created_at };
    const tokens = await issueTokens(db, user, client);

    await db.query('UPDATE refresh_tokens SET revoked_at = now(), replaced_by = $2 WHERE id = $1', [
      row.id,
      tokens.refreshTokenId,
    ]);

    return { user: publicUser(user), ...tokens };
  });

  if (result.reused) throw unauthorized('Sesión inválida, vuelve a iniciar sesión');
  return result;
}

export async function logout(rawToken) {
  if (!rawToken) return;
  await query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [
    hashToken(rawToken),
  ]);
}

export async function getMe(userId) {
  const { rows } = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw unauthorized('Usuario no encontrado');
  return publicUser(rows[0]);
}
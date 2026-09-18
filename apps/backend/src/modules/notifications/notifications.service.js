import { Expo } from 'expo-server-sdk';
import { query } from '../../db/pool.js';

const expo = new Expo();

/**
 * Un token pertenece a un dispositivo, no a una cuenta: si alguien más inicia
 * sesión en el mismo teléfono, el token se reasigna en vez de duplicarse.
 */
export async function registerToken(userId, { expoToken, platform, notifyDrops }) {
  const { rows } = await query(
    `INSERT INTO push_tokens (user_id, expo_token, platform, notify_drops)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (expo_token) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           platform = EXCLUDED.platform,
           notify_drops = EXCLUDED.notify_drops,
           last_seen_at = now()
     RETURNING id, platform, notify_drops AS "notifyDrops"`,
    [userId, expoToken, platform, notifyDrops],
  );
  return rows[0];
}

export async function removeToken(userId, expoToken) {
  await query('DELETE FROM push_tokens WHERE expo_token = $1 AND user_id = $2', [expoToken, userId]);
}

async function dropTokens(tokens) {
  if (tokens.length) {
    await query('DELETE FROM push_tokens WHERE expo_token = ANY($1::text[])', [tokens]);
  }
}

/**
 * Avisa a la lista de espera de un drop que ya está en vivo.
 *
 * Es idempotente por `drops.announced_at`: si el servidor se reinicia o un admin
 * vuelve a marcar el drop como live, nadie recibe la notificación dos veces.
 * Devuelve cuántos envíos se hicieron.
 */
export async function notifyDropLive(dropId) {
  const { rows: claimed } = await query(
    `UPDATE drops SET announced_at = now()
      WHERE id = $1 AND announced_at IS NULL
      RETURNING id, name, slug`,
    [dropId],
  );
  const drop = claimed[0];
  if (!drop) return { sent: 0, skipped: true };

  const { rows: targets } = await query(
    `SELECT pt.expo_token AS token, w.user_id
       FROM drop_waitlist w
       JOIN push_tokens pt ON pt.user_id = w.user_id AND pt.notify_drops
      WHERE w.drop_id = $1 AND w.status = 'waiting'`,
    [dropId],
  );

  const valid = targets.filter((t) => Expo.isExpoPushToken(t.token));
  await dropTokens(targets.filter((t) => !Expo.isExpoPushToken(t.token)).map((t) => t.token));
  if (valid.length === 0) return { sent: 0, skipped: false };

  const messages = valid.map((t) => ({
    to: t.token,
    sound: 'default',
    title: `${drop.name} ya está en vivo`,
    body: 'Entra ahora, las unidades del drop son limitadas.',
    data: { type: 'drop', slug: drop.slug },
    channelId: 'drops',
  }));

  const byToken = new Map(valid.map((t) => [t.token, t.user_id]));
  const invalid = [];
  const delivered = [];

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        const token = chunk[i].to;
        if (ticket.status === 'ok') {
          delivered.push(byToken.get(token));
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          // El teléfono desinstaló la app o revocó el permiso: el token ya no sirve.
          invalid.push(token);
        }
      });
    } catch (err) {
      console.error('Error enviando notificaciones del drop:', err.message);
    }
  }
  await dropTokens(invalid);

  // Solo se marca como notificado a quien sí recibió el mensaje.
  if (delivered.length) {
    await query(
      `UPDATE drop_waitlist SET status = 'notified', notified_at = now()
        WHERE drop_id = $1 AND user_id = ANY($2::uuid[]) AND status = 'waiting'`,
      [dropId, delivered],
    );
  } else {
    // Falló todo (Expo caído, sin red…): se suelta la marca para poder reintentar
    // volviendo a poner el drop en vivo, en vez de dejar a la lista sin aviso.
    await query('UPDATE drops SET announced_at = NULL WHERE id = $1', [dropId]);
  }

  return { sent: delivered.length, skipped: false };
}

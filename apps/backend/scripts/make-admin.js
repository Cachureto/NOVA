// Da rol de administrador a una cuenta. Si la cuenta no existe, la crea.
//
// Uso (desde la raíz del repo):
//   npm run db:admin -- tu@email.com
//       → convierte una cuenta YA registrada en admin
//   npm run db:admin -- tu@email.com "Tu Nombre"
//       → si no existe, la crea y te pide la contraseña en la terminal
//
// Después de ejecutarlo, cierra sesión en la web y vuelve a entrar para que el token tenga el rol nuevo.
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool.js';

const [emailArg, nameArg] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('❌ Indica un email válido. Ejemplo: npm run db:admin -- admin@nova.test');
  process.exit(1);
}

try {
  const { rows } = await pool.query('SELECT id, name, role FROM users WHERE email = $1', [email]);

  if (rows[0]) {
    if (rows[0].role === 'admin') {
      console.log(`ℹ️  ${email} ya es administrador.`);
    } else {
      await pool.query(`UPDATE users SET role = 'admin', is_active = TRUE WHERE id = $1`, [rows[0].id]);
      console.log(`✅ ${rows[0].name} (${email}) ahora es administrador.`);
    }
  } else {
    if (!nameArg) {
      console.error(`❌ No existe una cuenta con ${email}.`);
      console.error('   Regístrala en la web o créala aquí indicando el nombre:');
      console.error(`   npm run db:admin -- ${email} "Tu Nombre"`);
      process.exitCode = 1;
    } else {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const password = await rl.question('Contraseña para la nueva cuenta admin (mín. 8, con letra y número): ');
      rl.close();
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        throw new Error('La contraseña debe tener mínimo 8 caracteres, al menos una letra y un número.');
      }
      const hash = await bcrypt.hash(password, 12);
      await pool.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`, [
        nameArg.trim(),
        email,
        hash,
      ]);
      console.log(`✅ Cuenta admin creada: ${nameArg.trim()} (${email}).`);
    }
  }
  if (!process.exitCode) console.log('👉 Cierra sesión en la web y vuelve a ingresar para ver el panel admin.');
} catch (err) {
  console.error('❌ No se pudo completar:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

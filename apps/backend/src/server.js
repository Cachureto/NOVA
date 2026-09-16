import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

try {
  await pool.query('SELECT 1');
  console.log('✅ Conectado a PostgreSQL');
} catch (err) {
  console.error('❌ No se pudo conectar a PostgreSQL. Revisa DATABASE_URL y que la BD esté encendida.');
  console.error('  ', err.message);
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  console.log(`🚀 NOVA API en http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
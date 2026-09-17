// Carga los datos de ejemplo de db/seeds en orden.
// Uso (desde la raíz del repo): npm run db:seed
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'seeds');
const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

try {
  for (const file of files) {
    await pool.query(await fs.readFile(path.join(dir, file), 'utf8'));
    console.log(`✅ ${file}`);
  }
  const { rows } = await pool.query(
    'SELECT (SELECT count(*) FROM products)::int AS products, (SELECT count(*) FROM drops)::int AS drops',
  );
  console.log(`🌱 Listo: ${rows[0].products} productos y ${rows[0].drops} drops en la base de datos`);
} catch (err) {
  console.error('❌ Error cargando los datos de ejemplo:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

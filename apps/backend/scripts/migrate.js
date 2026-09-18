import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

// Docker corre db/migrations/*.sql solo en el primer arranque del contenedor.
// Este runner permite aplicar migraciones nuevas a una base que ya existe, sin
// borrarla: lleva la cuenta en schema_migrations y solo corre lo que falta.
async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

  const { rows: applied } = await pool.query('SELECT filename FROM schema_migrations');
  const done = new Set(applied.map((r) => r.filename));

  // Base creada por Docker antes de que existiera este registro: sus migraciones
  // ya corrieron aunque no estén anotadas. Se marcan las que crearon el esquema
  // que ya está en la base, para no intentar recrearlo.
  if (done.size === 0) {
    const { rows } = await pool.query(`SELECT to_regclass('public.products') IS NOT NULL AS exists`);
    if (rows[0].exists) {
      const legacy = files.filter((f) => f.startsWith('001') || f.startsWith('002'));
      for (const f of legacy) {
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [f]);
        done.add(f);
      }
      console.log(`ℹ️  Base existente: ${legacy.length} migración(es) marcadas como ya aplicadas.`);
    }
  }

  const pending = files.filter((f) => !done.has(f));
  if (pending.length === 0) {
    console.log('✅ La base ya está al día.');
    return;
  }

  for (const file of pending) {
    const sql = await fs.readFile(path.join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ ${file}: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }
}

try {
  await main();
} catch {
  process.exitCode = 1;
} finally {
  await pool.end();
}

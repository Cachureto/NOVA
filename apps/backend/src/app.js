import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    // Sin "origin" = app móvil, curl o Postman → permitido
    origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
  const { rows } = await pool.query('SELECT now() AS db_time');
  res.json({ status: 'ok', dbTime: rows[0].db_time });
});

app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
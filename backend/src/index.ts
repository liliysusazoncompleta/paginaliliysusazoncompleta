import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { catalogRouter } from './routes/catalog.js';
import { clientesRouter } from './routes/clientes.js';
import { ordersRouter } from './routes/orders.js';
import { aiRouter } from './routes/ai.js';
import { contactRouter } from './routes/contact.js';
import { pool } from './db/pool.js';

const app = express();

const allowedOrigins = new Set(env.frontendUrls);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no origin header) and local frontend origins.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (env.nodeEnv !== 'production') {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
  }),
);
app.use(express.json({ limit: '2mb' }));

// Fotos de producto: se sirven en vivo desde disco (backend/public/productos),
// tanto en dev como en produccion, para no depender de un rebuild del frontend
// cada vez que se agrega o cambia una imagen. Ver public/productos/README.md.
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');
app.use('/productos', express.static(path.join(publicDir, 'productos'), { maxAge: '7d' }));

app.get('/health', async (_req, res) => {
  const db = await pool.query('SELECT NOW()');
  res.json({ ok: true, time: db.rows[0].now });
});

app.use('/api/catalogo', catalogRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/pedidos', ordersRouter);
app.use('/api/ia', aiRouter);
app.use('/api/contacto', contactRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  res.status(400).json({ error: message });
});

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${env.port}`);
});

import { Pool } from 'pg';
import { env } from '../config/env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Proveedores de Postgres en la nube (Render, Neon, Supabase, Railway...) requieren
  // SSL y usan certificados autofirmados/de cadena propia, por eso rejectUnauthorized:false.
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
});

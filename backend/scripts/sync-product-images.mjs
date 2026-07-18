#!/usr/bin/env node
// Vincula automaticamente las fotos que hay en backend/public/productos/ con los
// productos de la tabla `productos`, comparando el nombre del producto contra el
// nombre del archivo. Si un producto no tiene ninguna foto que le corresponda, le
// asigna el logo de la empresa como imagen de respaldo.
//
// Por seguridad corre SIEMPRE en modo "reporte" (no escribe nada en la base de
// datos) a menos que se le pase --apply. Revisa el reporte antes de aplicar:
//
//   cd backend
//   node scripts/sync-product-images.mjs            # solo muestra que haria
//   node scripts/sync-product-images.mjs --apply     # aplica los cambios en la BD
//
// Usa la misma DATABASE_URL de backend/.env.

import 'dotenv/config';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const APPLY = process.argv.includes('--apply');
const MIN_SCORE = 0.4;
const LOGO_FILENAME = 'LOGOLILIYSUSAZONCOMPLETA.jpg';
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'con', 'y', 'a', 'en', 'al', 'para', 'sin',
  'por', 'un', 'una', 'unos', 'unas', 'lb', 'gr', 'gm', 'aprox', 'porcion', 'und',
]);

// Sinonimos/variantes frecuentes en nombres de platos que no son simples errores
// de tipeo (por lo que la comparacion difusa por distancia de edicion no los
// detectaria).
const SYNONYMS = { pay: 'pie' };

const DIACRITICS_RE = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');

// Solo para mensajes de error: muestra host/puerto/nombre de base de datos,
// nunca el usuario ni la password.
function safeHost(connectionString) {
  try {
    const u = new URL(connectionString);
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return '(no se pudo interpretar DATABASE_URL)';
  }
}

function normalize(text) {
  return text
    // separa palabras pegadas en "camelCase" (ej. "TerrinaDePollo" -> "Terrina De Pollo")
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map((w) => SYNONYMS[w] ?? w);
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function wordsMatch(a, b) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  const maxDist = Math.min(a.length, b.length) <= 5 ? 1 : 2;
  return levenshtein(a, b) <= maxDist;
}

// Coeficiente de similitud tipo Jaccard, con emparejamiento difuso palabra a
// palabra (para tolerar errores de tipeo en los nombres de archivo).
function scoreTokens(tokensA, tokensB) {
  const used = new Set();
  let matched = 0;
  for (const ta of tokensA) {
    const idx = tokensB.findIndex((tb, i) => !used.has(i) && wordsMatch(ta, tb));
    if (idx !== -1) {
      used.add(idx);
      matched += 1;
    }
  }
  const union = new Set([...tokensA, ...tokensB]).size || 1;
  return matched / union;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const imagesDir = path.join(here, '../public/productos');

  const files = readdirSync(imagesDir)
    .filter((f) => IMAGE_EXT.test(f) && f !== LOGO_FILENAME)
    .map((filename) => ({
      filename,
      tokens: tokenize(path.parse(filename).name),
      mtime: statSync(path.join(imagesDir, filename)).mtimeMs,
    }));

  const hasLogo = readdirSync(imagesDir).includes(LOGO_FILENAME);
  if (!hasLogo) {
    console.warn(
      `Aviso: no encontre "${LOGO_FILENAME}" dentro de ${imagesDir}. Los productos sin foto quedaran con imagen_url vacio en vez del logo.`,
    );
  }

  // Mismo auto-detect de SSL que backend/src/config/env.ts: los Postgres en la
  // nube (Railway, Render, Neon, Supabase...) casi siempre lo exigen. Sin esto,
  // conectar contra una base de datos remota puede fallar (a veces con un
  // error de autenticacion poco claro en vez de uno de SSL).
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const databaseSsl =
    process.env.DATABASE_SSL === 'true' ||
    (process.env.DATABASE_SSL !== 'false' && !!databaseUrl && !/localhost|127\.0\.0\.1/.test(databaseUrl));

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
  } catch (error) {
    console.error('\nNo se pudo conectar a la base de datos.');
    console.error(`DATABASE_URL (host): ${safeHost(databaseUrl)}`);
    console.error(`SSL: ${databaseSsl ? 'activado' : 'desactivado'}`);
    console.error(
      '\nSi el error es de autenticacion (password/usuario), revisa que DATABASE_URL en backend/.env',
      'tenga exactamente el mismo usuario/password/host/puerto/nombre de base de datos que usa',
      'admonliliysusazoncompleta (comparten la misma base). Copia el connection string desde ahi en vez',
      'de escribirlo a mano, y si la password tiene caracteres especiales (@ # : / % espacio) asegurate',
      'de que esten "percent-encoded" en la URL.\n',
    );
    throw error;
  }

  const { rows: productos } = await client.query(
    `SELECT id_producto, codigo, nombre, imagen_url FROM productos WHERE activo = true ORDER BY nombre ASC`,
  );

  const candidates = [];
  for (const producto of productos) {
    const productTokens = tokenize(producto.nombre);
    for (const file of files) {
      const score = scoreTokens(productTokens, file.tokens);
      if (score >= MIN_SCORE) {
        candidates.push({ producto, file, score });
      }
    }
  }

  // Mejor puntaje primero; en empate, el archivo mas reciente gana (se asume
  // que las fotos subidas mas recientemente son las que se quieren usar).
  candidates.sort((a, b) => b.score - a.score || b.file.mtime - a.file.mtime);

  const assignedProduct = new Map(); // id_producto -> file
  const assignedFile = new Set(); // filename ya usado

  for (const { producto, file, score } of candidates) {
    if (assignedProduct.has(producto.id_producto)) continue;
    if (assignedFile.has(file.filename)) continue;
    assignedProduct.set(producto.id_producto, { file, score });
    assignedFile.add(file.filename);
  }

  const plan = productos.map((producto) => {
    const match = assignedProduct.get(producto.id_producto);
    const newImage = match ? match.file.filename : hasLogo ? LOGO_FILENAME : null;
    return {
      producto,
      newImage,
      score: match ? match.score : null,
      changes: newImage !== producto.imagen_url,
    };
  });

  const matched = plan.filter((p) => p.score !== null);
  const fallback = plan.filter((p) => p.score === null);
  const unusedFiles = files.filter((f) => !assignedFile.has(f.filename));

  console.log(`\nProductos activos: ${productos.length}`);
  console.log(`Fotos encontradas en ${imagesDir}: ${files.length} (+ logo)`);
  console.log(`\n== Coincidencias encontradas (${matched.length}) ==`);
  for (const p of matched) {
    const marker = p.changes ? '->' : '=';
    console.log(
      `  [${(p.score * 100).toFixed(0)}%] ${p.producto.nombre}  ${marker}  ${p.newImage}` +
        (p.changes ? `  (antes: ${p.producto.imagen_url || 'vacio'})` : '  (sin cambios)'),
    );
  }

  console.log(`\n== Sin coincidencia -> se usara el logo (${fallback.length}) ==`);
  for (const p of fallback) {
    console.log(`  ${p.producto.nombre}  ->  ${p.newImage ?? '(sin logo disponible)'}`);
  }

  if (unusedFiles.length) {
    console.log(`\n== Fotos que no quedaron asignadas a ningun producto (${unusedFiles.length}) ==`);
    for (const f of unusedFiles) {
      console.log(`  ${f.filename}`);
    }
  }

  const toApply = plan.filter((p) => p.changes && p.newImage !== null);

  if (!APPLY) {
    console.log(
      `\nModo reporte (no se modifico la base de datos). ${toApply.length} producto(s) cambiarian de imagen_url.`,
    );
    console.log('Para aplicar de verdad: node scripts/sync-product-images.mjs --apply\n');
    await client.end();
    return;
  }

  let updated = 0;
  for (const p of toApply) {
    await client.query('UPDATE productos SET imagen_url = $1 WHERE id_producto = $2', [
      p.newImage,
      p.producto.id_producto,
    ]);
    updated += 1;
  }

  console.log(`\nListo: se actualizo imagen_url en ${updated} producto(s).\n`);
  await client.end();
}

main().catch((error) => {
  console.error('Error ejecutando el script:', error);
  process.exitCode = 1;
});

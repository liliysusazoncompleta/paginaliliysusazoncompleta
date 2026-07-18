# paginaliliysusazoncompleta

Sitio web de catalogo/tienda online para **Lili y su Sazon Completa** (eslogan: **Sabor de Familia**), con frontend en React + Vite (multipagina, con React Router) y backend en Express + PostgreSQL.

## Objetivo

Permitir que clientes:

- Naveguen el sitio como paginas independientes: **Sobre Nosotros** (home), **Catalogo**, **Contacto** y **Finaliza tu Pedido** (checkout).
- Exploren el catalogo de productos activos (`productos` + `tipo_producto`).
- Filtren por categoria (con contador de productos) y busquen por nombre.
- Armen carrito de compra que persiste al moverse entre paginas.
- Diligencien formulario de entrega con autocompletado por telefono (lectura desde `clientes`).
- Recuperen datos automaticamente si ya son clientes ingresando su numero telefonico.
- Registren observaciones opcionales del pedido (indicaciones especiales de entrega o producto).
- Generen prefactura PDF y descarguen la carta completa del negocio en PDF.
- Confirmen por WhatsApp con mensaje preformateado.
- Escriban desde el formulario de Contacto, que envia un correo real al negocio.

> El flujo publico **no guarda pedidos en base de datos**. Solo lee catalogo/clientes, genera prefactura y redirige a WhatsApp.

## Arquitectura de backend (dos backends, una sola base de datos)

Este sitio comparte la base de datos Postgres de produccion con el panel
administrativo interno **`admonliliysusazoncompleta`** (repositorio aparte).
Actualmente `VITE_API_URL` del frontend apunta a **ese** backend, no al
`backend/` de este repositorio, porque es el que ya esta desplegado y
conectado a la base de datos real:

| Funcionalidad | Backend que la resuelve hoy | Detalle |
| --- | --- | --- |
| Categorias (`/api/catalogo/categorias`) | `admonliliysusazoncompleta` | Rutas nuevas agregadas ahi (`server/routes/catalogoPublico.routes.js`), sin autenticacion, solo lectura. |
| Productos (`/api/catalogo/productos`) | `admonliliysusazoncompleta` | Idem, `server/controllers/catalogoPublicoController.js`. |
| Imagenes de producto | `backend/` **de este repo**, ya desplegado en Railway | Carpeta `backend/public/productos/` + `pnpm sync-images` (ver seccion "Imagenes de productos" abajo). No usa las imagenes que sube el panel admin. |
| Prefactura / carta PDF / contacto / chatbot IA | `backend/` **de este repo**, desplegado pero **el frontend aun no le apunta** | Estas rutas (`/api/pedidos/*`, `/api/contacto`, `/api/ia/*`) **no existen** en `admonliliysusazoncompleta`. `VITE_API_URL` sigue apuntando solo a ese backend (para categorias/productos), asi que checkout/contacto/chatbot no responden todavia en produccion. |

**Estado actual:** `backend/` de este repo ya esta desplegado en Railway
(servicio `paginaliliysusazoncompleta`, Root Directory `/backend` — ver
seccion de despliegue mas abajo), y `VITE_ASSETS_URL` ya apunta ahi, asi que
las imagenes de producto cargan igual en dev y en produccion **siempre que la
base de datos de produccion tenga `imagen_url` sincronizado** (ver aviso en
"Imagenes de productos"). Lo que sigue pendiente es el checkout (generar
prefactura), el formulario de Contacto y el chatbot, porque esas rutas viven
en `backend/` y `VITE_API_URL` todavia no apunta ahi (sigue apuntando a
`admonliliysusazoncompleta`, que no las tiene). Para restaurarlas hay dos
caminos:

1. Ajustar el frontend para que las llamadas que correspondan
   (`generarPrefactura`, `descargarPrefacturaPdf`, `sendContactMessage`,
   `getChatbotAnswer`, `getCatalogoPdfUrl`) usen la URL de `backend/`
   (`https://paginaliliysusazoncompleta-production.up.railway.app/api`) en
   vez de `VITE_API_URL`, o
2. Portar esas rutas tambien a `admonliliysusazoncompleta`, siguiendo el
   mismo patron que `catalogoPublico.routes.js` (publicas o protegidas con
   `apiKeyAuth`, segun el caso).

## Paginas del sitio (frontend)

El frontend es una SPA multipagina (`react-router-dom`), con un layout compartido (header + footer + chat + boton flotante de WhatsApp) y estas rutas:

| Ruta         | Pagina                          | Descripcion                                                                 |
| ------------ | -------------------------------- | ---------------------------------------------------------------------------- |
| `/`          | `HomePage` (Sobre Nosotros)      | Hero, historia de la marca y "Favoritos de la Casa" (productos destacados). |
| `/catalogo`  | `CatalogPage`                    | Buscador, filtro de categorias con contador y grid de productos.            |
| `/contacto`  | `ContactPage`                    | Formulario de contacto (envia correo real) + WhatsApp, Instagram y horarios.|
| `/pedido`    | `CheckoutPage`                   | Resumen del carrito + datos personales/entrega + generar prefactura.        |

El estado del carrito, catalogo, filtros y datos del cliente vive en un contexto compartido (`frontend/src/lib/CartContext.tsx`) para que el pedido persista al navegar entre paginas.

## Estructura del repositorio

```text
paginaliliysusazoncompleta/
├── frontend/
│   ├── public/
│   │   ├── logo-lili.png              # Logo real (extraido de la carta de referencia)
│   │   └── logo-lili-placeholder.svg  # Fallback si logo-lili.png no carga
│   └── src/
│       ├── components/
│       │   ├── Layout.tsx             # Shell: header + <Outlet/> + footer + chat + WhatsApp flotante
│       │   ├── Header.tsx             # Navegacion por rutas (NavLink) + icono de carrito
│       │   ├── ProductCard.tsx        # Tarjeta de producto (imagenes livianas + badges superpuestos)
│       │   ├── ChatAssistant.tsx      # Asistente IA
│       │   └── WhatsAppFloating.tsx   # Boton flotante de WhatsApp
│       ├── pages/
│       │   ├── HomePage.tsx           # /
│       │   ├── CatalogPage.tsx        # /catalogo
│       │   ├── ContactPage.tsx        # /contacto
│       │   └── CheckoutPage.tsx       # /pedido
│       ├── lib/
│       │   ├── CartContext.tsx        # Estado global: carrito, catalogo, formulario, submitOrder
│       │   ├── api.ts                 # Llamadas al backend (fetch)
│       │   └── utils.ts               # formatCOP, downloadBlob
│       ├── App.tsx                    # Definicion de rutas (React Router)
│       ├── main.tsx                   # BrowserRouter + render
│       └── styles.css
├── backend/
│   ├── assets/
│   │   └── logo-lili.png              # Logo embebido en la carta PDF
│   ├── public/
│   │   └── productos/                 # Fotos de producto, servidas en GET /productos/*
│   ├── scripts/
│   │   └── sync-product-images.mjs    # Vincula fotos de productos/ con la tabla productos
│   └── src/
│       ├── routes/
│       │   ├── catalog.ts             # /api/catalogo/*
│       │   ├── clientes.ts            # /api/clientes/*
│       │   ├── orders.ts              # /api/pedidos/*
│       │   ├── ai.ts                  # /api/ia/*
│       │   └── contact.ts             # /api/contacto (nuevo)
│       ├── services/
│       │   ├── pdf.ts                 # PreFactura + Carta PDF (tamano carta)
│       │   ├── mailer.ts              # Envio de correo por SMTP (nuevo)
│       │   └── ai.ts                  # Chatbot
│       ├── db/
│       │   ├── pool.ts
│       │   └── queries.ts             # Excluye categorias administrativas (ver abajo)
│       └── config/env.ts
├── db/
│   └── migrations/
├── docs/
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── render.yaml           # Deploy del backend en Render (Blueprint)
├── railway.json          # Deploy del backend en Railway (Root Directory = raiz del repo)
├── nixpacks.toml         # Fases de build si Railway usa la raiz del repo como Root Directory
└── README.md
```

> `backend/` tambien tiene su **propio** `nixpacks.toml`
> (`backend/nixpacks.toml`), usado cuando el servicio de Railway tiene
> configurado **Root Directory = `/backend`** (que es como esta desplegado
> hoy este proyecto) — en ese caso Railway ignora el `railway.json` y
> `nixpacks.toml` de la raiz porque quedan fuera del contexto de build. Ver
> "Backend: desplegar en un host que ejecute Node" mas abajo para el detalle
> de por que existen ambos.

## Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL activo con el esquema existente

## Variables de entorno

### Backend (`backend/.env`)

Crear `backend/.env` a partir de `backend/.env.example`:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/LiliysuSazonCompleta_DB
# En produccion DATABASE_URL debe ser un Postgres accesible desde internet (no localhost).
# DATABASE_SSL=true fuerza SSL (se activa solo si DATABASE_URL no es localhost).
DATABASE_SSL=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_PHONE=573177719249
# Origen(es) permitidos por CORS, separados por coma si son varios.
# En produccion: la URL de GitHub Pages (https://liliysusazoncompleta.github.io).
FRONTEND_URL=http://localhost:5173

# Envio de correo del formulario de Contacto (ver seccion "Envio de correo")
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=liliysusazoncompleto@gmail.com
CONTACT_FROM_EMAIL=Lili y su Sazon Completa <no-reply@liliysusazoncompleta.com>
```

> **Nota:** en desarrollo local, si `FRONTEND_URL` no esta definido, el backend acepta por
> defecto `http://localhost:5173`, `http://127.0.0.1:5173` y `https://liliysusazoncompleta.github.io`
> (ver `backend/src/config/env.ts`), asi que no es obligatorio configurarlo salvo que el
> dominio de GitHub Pages cambie.

### Frontend (`frontend/.env`)

Crear `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL=/api
VITE_WHATSAPP_PHONE=573177719249
# Opcional: solo necesario si el frontend y el backend quedan en dominios
# distintos en produccion (ver seccion "Imagenes de productos").
# VITE_ASSETS_URL=https://api.tu-dominio.com/productos
```

En **produccion** (`frontend/.env.production`), `VITE_API_URL` y `VITE_ASSETS_URL`
hoy apuntan a backends distintos (ver "Arquitectura de backend" arriba):

```env
# Categorias/productos: backend del panel admin (admonliliysusazoncompleta).
VITE_API_URL=https://admonliliysusazoncompleta-production.up.railway.app/api
# Imagenes de producto: backend propio de este repo, ya desplegado en Railway.
VITE_ASSETS_URL=https://paginaliliysusazoncompleta-production.up.railway.app/productos
VITE_WHATSAPP_PHONE=573177719249
```

## Migraciones SQL

La migracion requerida esta en:

- `db/migrations/20260709_add_hora_entrega_to_ventas.sql`

Aplica:

```sql
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS hora_entrega TIME;
```

Puedes ejecutarla con tu cliente SQL favorito o psql.

## Comandos pnpm

### Instalacion inicial (desde raiz)

```bash
pnpm install
```

> Si el backend no arranca despues de actualizar el codigo (error `ECONNREFUSED` en el proxy de Vite), casi siempre significa que falta correr `pnpm install` tras agregar una dependencia nueva (por ejemplo `nodemailer` o `react-router-dom`).

### Desarrollo (frontend + backend)

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health backend: `http://localhost:4000/health`

### Build de produccion (desde raiz)

```bash
pnpm build
```

### Ejecutar backend compilado

```bash
pnpm start
```

## Endpoints principales

Definidos en `backend/` (este repo). En produccion, categorias/productos se
sirven en la practica desde `admonliliysusazoncompleta` (ver "Arquitectura de
backend" arriba); el resto solo funciona si `backend/` esta desplegado.

- `GET /api/catalogo/categorias` — categorias activas, sin las administrativas ocultas.
- `GET /api/catalogo/productos?categoriaId=&search=`
- `GET /api/catalogo/pdf` — descarga `Carta_Lili_Sazon_Completa.pdf` (catalogo completo, tamano carta).
- `GET /api/clientes/by-telefono/:telefono`
- `POST /api/ia/chat`
- `POST /api/pedidos/prefactura`
- `POST /api/pedidos/prefactura/pdf`
- `POST /api/contacto` — envia el formulario de Contacto por correo (nuevo).

En `admonliliysusazoncompleta/server` (repositorio aparte), agregados para que
la tienda publica pueda leer el catalogo sin login:

- `GET /api/catalogo/categorias` — `server/routes/catalogoPublico.routes.js`, publica.
- `GET /api/catalogo/productos?categoriaId=&search=` — idem, publica.

## Categorias ocultas de la tienda publica

Las categorias administrativas **Negocio**, **Domicilio**, **Combos** y **Otros** nunca se muestran al publico: se excluyen centralizadamente en `backend/src/db/queries.ts` (`HIDDEN_CATEGORIES`), por lo que quedan fuera automaticamente del filtro de categorias, el grid del catalogo, los favoritos del home y la carta en PDF. Para ocultar una categoria adicional, agrega su nombre (en minusculas) a esa constante.

## Carta del negocio en PDF

El boton **"Descargar Carta PDF"** (pagina `/catalogo`) genera siempre el catalogo completo (sin importar el filtro activo) en `backend/src/services/pdf.ts` → `buildCatalogoPdf`:

- Tamano **carta** (Letter, 612×792pt / 8.5×11in).
- Portada con el logo real de la marca, tagline y redes sociales.
- Una pagina por categoria, con tabla de 2 columnas (NOMBRE, TIPO, CANTIDAD, VALOR), encabezado naranja y filas alternadas blanco/crema — replicando el diseno de referencia de la marca.
- Salto de pagina automatico si una categoria tiene demasiados productos para una sola hoja.
- Nombre de archivo: `Carta_Lili_Sazon_Completa.pdf`.
- El logo (`backend/assets/logo-lili.png` y `frontend/public/logo-lili.png`) fue extraido directamente del PDF de referencia de la marca.

## Factura de un pedido (prefactura)

Al confirmar un pedido (`POST /api/pedidos/prefactura/pdf`), `backend/src/services/pdf.ts` → `buildPrefacturaPdf` genera una factura tamano carta con el formato de referencia del negocio:

- Encabezado con logo, "PreFactura" (en rojo), nombre/Nit/telefonos/ciudad del negocio (centrado) y fechas de elaboracion/entrega/hora (a la derecha).
- Cajas de **Datos del Cliente** y **Nota** (solo el aviso de que los asesores se comunicaran para confirmar el pedido al numero registrado; ya no muestra cuenta bancaria ni datos de pago). La altura de ambas cajas se ajusta automaticamente segun cuanto texto tengan.
- Tabla de detalle (ITEM, DESCRIPCION, Cant., V. Unit., Total), Subtotal y TOTAL (el domicilio no se cobra ni se muestra como linea; solo aparece una nota aclarando que su valor se notificara en la factura enviada por Lili y su Sazon Completa).
- Banner final "Gracias por tu compra!" con instrucciones de pago por WhatsApp, Instagram y direccion del negocio.
- Nombre de archivo: `nombre_del_cliente_DDMMYYYY.pdf` (por ejemplo `monica_arango_11072026.pdf`), usando la fecha de elaboracion.

Los datos del negocio y las notas se configuran por variables de entorno (`backend/.env`):

```env
BUSINESS_NIT=43.089.544-4
BUSINESS_REGIMEN=Regimen Simplificado
BUSINESS_PHONE_FIXED=(604) 5955045
BUSINESS_CITY=Medellin - Ant.
BUSINESS_ADDRESS="Calle 112 # 51A-15, Medellin, Antioquia, Colombia"
INSTAGRAM_HANDLE=@liliysusazoncompleta
ADVISOR_CONFIRMATION_NOTE=Nuestros asesores se comunicaran para confirmar tu pedido al numero registrado.
DELIVERY_NOTICE_NOTE=El valor del domicilio sera notificado en la factura enviada por Lili y su Sazon Completa.
```

> `BANK_NAME`, `BANK_ACCOUNT_TYPE`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER`, `BANK_ACCOUNT_HOLDER_ID` y `PAYMENT_DEPOSIT_NOTE` siguen soportados en `backend/.env` por si se vuelven a mostrar en el futuro, pero **ya no se imprimen** en la prefactura.

> **Ojo con el simbolo `#`:** en un archivo `.env`, todo lo que va despues de un `#` se interpreta como comentario y se descarta, a menos que el valor completo vaya entre comillas. Por eso `BUSINESS_ADDRESS` va entre comillas dobles (tiene un `#` en la direccion) — sigue ese mismo patron si agregas otro valor con `#`, `%` no necesita comillas.

La carta completa del catalogo (`GET /api/catalogo/pdf`) es un documento distinto, ver seccion anterior.

## Envio de correo (formulario de Contacto)

El formulario de `/contacto` llama a `POST /api/contacto`, que usa `backend/src/services/mailer.ts` (nodemailer) para enviar un correo a `CONTACT_TO_EMAIL` con los datos del mensaje (nombre, telefono, correo opcional y mensaje), usando `replyTo` con el correo del cliente si lo escribio.

Configuracion por variables de entorno (`backend/.env`):

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=liliysusazoncompleto@gmail.com
CONTACT_FROM_EMAIL=Lili y su Sazon Completa <no-reply@liliysusazoncompleta.com>
```

Si `SMTP_HOST`/`SMTP_USER` no estan configurados, el endpoint responde un error controlado en vez de fallar de forma silenciosa.

> **Importante sobre Mailtrap:** si usas un proyecto de tipo *Email Testing (Sandbox)* de Mailtrap, los correos **no llegan a una bandeja real** — quedan capturados dentro del sandbox de Mailtrap para pruebas. Para que los mensajes lleguen de verdad a `CONTACT_TO_EMAIL`, activa un dominio de envio en modo produccion en Mailtrap (o usa Gmail SMTP / otro proveedor) y actualiza `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`.

## Imagenes de productos

Carpeta oficial: **`backend/public/productos/`** (ver `README.md` dentro de esa carpeta).
El backend la sirve en vivo con `express.static` en `GET /productos/<archivo>`, tanto en
desarrollo como en produccion, sin necesidad de reconstruir ni redesplegar el frontend
cada vez que se agrega o cambia una foto.

**Como usarla:** sube el archivo a `backend/public/productos/` y en la base de datos,
tabla `productos`, columna `imagen_url`, escribe solo el nombre del archivo (por
ejemplo `sancocho-costilla.jpg`). El frontend acepta 3 formas en `imagen_url`:

- Solo el nombre del archivo (`sancocho-costilla.jpg`) → se resuelve contra la carpeta de arriba.
- Una ruta ya absoluta (`/productos/archivo.jpg`).
- Una URL externa completa (`https://...`), por si prefieres alojar la foto en otro lado (Instagram, Cloudinary, etc.).

**Sincronizar automaticamente (`backend/scripts/sync-product-images.mjs`):** en vez de
editar `imagen_url` producto por producto, este script compara los nombres de los
productos en la base de datos contra los archivos de `backend/public/productos/`
(tolera tildes, mayusculas/minusculas y errores de tipeo) y arma la asignacion solo. A
los productos sin ninguna foto parecida les asigna el logo de la empresa
(`LOGOLILIYSUSAZONCOMPLETA.jpg`) como respaldo.

```bash
cd backend
pnpm sync-images          # modo reporte: muestra que cambiaria, no toca la base de datos
pnpm sync-images:apply    # aplica los cambios ya revisados
```

Corre siempre primero `pnpm sync-images` (sin `--apply`) y revisa el reporte — lista
cada producto con la foto que le asignaria y el % de confianza, los productos que
quedarian con el logo por no tener coincidencia, y los archivos que sobraron sin
usarse — antes de correr `pnpm sync-images:apply` para escribir de verdad en la base
de datos. Mas detalle en `backend/public/productos/README.md`.

> **Importante — corre el script contra la base de datos de PRODUCCION, no solo
> en local.** `pnpm sync-images:apply` escribe usando el `DATABASE_URL` que tenga
> `backend/.env` en ese momento. Si solo lo corriste una vez contra tu Postgres
> local, `imagen_url` queda sincronizado ahi (por eso en `pnpm dev` las fotos y el
> logo de respaldo se ven correctos), pero la base de datos compartida en la nube
> (la misma que usa `admonliliysusazoncompleta`) puede seguir con `imagen_url`
> vacio o desactualizado, y en produccion se veran fotos genericas del banco de
> Unsplash en vez de las fotos reales o el logo. Para corregirlo, apunta
> temporalmente `backend/.env` → `DATABASE_URL` al Postgres de produccion y vuelve
> a correr `pnpm sync-images` (revisa el reporte) y luego `pnpm sync-images:apply`.

**Resolucion de imagenes (en orden):**

1. `productos.imagen_url` (si esta definido y el archivo existe).
2. Si no, una imagen de plato cocinado acorde al tipo del producto (banco curado de fotos de Unsplash por palabra clave en el nombre).
3. Si no hay coincidencia por palabra clave, una imagen generica de respaldo (ya no depende del servicio `source.unsplash.com`, que fue descontinuado por Unsplash).

Las imagenes se piden en tamanos reducidos (imagenes de producto ~640px/calidad 60,
imagenes de portada ~900-1000px/calidad 65) para que la pagina cargue mas liviana, con
`loading="lazy"` y `decoding="async"`.

**Frontend y backend en dominios distintos en produccion:** si el frontend se publica
como sitio estatico en un dominio y el backend en otro, define `VITE_ASSETS_URL` en
`frontend/.env` apuntando a la URL absoluta del backend
(`https://api.tu-dominio.com/productos`), para que el sitio arme la URL completa hacia
las imagenes en vez de asumir que viven en el mismo dominio del frontend. Si comparten
dominio (por ejemplo detras del mismo reverse proxy), no hace falta configurar nada.

Vite en desarrollo ya incluye un proxy de `/productos` hacia el backend
(`frontend/vite.config.ts`), asi que `http://localhost:5173/productos/archivo.jpg`
funciona igual que en produccion.

## Flujo de pedido y WhatsApp

1. Usuario agrega productos al carrito desde `/catalogo` (o desde los favoritos en `/`).
2. En `/pedido` completa **Datos Personales** y **Programar Entrega**.
3. Al ingresar telefono se recuperan datos automaticamente si ya es cliente.
4. Usuario puede editar direccion, completar datos faltantes y agregar observaciones opcionales.
5. Al confirmar:
   - backend genera resumen y referencia
   - backend responde URL `wa.me` con mensaje predefinido
   - backend genera PDF de prefactura (incluye observaciones si existen)
6. Frontend descarga PDF y abre WhatsApp en nueva pestana.

## Chatbot IA integrado

- Frontend envía mensaje a `/api/ia/chat`.
- Backend consulta modelo (OpenAI) usando `OPENAI_API_KEY`.
- Si no hay API key, responde fallback local para entorno de desarrollo.
- La key nunca se expone en frontend.

## Accesibilidad y UX

- Diseño responsive mobile-first.
- Contrastes legibles y estados hover/focus.
- Navegacion por paginas reales (con boton atras/adelante del navegador funcionando) en pocos clics.
- Menu principal siempre visible (header sticky) para facilitar la navegacion del cliente.
- Microanimacion tipo vapor en identidad visual.

## Despliegue en produccion (GitHub Pages + backend en la nube)

GitHub Pages **solo sirve archivos estaticos**: puede publicar el frontend compilado, pero
no puede ejecutar el backend Node/Express ni conectarse a un Postgres que corra en
`localhost` de tu computador. Por eso el sitio en `https://liliysusazoncompleta.github.io/paginaliliysusazoncompleta/`
necesita 3 piezas desplegadas por separado:

| Pieza      | Donde vive                                   | Config clave |
| ---------- | --------------------------------------------- | ------------ |
| Frontend   | GitHub Pages (estatico)                       | `frontend/.env.production` → `VITE_API_URL`, `VITE_ASSETS_URL` |
| Backend    | Un host que ejecute Node (Render, Railway, Fly.io, VPS...) | `DATABASE_URL`, `FRONTEND_URL`, `SMTP_*`, etc. |
| Base de datos | Un Postgres accesible por internet (Neon, Supabase, Render Postgres, Railway Postgres...) | `DATABASE_URL` del backend |

### 1) Base de datos: migrar Postgres a un proveedor en la nube

Tu Postgres actual (`postgresql://postgres:***@localhost:5432/LiliysuSazonCompleta_DB`) solo
es accesible desde tu propio computador, asi que un backend desplegado en internet no puede
llegar a el. Elige un proveedor con capa gratuita (Neon, Supabase y Render Postgres son las
opciones mas simples) y migra los datos:

```bash
# 1. Volcar tu base de datos local
pg_dump -Fc -U postgres -h localhost -p 5432 LiliysuSazonCompleta_DB > lili_backup.dump

# 2. Restaurar en la base de datos en la nube (reemplaza por tu connection string real)
pg_restore -d "postgresql://usuario:password@host-remoto/nombre_bd?sslmode=require" lili_backup.dump
```

Guarda el connection string que te de el proveedor (empieza con `postgresql://...`,
normalmente con `?sslmode=require`) — es tu nuevo `DATABASE_URL` de produccion.

### 2) Backend: desplegar en un host que ejecute Node

Este repo ya incluye `render.yaml` en la raiz para desplegar en [Render](https://render.com)
con un clic (New > Blueprint > selecciona este repositorio), y `railway.json` para
desplegar en [Railway](https://railway.app) (New > GitHub Repo > selecciona este
repositorio; Railway detecta `railway.json` y usa esos comandos de build/arranque
automaticamente). Si prefieres otro proveedor (Fly.io, un VPS con PM2/Docker), la idea es la misma:

- Build: `pnpm install --frozen-lockfile && pnpm --filter @lili/backend build`
- Start: `pnpm --filter @lili/backend start`
- Variables de entorno obligatorias: `DATABASE_URL` (el de la nube, paso 1), `DATABASE_SSL=true`,
  `FRONTEND_URL=https://liliysusazoncompleta.github.io`, `NODE_ENV=production`, mas las de
  SMTP/OpenAI/negocio que ya usas en `backend/.env`.
- Anota la URL publica que te asigne el proveedor (ej. `https://lili-sazon-backend.onrender.com`) — la necesitas en el paso siguiente.

> El plan gratuito de Render "duerme" el servicio tras inactividad; la primera peticion
> despues de dormir puede tardar unos segundos en responder. Es normal.

#### Notas del despliegue real en Railway (Root Directory = `/backend`)

Este proyecto quedo desplegado en Railway con **Root Directory = `/backend`**
(Settings → Root Directory), no la raiz del repo. Eso importa porque Railway
solo lee archivos de configuracion (`nixpacks.toml`, `railway.json`) que
esten **dentro** de esa carpeta — por eso existe `backend/nixpacks.toml`
ademas del `nixpacks.toml`/`railway.json` de la raiz (que solo aplican si
alguna vez cambias Root Directory a la raiz del repo).

Dos problemas se resolvieron ahi durante el primer despliegue, por si vuelven
a aparecer con otro proveedor o version de Nixpacks:

1. **`corepack prepare pnpm@... --activate` falla con `Internal Error: Cannot
   find matching keyid`.** Es un bug conocido de `corepack` verificando la
   firma del paquete `pnpm` contra su base de llaves interna, en algunas
   imagenes de Nixpacks. Se evita no usando `corepack`: como
   `backend/package.json` no depende de nada del workspace pnpm (`workspace:`
   protocol), se instala con `npm` directamente.
2. **`sh: tsc: not found` aunque el install "corrio bien".** Nixpacks fija
   `NODE_ENV=production` por defecto durante el build, y un `npm install`
   plano respeta esa variable y **omite `devDependencies`** (donde vive
   `typescript`). Se soluciona forzando `npm install --include=dev`.

`backend/nixpacks.toml` resultante:

```toml
providers = ["node"]

[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install --include=dev"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### 3) Frontend: apuntar al backend real

Edita `frontend/.env.production` (ya existe en el repo con placeholders) y reemplaza
`TU_BACKEND_PUBLICO` por la URL del paso 2:

```env
VITE_API_URL=https://lili-sazon-backend.onrender.com/api
VITE_ASSETS_URL=https://lili-sazon-backend.onrender.com/productos
VITE_WHATSAPP_PHONE=573177719249
```

> Si `VITE_API_URL` queda apuntando a un backend inexistente o a `/api` (relativo), el
> catalogo no cargara en GitHub Pages porque `github.io` no ejecuta tu backend.

### 4) Publicar el frontend en GitHub Pages (paso a paso)

Este repo queda preparado para publicar el frontend de forma manual con `gh-pages`, igual
que en el flujo del proyecto administrativo adjunto. La publicacion sale desde la carpeta
`frontend/dist`, no desde GitHub Actions.

#### Resumen rapido

Primera publicacion:

```bash
pnpm install
git add .
git commit -m "Prepara despliegue"
git push origin main
pnpm deploy:frontend
```

Publicaciones posteriores:

```bash
git add .
git commit -m "Actualiza sitio"
git push origin main
pnpm deploy:frontend
```

#### Paso 4.1) Confirmar el nombre del repositorio

En este proyecto, `frontend/vite.config.ts` usa:

```ts
base: '/paginaliliysusazoncompleta/'
```

Eso significa que GitHub Pages publicara el frontend bajo:

```text
https://TU_USUARIO.github.io/paginaliliysusazoncompleta/
```

Si cambias el nombre del repositorio, tambien debes actualizar ese `base` en
`frontend/vite.config.ts`; de lo contrario, el sitio puede abrir sin estilos, sin logo o
sin rutas funcionando correctamente.

#### Paso 4.2) Revisar `frontend/.env.production`

Antes de publicar, deja configurado el frontend para apuntar al backend real:

```env
VITE_API_URL=https://lili-sazon-backend.onrender.com/api
VITE_ASSETS_URL=https://lili-sazon-backend.onrender.com/productos
VITE_WHATSAPP_PHONE=573177719249
```

Si aqui dejas una URL placeholder, una URL caida o un `/api` relativo, el catalogo no
cargara cuando el sitio este en `github.io`.

#### Paso 4.3) Instalar dependencias y compilar el frontend

Desde la raiz del repo:

```bash
pnpm install
pnpm build
```

Si solo quieres compilar/publicar el frontend, tambien puedes usar:

```bash
pnpm --filter @lili/frontend build
```

Si este build falla, no sigas con la publicacion hasta corregirlo.

#### Paso 4.4) Publicar a la rama `gh-pages`

Desde la raiz del repo:

```bash
pnpm deploy:frontend
```

O, si prefieres hacerlo dentro de `frontend/`:

```bash
cd frontend
pnpm run deploy
```

Ese comando hace esto:

1. Ejecuta el build del frontend.
2. Toma el contenido de `frontend/dist`.
3. Lo publica en la rama `gh-pages` del repositorio.

> La rama `gh-pages` no la editas a mano. La genera y actualiza el comando de deploy.

#### Paso 4.5) Configurar GitHub Pages en el repositorio

En GitHub, entra a tu repositorio y configura esto una sola vez:

1. Abre **Settings**.
2. En el menu lateral, entra a **Pages**.
3. En **Source**, selecciona **Deploy from a branch**.
4. En **Branch**, selecciona `gh-pages`.
5. En **Folder**, deja `/(root)`.
6. Guarda la configuracion.

> Si la rama `gh-pages` aun no aparece, ejecuta primero `pnpm deploy:frontend` una vez y
> luego vuelve a **Settings > Pages** para seleccionarla.

#### Paso 4.6) Hacer commit de la configuracion final

Conviene dejar la configuracion publicada tambien guardada en el repositorio, para no perder
el estado del despliegue entre maquinas o ramas. Antes de publicar:

```bash
git status
git add frontend/.env.production frontend/src README.md package.json frontend/package.json pnpm-lock.yaml
git commit -m "Prepara despliegue a GitHub Pages"
```

Si tienes mas cambios validos para publicar, puedes hacer `git add .` en lugar de agregar
archivos puntuales.

#### Paso 4.7) Subir a `main`

Si tambien vas a desplegar el backend con Render/Railway desde `main`, sube tus cambios
normales al repositorio:

```bash
git push origin main
```

Eso publica el codigo fuente actualizado. La pagina estara visible en GitHub Pages cuando
hayas corrido `pnpm deploy:frontend`.

#### Paso 4.8) Verificar la publicacion

Despues de correr `pnpm deploy:frontend`:

1. Espera a que GitHub Pages actualice la rama `gh-pages`.
2. Abre la URL publicada.
3. Si aun ves la version vieja, recarga sin cache con `Ctrl + F5`.

La URL esperada para este repo es:

```text
https://liliysusazoncompleta.github.io/paginaliliysusazoncompleta/
```

#### Paso 4.9) Comprobar que quedo bien

Al abrir la web publicada, verifica al menos esto:

1. El logo aparece en el header.
2. Navegan bien `/`, `/catalogo`, `/contacto` y `/pedido`.
3. El catalogo muestra productos reales.
4. Las imagenes de productos cargan desde el backend.
5. El chat y el formulario de contacto no muestran errores de conexion.

#### Paso 4.10) Si GitHub Pages publica pero la pagina falla

Los fallos mas comunes son estos:

1. El sitio abre, pero el catalogo no carga.
   Causa habitual: `frontend/.env.production` apunta a un backend incorrecto o el backend esta apagado.
2. El sitio abre sin logo o con rutas rotas.
   Causa habitual: el nombre del repo no coincide con el `base` de `frontend/vite.config.ts`.
3. `pnpm deploy:frontend` falla localmente.
   Revisa el build del frontend; normalmente sera por TypeScript, dependencias sin instalar o un archivo `.env.production` mal preparado.
4. El backend responde localmente pero no en produccion.
   Verifica `DATABASE_URL`, `DATABASE_SSL=true`, `FRONTEND_URL` y que el proveedor (Render/Railway) haya terminado de desplegar.

#### Paso 4.11) Comando completo para publicar cambios normales

Cuando ya dejaste Pages configurado una vez, el ciclo normal de publicacion queda asi:

```bash
git add .
git commit -m "Actualiza sitio"
git push origin main
pnpm deploy:frontend
```

Si prefieres publicar primero y luego subir el codigo fuente, tambien funciona; lo importante
es no olvidar el `pnpm deploy:frontend`, porque ese es el paso que actualiza `github.io`.

#### Paso 4.12) Checklist final antes de publicar

1. `frontend/.env.production` apunta al backend real.
2. `pnpm build` termina sin errores.
3. El repo ya tiene Pages configurado con rama `gh-pages`.
4. Ya hiciste `git push origin main` si quieres dejar el codigo fuente actualizado en GitHub.
5. Ejecutaste `pnpm deploy:frontend`.

### 5) Migraciones SQL

Ejecuta las migraciones de `db/migrations` contra la base de datos en la nube (paso 1)
antes del primer despliegue del backend.

### 6) Integracion WhatsApp

Actualmente via URL `wa.me`. Para automatizaciones empresariales, migrar a WhatsApp
Business API oficial.

### 7) Correo

Reemplaza el sandbox de pruebas de Mailtrap por un dominio de envio en produccion antes
de lanzar (ver seccion "Envio de correo").

## Roadmap sugerido

- Persistencia de pedidos en panel admin.
- Pasarela de pagos (Wompi/PayU/Mercado Pago/Stripe).
- PWA instalable.
- Recomendaciones IA avanzadas y busqueda semantica.
- Analitica de conversion y mapas de calor.

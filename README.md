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
└── README.md
```

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
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_PHONE=573177719249
FRONTEND_URL=http://localhost:5173

# Envio de correo del formulario de Contacto (ver seccion "Envio de correo")
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=liliysusazoncompleto@gmail.com
CONTACT_FROM_EMAIL=Lili y su Sazon Completa <no-reply@liliysusazoncompleta.com>
```

### Frontend (`frontend/.env`)

Crear `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL=/api
VITE_WHATSAPP_PHONE=573177719249
# Opcional: solo necesario si el frontend y el backend quedan en dominios
# distintos en produccion (ver seccion "Imagenes de productos").
# VITE_ASSETS_URL=https://api.tu-dominio.com/productos
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

- `GET /api/catalogo/categorias` — categorias activas, sin las administrativas ocultas.
- `GET /api/catalogo/productos?categoriaId=&search=`
- `GET /api/catalogo/pdf` — descarga `Carta_Lili_Sazon_Completa.pdf` (catalogo completo, tamano carta).
- `GET /api/clientes/by-telefono/:telefono`
- `POST /api/ia/chat`
- `POST /api/pedidos/prefactura`
- `POST /api/pedidos/prefactura/pdf`
- `POST /api/contacto` — envia el formulario de Contacto por correo (nuevo).

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
- Cajas de **Datos del Cliente** e **Informacion para el Pago** (cuenta bancaria, nota de deposito y nota de que los asesores confirmaran el pedido al numero registrado). La altura de ambas cajas se ajusta automaticamente segun cuanto texto tengan.
- Tabla de detalle (ITEM, DESCRIPCION, Cant., V. Unit., Total), Subtotal, Domicilio (si aplica, con nota aclarando que el valor se notificara en la factura enviada por Lili y su Sazon Completa) y TOTAL.
- Banner final "Gracias por tu compra!" con instrucciones de pago por WhatsApp, Instagram y direccion del negocio.
- Nombre de archivo: `nombre_del_cliente_DDMMYYYY.pdf` (por ejemplo `monica_arango_11072026.pdf`), usando la fecha de elaboracion.

Los datos del negocio, la cuenta bancaria y las notas se configuran por variables de entorno (`backend/.env`):

```env
BUSINESS_NIT=43.089.544-4
BUSINESS_REGIMEN=Regimen Simplificado
BUSINESS_PHONE_FIXED=(604) 5955045
BUSINESS_CITY=Medellin - Ant.
BUSINESS_ADDRESS="Calle 112 # 51A-15, Medellin, Antioquia, Colombia"
INSTAGRAM_HANDLE=@liliysusazoncompleta
BANK_NAME=Bancolombia
BANK_ACCOUNT_TYPE=Cuenta de Ahorros
BANK_ACCOUNT_NUMBER=25300003634
BANK_ACCOUNT_HOLDER=CRUZ MARIA VALENCIA
BANK_ACCOUNT_HOLDER_ID=43089544
PAYMENT_DEPOSIT_NOTE=Transfiere el 50% para confirmar tu pedido
ADVISOR_CONFIRMATION_NOTE=Nuestros asesores se comunicaran para confirmar tu pedido al numero registrado.
DELIVERY_NOTICE_NOTE=El valor del domicilio sera notificado en la factura enviada por Lili y su Sazon Completa.
```

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

## Despliegue en produccion (guia)

1. Frontend
- Construir con `pnpm --filter @lili/frontend build`.
- Servir `frontend/dist` en CDN/hosting estatico (Vercel, Netlify, Nginx).
- Configurar el hosting para servir `index.html` en cualquier ruta (SPA fallback), ya que el sitio usa rutas de React Router (`/catalogo`, `/contacto`, `/pedido`).
- En este proyecto ya esta configurada la base para GitHub Pages de tipo proyecto en `frontend/vite.config.ts` (`base: '/paginaliliysusazoncompleta/'`) y el router usa `basename` en `frontend/src/main.tsx`.

2. Backend
- Construir con `pnpm --filter @lili/backend build`.
- Ejecutar con `pnpm --filter @lili/backend start` en servidor/contenedor.
- Configurar variables de entorno seguras (`DATABASE_URL`, `OPENAI_API_KEY`, `SMTP_*`).
- **Importante:** GitHub Pages solo publica frontend estatico. El backend (API, IA, PDF, correo, base de datos) debe quedar desplegado aparte (por ejemplo en Render/Railway/VPS) y el frontend debe apuntar a esa API con `VITE_API_URL`.

3. Base de datos
- Ejecutar migracion de `db/migrations` antes del primer despliegue.

4. Integracion WhatsApp
- Actualmente via URL `wa.me`.
- Para automatizaciones empresariales, migrar a WhatsApp Business API oficial.

5. Correo
- Reemplazar el sandbox de pruebas SMTP por un dominio de envio en produccion antes de lanzar (ver seccion "Envio de correo").

## Actualizar repositorio y pagina en GitHub Pages (github.io)

Si quieres subir cambios al repo y reflejarlos en tu pagina de GitHub Pages, sigue este flujo actualizado:

### 1) Traer lo ultimo del repositorio

```bash
git checkout main
git pull origin main
pnpm install
```

### 2) Aplicar tus cambios localmente

Edita el proyecto (frontend o backend), prueba en local y valida build:

```bash
pnpm dev
pnpm build
```

Si vas a publicar en Pages, valida tambien el build del frontend por separado:

```bash
pnpm --filter @lili/frontend build
```

### 3) Subir cambios al repositorio

```bash
git add .
git commit -m "Actualiza contenido y ajustes del sitio"
git push origin main
```

### 4) Configurar GitHub Pages correctamente (una sola vez)

En GitHub: **Settings > Pages**

- Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/(root)**

> Si dejas `main` + `/(root)`, GitHub Pages mostrara el `README.md` del repositorio en vez del frontend compilado.

### 5) Publicar/actualizar el frontend en GitHub Pages

Compila solo el frontend:

```bash
pnpm --filter @lili/frontend build
```

Publica la carpeta `frontend/dist` a la rama `gh-pages`:

```bash
git subtree push --prefix frontend/dist origin gh-pages
```

> Si `gh-pages` no existe, GitHub la crea al primer push. Luego, en **Settings > Pages** del repositorio, selecciona **Deploy from a branch** y la rama **gh-pages** (root).

### 6) Esperar despliegue y validar

Despues de 1-3 minutos, revisa tu URL de Pages:

- Sitio usuario/organizacion: `https://liliysusazoncompleta.github.io/`
- Sitio de proyecto: `https://liliysusazoncompleta.github.io/paginaliliysusazoncompleta/`

Si no carga cambios de inmediato, fuerza recarga del navegador (Ctrl+F5) y confirma en la pestaña **Actions** que el despliegue de Pages termino en estado exitoso.

### 7) (Opcional) Publicar cambios del backend en produccion

Si tus cambios afectan API, chatbot IA, envio de correo o generacion de PDF, recuerda desplegar tambien el backend y actualizar en frontend la variable `VITE_API_URL` al dominio real del backend (por ejemplo `https://api.tu-dominio.com/api`).

## Roadmap sugerido

- Persistencia de pedidos en panel admin.
- Pasarela de pagos (Wompi/PayU/Mercado Pago/Stripe).
- PWA instalable.
- Recomendaciones IA avanzadas y busqueda semantica.
- Analitica de conversion y mapas de calor.

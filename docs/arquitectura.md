# Arquitectura del proyecto

## Resumen

Repositorio monorepo con pnpm y dos aplicaciones:

- `frontend/`: React + Vite + React Router. Sitio multipagina (Home/Sobre Nosotros, Catalogo, Contacto, Checkout) con un layout compartido (header, footer, chat, boton flotante de WhatsApp) y un contexto global de carrito/pedido.
- `backend/`: API Express + TypeScript + PostgreSQL. Expone endpoints para catalogo, clientes por telefono, IA, prefactura PDF, carta PDF y envio de correo de contacto.

## Frontend: rutas y estado

- `App.tsx` define las rutas con `react-router-dom` (`/`, `/catalogo`, `/contacto`, `/pedido`), todas envueltas en `components/Layout.tsx`.
- `lib/CartContext.tsx` centraliza: catalogo/categorias, filtro y busqueda, carrito, formulario de cliente/entrega, autocompletado por telefono, envio de prefactura y descarga de la carta PDF. Todas las paginas consumen este contexto via `useCart()`, por lo que el carrito persiste al navegar entre paginas.
- `pages/ContactPage.tsx` mantiene su propio estado de formulario (no relacionado al pedido) y llama a `POST /api/contacto`.
- `components/ProductCard.tsx` resuelve la imagen del producto con un banco curado de fotos por palabra clave y una imagen de respaldo fija (sin depender de servicios externos deprecados), en tamanos reducidos para que la pagina cargue mas rapido.

## Flujo publico de tienda

1. Frontend consulta catalogo/categorias en backend (categorias administrativas quedan excluidas desde la consulta SQL).
2. Cliente arma carrito local en frontend (sin persistencia en BD), disponible en cualquier pagina via `CartContext`.
3. En `/pedido` se consulta `clientes` por telefono para autocompletado.
4. Al confirmar, backend genera:
   - Resumen de prefactura
   - URL de WhatsApp con mensaje prearmado
   - PDF descargable de prefactura (A4)
5. El navegador abre WhatsApp y descarga PDF.
6. En `/contacto`, el formulario envia un correo real al negocio via `POST /api/contacto` (SMTP), independiente del flujo de pedido.

## Generacion de PDFs (`backend/src/services/pdf.ts`)

- `buildPrefacturaPdf`: recibo de un pedido puntual, A4, generado con los items del carrito.
- `buildCatalogoPdf`: carta completa del negocio, tamano carta (Letter), con portada de marca (logo real embebido desde `backend/assets/logo-lili.png`) y una pagina por categoria con tabla de 2 columnas. Usado por `GET /api/catalogo/pdf`.

## Envio de correo (`backend/src/services/mailer.ts`)

- Transportador SMTP (nodemailer) configurado por variables de entorno (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- Si no hay `SMTP_HOST`/`SMTP_USER` configurados, `sendContactEmail` lanza un error controlado (el endpoint responde 400 en vez de romperse).
- El correo se envia a `CONTACT_TO_EMAIL` con `replyTo` al correo del cliente si lo dejo.

## Seguridad

- API key de IA y credenciales SMTP solo en backend (`OPENAI_API_KEY`, `SMTP_*`).
- Frontend consume solo `VITE_API_URL`.
- Sin escritura en tablas de ventas/clientes para flujo publico.
- Categorias administrativas (`negocio`, `domicilio`, `combos`, `otros`) filtradas a nivel de consulta SQL, no solo en el frontend.

## Escalamiento futuro

- Integrar panel administrativo para persistir pedidos.
- Integrar pasarela de pago.
- Migrar envio a WhatsApp Business API oficial.
- Mover el envio de correo de Mailtrap sandbox a un dominio de produccion.
- Agregar PWA y analitica avanzada.

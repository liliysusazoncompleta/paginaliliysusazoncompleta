# Imagenes de productos (carpeta oficial)

Coloca aqui las fotos de los platos/productos (jpg, png o webp). El backend sirve esta
carpeta directamente en `GET /productos/<archivo>`, tanto en desarrollo como en
produccion, sin necesidad de reconstruir ni redesplegar el frontend cada vez que
agregues o cambies una foto: solo sube el archivo aqui y queda disponible al instante
(el servidor lee el disco en cada peticion).

## Como conectarlas con un producto

En la base de datos, tabla `productos`, columna `imagen_url`, escribe **solo el
nombre del archivo** que pusiste en esta carpeta. Por ejemplo:

| productos.nombre        | productos.imagen_url        | archivo esperado aqui                          |
| ------------------------ | ---------------------------- | ----------------------------------------------- |
| Sancocho de Costilla      | `sancocho-costilla.jpg`      | `backend/public/productos/sancocho-costilla.jpg` |
| Flan de la Casa           | `flan-casa.png`              | `backend/public/productos/flan-casa.png`         |

No hace falta escribir `/productos/` delante ni la URL completa: el sitio ya sabe
armar la ruta. Tambien puedes seguir usando una URL completa (`https://...`) en
`imagen_url` si prefieres alojar la imagen en otro lado (Instagram, Cloudinary, etc.)
— el sitio detecta automaticamente si es una URL externa o un archivo local.

Si `imagen_url` queda vacio o el archivo no existe, el producto muestra una foto
generica de respaldo para que la tarjeta nunca se vea rota.

## Conectarlas automaticamente (recomendado si ya subiste muchas fotos)

En vez de editar `imagen_url` producto por producto a mano, hay un script que revisa
los nombres de los productos en la base de datos, los compara contra los archivos de
esta carpeta y arma la asignacion solo (tolera errores de tipeo y mayusculas/minusculas
distintas). A los productos que no tengan una foto parecida les deja el logo de la
empresa (`LOGOLILIYSUSAZONCOMPLETA.jpg`) como imagen de respaldo.

```bash
cd backend
pnpm sync-images          # solo muestra un reporte, no toca la base de datos
pnpm sync-images:apply    # aplica los cambios (usa esto despues de revisar el reporte)
```

Revisa siempre el reporte antes de aplicar: el script no adivina con 100% de certeza,
asi que conviene confirmar que cada foto quedo con el producto correcto antes de correr
`--apply`. Los productos que no encajaron con ninguna foto (y quedaron con el logo) y
los archivos que sobraron sin usarse quedan listados al final del reporte para que los
revises o conectes a mano si hace falta.

## Por que esta carpeta y no la del frontend

Esta carpeta vive en el **backend** (un servidor que siempre esta corriendo) en vez de
en `frontend/public/`, porque el frontend normalmente se publica como sitio estatico
(Vercel, Netlify, etc.): sus archivos quedan "congelados" en el momento del build, asi
que una foto agregada despues del ultimo despliegue no apareceria hasta el proximo
build. Sirviendola desde el backend, la foto aparece de inmediato en cualquier
ambiente, sin depender de cuando se reconstruyo el frontend.

## Recomendaciones para el archivo

- **Formato:** JPG o WEBP (mejor compresion) o PNG si necesitas transparencia.
- **Tamano:** alrededor de 800x600px es suficiente para las tarjetas del catalogo; no
  hace falta subir fotos de camara sin comprimir (pesan mucho y hacen que el sitio
  cargue mas lento).
- **Peso:** idealmente menos de 300 KB por imagen.
- **Nombre del archivo:** usa minusculas, sin espacios ni tildes (usa guiones), por
  ejemplo `arroz-con-coco.jpg` en vez de `Arroz con Coco (2).jpg`.

## Si el frontend y el backend quedan en dominios distintos en produccion

Si publicas el frontend como sitio estatico en un dominio (por ejemplo
`www.liliysusazoncompleta.com`) y el backend en otro (por ejemplo
`api.liliysusazoncompleta.com`), configura en `frontend/.env` (o en las variables de
entorno del hosting del frontend):

```env
VITE_ASSETS_URL=https://api.liliysusazoncompleta.com/productos
```

Asi el sitio arma la URL completa hacia el backend en vez de asumir que las imagenes
viven en el mismo dominio que el frontend. Si frontend y backend comparten dominio (por
ejemplo detras de un mismo Nginx/reverse proxy), no necesitas configurar nada: la ruta
relativa `/productos/...` ya funciona.

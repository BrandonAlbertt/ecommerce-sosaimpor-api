# Ecommerce Sosaimpor API

API backend para el ecommerce de Sosaimpor.

Este servicio expone rutas publicas para consultar productos y rutas admin para administrar productos, categorias, especificaciones e imagenes de producto.

Stack principal:

```txt
Node.js
Express
PostgreSQL
Cloudinary para imagenes
pnpm como package manager
```

## Indice de documentacion

La carpeta `documentacion` contiene guias por modulo y guias tecnicas para entender como viajan los datos dentro de la API.

| Archivo | Que explica |
| --- | --- |
| `documentacion/ADMIN_PRODUCTOS_RUTAS_Y_FILTROS.md` | Como consumir rutas admin de productos, filtros, payloads y respuestas del panel admin |
| `documentacion/ESTADO_ACTUAL_API_PRODUCTOS_Y_ADMIN.md` | Mapa rapido del estado de productos, categorias y modulos admin; sirve como panorama general y puede quedar atras respecto a cambios recientes |
| `documentacion/FILTRACION_Y_PAGINACION_PRODUCTOS.md` | Rutas publicas de productos, query params, paginacion, busqueda y opciones para filtros |
| `documentacion/GUIA_ADMIN_PRODUCTO_ESPECIFICACIONES.md` | CRUD admin de especificaciones de producto, rutas, payloads y flujo `route -> controller -> service -> model -> PostgreSQL` |
| `documentacion/GUIA_COMPLETA_ADMIN_CATEGORIAS.md` | Guia completa de categorias admin, tabla, rutas, validaciones y viaje de datos |
| `documentacion/GUIA_COMPLETA_ADMIN_PRODUCTO_IMAGENES_Y_CLOUDINARY.md` | Subida de imagenes con Cloudinary, configuracion, rutas admin, Postman, reemplazo, orden, principal y borrado |
| `documentacion/GUIA_TECNICA_ADMIN_PRODUCTOS.md` | Implementacion tecnica de productos admin sin romper la API publica |
| `documentacion/GUIA_TECNICA_FILTRACION_Y_PAGINACION_PRODUCTOS.md` | Implementacion tecnica de filtros y paginacion de productos por capas |

Lectura recomendada para empezar:

```txt
1. README.md
2. documentacion/ESTADO_ACTUAL_API_PRODUCTOS_Y_ADMIN.md
3. documentacion/FILTRACION_Y_PAGINACION_PRODUCTOS.md
4. la guia admin del modulo que vayas a tocar
```

## Que hace este servicio

La API separa funcionalidades publicas y administrativas.

### Publico

Actualmente sirve datos para el frontend de usuario:

```txt
listar productos
buscar productos
filtrar por categoria, marca, modelo, precios y otros campos
paginar resultados
obtener opciones de filtros
leer configuracion expuesta por su ruta
```

Regla publica importante:

```txt
los listados publicos de productos muestran productos activos
y productos cuya categoria esta activa
```

### Admin

Actualmente tiene modulos para:

```txt
productos admin
categorias admin
especificaciones de producto
imagenes de producto
```

Las rutas admin permiten administrar datos que no deben depender del frontend publico.

Importante:

```txt
las rutas admin todavia tienen comentarios TODO para protegerse con authMiddleware y rol admin
```

Antes de exponer esta API en produccion, agrega autenticacion y autorizacion para las rutas `/api/admin/...`.

## Rutas base

Rutas publicas principales:

```http
GET /health
GET /api/productos
GET /api/productos/filtros-opciones
GET /api/categorias
GET /api/configuracion
```

Rutas admin principales:

```http
/api/admin/productos
/api/admin/categorias
/api/admin/productos/:productoId/especificaciones
/api/admin/productos/:productoId/imagenes
```

Para rutas, bodies y ejemplos completos revisa las guias de `documentacion`.

## Arquitectura

La API sigue esta separacion por capas:

```txt
routes -> controllers -> services -> models -> PostgreSQL
```

Para imagenes se agrega Cloudinary:

```txt
admin -> route -> multer -> controller -> service admin
      -> service Cloudinary -> Cloudinary
      -> model -> PostgreSQL
```

Carpetas principales:

| Ruta | Uso |
| --- | --- |
| `src/routes` | Define URLs y metodos HTTP |
| `src/controllers` | Recibe `req`, llama services y responde JSON |
| `src/services` | Valida datos y coordina reglas de negocio |
| `src/models` | Ejecuta SQL con PostgreSQL |
| `src/config` | Configuracion de DB y Cloudinary |
| `src/middlewares` | Manejo de errores y recepcion de imagenes |
| `src/utils` | Filtros, paginacion y formato de respuestas |
| `src/scripts` | Scripts auxiliares, por ejemplo prueba de DB |

## Librerias usadas

Dependencias actuales:

| Libreria | Para que se usa |
| --- | --- |
| `express` | Servidor HTTP y routers |
| `cors` | Permitir consumo desde frontend en otro origen |
| `dotenv` | Cargar variables desde `.env` |
| `pg` | Conexion y consultas PostgreSQL |
| `cloudinary` | Subir y borrar imagenes desde el backend |
| `multer` | Recibir archivos `multipart/form-data` para imagenes |
| `multer-storage-cloudinary` | Dependencia instalada para storage Multer + Cloudinary; la implementacion actual usa `multer` en memoria y el SDK `cloudinary` directamente |
| `nodemon` | Reiniciar servidor durante desarrollo |

## Por que pnpm

Este proyecto usa `pnpm` como package manager.

Ventajas practicas:

```txt
instalaciones rapidas
lockfile reproducible
uso eficiente de disco
scripts del proyecto se ejecutan con pnpm
```

El `package.json` declara la version esperada:

```json
{
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^11.1.2"
    }
  }
}
```

Usa `pnpm install` para respetar `pnpm-lock.yaml`.

## Requisitos

Necesitas:

```txt
Node.js compatible con las dependencias del proyecto
pnpm
PostgreSQL
una base de datos con las tablas que esperan los modelos
cuenta Cloudinary si vas a subir o reemplazar imagenes
```

## Variables de entorno

El archivo real debe crearse en:

```txt
ecommerce-sosaimpor-api/.env
```

El proyecto incluye una plantilla:

```txt
.env.example
```

Puedes crear `.env` copiando esa estructura.

Ejemplo de `.env` con datos inventados:

```env
PORT=3003

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres_demo_123
DB_NAME=ecommerce_sosaimpor_demo

# Copia el valor real desde Cloudinary -> Variable de entorno API.
# Formato: CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_URL=cloudinary://123456789012345:secreto_demo_no_real@mi_nube_demo
```

Significado:

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor Express |
| `DB_HOST` | Host PostgreSQL |
| `DB_PORT` | Puerto PostgreSQL, normalmente `5432` |
| `DB_USER` | Usuario PostgreSQL |
| `DB_PASSWORD` | Password PostgreSQL |
| `DB_NAME` | Base de datos que usa la API |
| `CLOUDINARY_URL` | Credencial server-side para subir y borrar imagenes Cloudinary |

Seguridad:

```txt
no subas .env al repositorio
no publiques CLOUDINARY_URL
no pongas el API secret de Cloudinary en frontend
```

`.gitignore` ya ignora `.env` y `.env.*`, excepto `.env.example`.

## Base de datos

La API usa PostgreSQL.

Antes de arrancar rutas reales:

```txt
1. crea la base de datos indicada en DB_NAME
2. crea las tablas que espera la API
3. confirma columnas usadas por los modelos y guias del modulo
```

Tablas usadas por los modulos actuales incluyen:

```txt
productos
categorias
producto_especificaciones
producto_imagenes
```

Para imagenes admin la tabla debe incluir al menos:

```txt
imagen_url
public_id
principal
orden
creado_en
```

`public_id` permite limpiar el archivo real en Cloudinary cuando una imagen se reemplaza o elimina.

## Instalar

Desde la carpeta de la API:

```bash
cd ecommerce-sosaimpor-api
pnpm install
```

Si instalas dependencias manualmente para esta API, usa pnpm:

```bash
pnpm add nombre-paquete
```

## Ejecutar en desarrollo

Arranca con recarga usando Nodemon:

```bash
pnpm dev
```

Por defecto, con:

```env
PORT=3003
```

la API queda en:

```txt
http://localhost:3003
```

Comprueba el healthcheck:

```http
GET http://localhost:3003/health
```

Respuesta esperada:

```json
{
  "ok": true,
  "service": "ecommerce-sosaimpor-api"
}
```

## Ejecutar en modo start

Para levantar el proceso sin Nodemon:

```bash
pnpm start
```

Ese script ejecuta:

```txt
node src/server.js
```

## Probar conexion PostgreSQL

Con `.env` configurado:

```bash
pnpm db:test
```

Ese script intenta abrir la conexion a PostgreSQL y muestra si la DB responde.

## Imagenes y Cloudinary

La subida de imagenes admin usa:

```txt
POST /api/admin/productos/:productoId/imagenes
```

El archivo debe enviarse como:

```txt
multipart/form-data
campo File: imagen
```

Cloudinary devuelve:

```txt
secure_url
public_id
```

La API guarda:

```txt
secure_url -> imagen_url
public_id  -> public_id
```

La guia completa de este flujo esta en:

```txt
documentacion/GUIA_COMPLETA_ADMIN_PRODUCTO_IMAGENES_Y_CLOUDINARY.md
```

## Scripts disponibles

| Script | Comando | Uso |
| --- | --- | --- |
| Desarrollo | `pnpm dev` | Levanta API con Nodemon |
| Start | `pnpm start` | Levanta API con Node |
| Test DB | `pnpm db:test` | Prueba conexion PostgreSQL |

## Primer arranque recomendado

Si descargaste el proyecto por primera vez:

```txt
1. entra a ecommerce-sosaimpor-api
2. ejecuta pnpm install
3. crea .env usando .env.example como base
4. crea o conecta la base PostgreSQL
5. ejecuta pnpm db:test
6. ejecuta pnpm dev
7. visita GET /health
8. prueba GET /api/productos
```

Para imagenes:

```txt
1. crea cuenta Cloudinary
2. copia CLOUDINARY_URL a .env
3. reinicia la API
4. prueba las rutas documentadas de producto imagenes
```

## Respuestas JSON

Las respuestas exitosas siguen este formato:

```json
{
  "ok": true,
  "data": {},
  "pagination": null
}
```

Los listados paginados agregan metadata:

```json
{
  "ok": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

Los errores pasan por el middleware central:

```json
{
  "ok": false,
  "message": "Descripcion del error"
}
```

## Pendientes importantes

Antes de produccion revisa:

```txt
autenticacion y rol admin para /api/admin
variables reales en el hosting
esquema PostgreSQL definitivo
limites y formatos de imagen que deseas aceptar
tests automatizados
```

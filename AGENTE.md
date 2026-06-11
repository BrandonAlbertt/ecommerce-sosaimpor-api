# AGENTE.md

Resumen breve para futuras sesiones de Codex. Leer este archivo primero antes de explorar todo el proyecto.

## Proyecto

`ecommerce-sosaimpor-api` es una API backend para el ecommerce de Sosaimpor.

Stack principal:

- Node.js con ES Modules (`type: module`).
- Express.
- PostgreSQL con `pg`.
- Cloudinary para imagenes.
- `pnpm` como package manager.

## Comandos

- Instalar dependencias: `pnpm install`
- Desarrollo: `pnpm dev`
- Produccion/local simple: `pnpm start`
- Probar conexion DB: `pnpm db:test`

El servidor arranca en `src/server.js` y usa `PORT` desde `.env`, con fallback `3000`.

## Estructura

La API usa capas:

```txt
routes -> controllers -> services -> models -> PostgreSQL
```

Carpetas clave:

- `src/app.js`: configura Express, CORS, JSON, rutas, 404 y errores.
- `src/server.js`: carga `.env`, importa `app` y abre el puerto.
- `src/routes`: rutas publicas y admin.
- `src/controllers`: manejan `req/res`.
- `src/services`: reglas de negocio y validaciones.
- `src/models`: consultas SQL.
- `src/config`: configuracion de DB y Cloudinary.
- `src/middlewares`: errores y subida de imagenes.
- `src/utils`: filtros, paginacion y respuestas.
- `documentacion`: guias por modulo.

## Rutas base

Publicas:

- `GET /health`
- `/api/productos`
- `/api/categorias`
- `/api/configuracion`
- `/api/comentarios`

Admin:

- `/api/admin/productos`
- `/api/admin/categorias`
- `/api/admin/configuracion`
- `/api/admin/comentarios`
- `/api/admin/productos/:productoId/especificaciones`
- `/api/admin/productos/:productoId/imagenes`

Importante: las rutas admin tienen TODO para protegerse con autenticacion y rol admin.

## Modulos actuales

- Productos publicos: listado, busqueda, filtros, paginacion y opciones de filtros.
- Categorias publicas.
- Configuracion publica/admin.
- Comentarios publicos/admin.
- Productos admin.
- Categorias admin.
- Especificaciones de producto admin.
- Imagenes de producto admin con Cloudinary.

## Variables de entorno

El proyecto carga `.env` desde la raiz. No exponer secretos.

Variables esperadas principales:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_CONNECTION_TIMEOUT_MS`
- Variables de Cloudinary usadas por `src/config/cloudinary.js`.

## Documentacion recomendada

Leer solo lo necesario:

- Panorama: `README.md`
- Estado general: `documentacion/ESTADO_ACTUAL_API_PRODUCTOS_Y_ADMIN.md`
- Productos publicos: `documentacion/FILTRACION_Y_PAGINACION_PRODUCTOS.md`
- Admin productos/categorias/imagenes/especificaciones: guias especificas en `documentacion`
- Comentarios: `documentacion/GUIA_COMENTARIOS_PAGINA.md`

## Notas para trabajar

- Respetar la arquitectura por capas existente.
- No leer todo el proyecto si este resumen y la guia del modulo bastan.
- Antes de tocar un modulo, revisar su ruta, controller, service y model correspondiente.
- No modificar `.env` ni mostrar credenciales.
- Mantener compatibilidad con `pnpm-lock.yaml`.

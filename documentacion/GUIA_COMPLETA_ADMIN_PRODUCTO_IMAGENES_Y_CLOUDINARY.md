# Guia admin con graficos: imagenes de producto y Cloudinary

Objetivo: entender rapido como funciona el CRUD admin de imagenes, que rutas existen, que archivos toca cada accion, que funciones se usan y como se coordina PostgreSQL con Cloudinary.

> Nota: en `src/app.js` esta ruta admin tiene TODO de proteger con `authMiddleware` y rol admin.

## Mapa rapido

```mermaid
flowchart LR
  A[Panel admin] --> B[API Express]
  B --> C[Multer]
  C --> D[Cloudinary]
  B --> E[PostgreSQL]
  D --> F[secure_url + public_id]
  F --> E
  E --> G[JSON al admin]
```

Idea central:

| Lugar | Que guarda |
|---|---|
| Cloudinary | Archivo real de imagen |
| PostgreSQL | `imagen_url`, `public_id`, `producto_id`, `principal`, `orden` |
| API | Valida, sube, borra, reemplaza y responde JSON |

## Ruta base

```http
/api/admin/productos/:productoId/imagenes
```

Ejemplo:

```http
/api/admin/productos/15/imagenes
```

Montaje:

| Archivo | Linea logica |
|---|---|
| `src/app.js` | `app.use("/api/admin/productos/:productoId/imagenes", adminProductoImagenesRoutes)` |

## Rutas disponibles

| Metodo | Endpoint final | Para que sirve | Controller |
|---|---|---|---|
| GET | `/api/admin/productos/:productoId/imagenes` | Listar galeria | `listarImagenesProductoAdminController` |
| GET | `/api/admin/productos/:productoId/imagenes/:imagenId` | Ver una imagen | `obtenerImagenProductoAdminPorIdController` |
| POST | `/api/admin/productos/:productoId/imagenes` | Subir imagen nueva | `crearImagenProductoAdminController` |
| PUT | `/api/admin/productos/:productoId/imagenes/:imagenId` | Cambiar `orden` | `actualizarImagenProductoAdminController` |
| PATCH | `/api/admin/productos/:productoId/imagenes/:imagenId/principal` | Marcar principal | `marcarImagenProductoPrincipalAdminController` |
| PUT | `/api/admin/productos/:productoId/imagenes/:imagenId/reemplazar` | Reemplazar archivo | `reemplazarImagenProductoAdminController` |
| DELETE | `/api/admin/productos/:productoId/imagenes/:imagenId` | Eliminar imagen | `eliminarImagenProductoAdminController` |

## Archivos y funciones

| Capa | Archivo | Funciones |
|---|---|---|
| Route | `src/routes/admin.producto-imagenes.routes.js` | `router.get("/")`, `router.get("/:imagenId")`, `router.post("/")`, `router.put("/:imagenId")`, `router.patch("/:imagenId/principal")`, `router.put("/:imagenId/reemplazar")`, `router.delete("/:imagenId")` |
| Middleware | `src/middlewares/upload-imagen.middleware.js` | `subirImagenProducto`, `aceptarSoloImagenes`, `manejarErrorMulter` |
| Controller | `src/controllers/admin.producto-imagenes.controller.js` | `listarImagenesProductoAdminController`, `obtenerImagenProductoAdminPorIdController`, `crearImagenProductoAdminController`, `actualizarImagenProductoAdminController`, `marcarImagenProductoPrincipalAdminController`, `reemplazarImagenProductoAdminController`, `eliminarImagenProductoAdminController` |
| Service admin | `src/services/admin.producto-imagenes.service.js` | `obtenerImagenesProductoAdmin`, `obtenerImagenProductoAdmin`, `crearImagenProducto`, `actualizarImagenProducto`, `marcarImagenProductoPrincipal`, `reemplazarImagenProducto`, `eliminarImagenProducto` |
| Service Cloudinary | `src/services/cloudinary-imagenes.service.js` | `subirImagenProductoCloudinary`, `eliminarImagenCloudinary` |
| Config Cloudinary | `src/config/cloudinary.js` | `cloudinary.config({ secure: true })` |
| Model | `src/models/producto-imagenes.model.js` | `productoImagenProductoExiste`, `listarImagenesProductoAdmin`, `obtenerImagenProductoAdminPorId`, `crearImagenProductoAdmin`, `actualizarImagenProductoAdmin`, `marcarImagenProductoAdminPrincipal`, `reemplazarImagenProductoAdmin`, `eliminarImagenProductoAdmin` |
| Respuesta | `src/utils/response.js` | `successResponse` |
| Errores | `src/middlewares/error.middleware.js` | `errorMiddleware` |

## Flujo por capas

```mermaid
flowchart TD
  A[Request admin] --> B[admin.producto-imagenes.routes.js]
  B --> C{Tiene archivo?}
  C -->|Si| D[subirImagenProducto Multer]
  C -->|No| E[Controller]
  D --> E
  E --> F[admin.producto-imagenes.service.js]
  F --> G{Sube/borra archivo?}
  G -->|Si| H[cloudinary-imagenes.service.js]
  G -->|No| I[producto-imagenes.model.js]
  H --> I
  I --> J[(producto_imagenes)]
  J --> K[successResponse]
```

## Modelo mental

```mermaid
mindmap
  root((Imagen producto))
    Producto
      producto_id
      debe existir
    Archivo
      req.file
      campo imagen
      image/*
      maximo 5MB
    Cloudinary
      secure_url
      public_id
      folder por producto
    PostgreSQL
      imagen_url
      public_id
      principal
      orden
    Admin
      listar
      subir
      ordenar
      principal
      reemplazar
      eliminar
```

## Tabla `producto_imagenes`

| Campo | Uso |
|---|---|
| `id` | Id de la fila |
| `producto_id` | Producto propietario de la imagen |
| `imagen_url` | URL publica que usa el frontend |
| `public_id` | Id de Cloudinary para borrar/reemplazar |
| `principal` | Imagen portada del producto |
| `orden` | Orden visual en galeria |
| `creado_en` | Fecha de creacion |

Relacion:

```sql
producto_imagenes.producto_id REFERENCES productos(id) ON DELETE CASCADE
```

## Cloudinary

Configuracion:

| Archivo | Que hace |
|---|---|
| `src/config/cloudinary.js` | Importa SDK, activa `secure: true`, exporta `cloudinary` |
| `.env` | Debe tener `CLOUDINARY_URL` |

Formato:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

No guardar claves reales en documentos, frontend, capturas publicas ni repositorio.

Flujo de subida:

```mermaid
flowchart TD
  A[req.file.buffer] --> B[subirImagenProductoCloudinary]
  B --> C[validarConfiguracionCloudinary]
  C --> D[cloudinary.uploader.upload_stream]
  D --> E[folder sosaimpor/productos/:productoId]
  E --> F[secure_url + public_id]
  F --> G[imagen_url + public_id para DB]
```

Flujo de borrado:

```mermaid
flowchart TD
  A[public_id] --> B{Existe?}
  B -->|No| C[No hace nada]
  B -->|Si| D[validar CLOUDINARY_URL]
  D --> E[cloudinary.uploader.destroy]
```

## Middleware de imagen

`subirImagenProducto` usa:

```txt
multerImagen.single("imagen")
```

Por eso el campo del archivo debe llamarse:

```txt
imagen
```

Validaciones:

| Regla | Valor |
|---|---|
| Tipo | `image/*` |
| Cantidad | 1 archivo |
| Tamano maximo | 5 MB |
| Storage | memoria con `multer.memoryStorage()` |
| Error tamano | `La imagen debe pesar 5 MB o menos` |

## Accion 1: listar imagenes

Ruta:

```http
GET /api/admin/productos/15/imagenes
```

Flujo:

```mermaid
flowchart TD
  A[GET lista] --> B[listarImagenesProductoAdminController]
  B --> C[obtenerImagenesProductoAdmin]
  C --> D[parsePositiveId producto]
  D --> E[validateProducto]
  E --> F[listarImagenesProductoAdmin model]
  F --> G[(SELECT producto_imagenes)]
  G --> H[ORDER principal DESC, orden ASC, id ASC]
```

Funciones:

| Archivo | Funcion |
|---|---|
| Controller | `listarImagenesProductoAdminController(req, res, next)` |
| Service | `obtenerImagenesProductoAdmin(productoId)` |
| Model | `productoImagenProductoExiste(productoId)` |
| Model | `listarImagenesProductoAdmin(productoId)` |

## Accion 2: ver imagen por id

Ruta:

```http
GET /api/admin/productos/15/imagenes/8
```

Flujo:

```mermaid
flowchart TD
  A[GET imagen 8] --> B[obtenerImagenProductoAdminPorIdController]
  B --> C[obtenerImagenProductoAdmin]
  C --> D[parse productoId + imagenId]
  D --> E[validateProducto]
  E --> F[getImagen]
  F --> G[obtenerImagenProductoAdminPorId]
  G --> H[(WHERE producto_id AND id)]
```

Regla: la imagen debe pertenecer al producto indicado.

## Accion 3: subir imagen nueva

Ruta:

```http
POST /api/admin/productos/15/imagenes
```

Body:

| Campo | Tipo | Obligatorio | Uso |
|---|---|---|---|
| `imagen` | File | Si | Archivo real |
| `principal` | Text boolean | No | `true` o `false` |
| `orden` | Text number | No | Orden visual |

Flujo:

```mermaid
flowchart TD
  A[POST form-data] --> B[subirImagenProducto Multer]
  B --> C[crearImagenProductoAdminController]
  C --> D[crearImagenProducto]
  D --> E[parsePositiveId]
  D --> F[validarArchivoImagen]
  D --> G[validateProducto]
  G --> H[subirImagenProductoCloudinary]
  H --> I[secure_url + public_id]
  I --> J[pickCreateImageData]
  J --> K[crearImagenProductoAdmin model]
  K --> L{principal=true?}
  L -->|Si| M[UPDATE otras principal=false]
  L -->|No| N[INSERT]
  M --> N
  N --> O[(producto_imagenes)]
```

Si falla el INSERT despues de subir a Cloudinary:

```mermaid
flowchart LR
  A[Upload OK] --> B[INSERT falla]
  B --> C[limpiarImagenCloudinary public_id nuevo]
```

## Accion 4: cambiar orden

Ruta:

```http
PUT /api/admin/productos/15/imagenes/8
Content-Type: application/json
```

Body:

```json
{
  "orden": 2
}
```

Flujo:

```mermaid
flowchart TD
  A[PUT orden] --> B[actualizarImagenProductoAdminController]
  B --> C[actualizarImagenProducto]
  C --> D[validateProducto]
  D --> E[getImagen]
  E --> F[pickUpdateImageData]
  F --> G[actualizarImagenProductoAdmin model]
  G --> H[(UPDATE orden)]
```

Esta ruta no cambia `imagen_url` ni `public_id`.

## Accion 5: marcar principal

Ruta:

```http
PATCH /api/admin/productos/15/imagenes/8/principal
```

Flujo:

```mermaid
flowchart TD
  A[PATCH principal] --> B[marcarImagenProductoPrincipalAdminController]
  B --> C[marcarImagenProductoPrincipal]
  C --> D[validateProducto]
  D --> E[getImagen]
  E --> F[marcarImagenProductoAdminPrincipal]
  F --> G[BEGIN]
  G --> H[todas principal=false]
  H --> I[imagen 8 principal=true]
  I --> J[COMMIT]
```

Regla: solo una imagen del producto debe quedar como principal.

## Accion 6: reemplazar archivo

Ruta:

```http
PUT /api/admin/productos/15/imagenes/8/reemplazar
```

Body:

| Campo | Tipo | Obligatorio |
|---|---|---|
| `imagen` | File | Si |

Flujo:

```mermaid
flowchart TD
  A[PUT reemplazar form-data] --> B[subirImagenProducto Multer]
  B --> C[reemplazarImagenProductoAdminController]
  C --> D[reemplazarImagenProducto]
  D --> E[validar archivo + producto]
  E --> F[getImagen actual]
  F --> G[subir nueva a Cloudinary]
  G --> H[reemplazarImagenProductoAdmin model]
  H --> I[(UPDATE imagen_url, public_id)]
  I --> J[limpiarImagenCloudinary public_id anterior]
```

Por que este orden es bueno:

| Paso | Motivo |
|---|---|
| Primero sube nueva imagen | Si falla, la vieja sigue igual |
| Luego actualiza DB | Cambia URL y `public_id` solo si ya hay nueva imagen |
| Al final borra anterior | Evita perder imagen antigua antes de tiempo |

## Accion 7: eliminar imagen

Ruta:

```http
DELETE /api/admin/productos/15/imagenes/8
```

Flujo:

```mermaid
flowchart TD
  A[DELETE imagen] --> B[eliminarImagenProductoAdminController]
  B --> C[eliminarImagenProducto]
  C --> D[validateProducto]
  D --> E[eliminarImagenProductoAdmin model]
  E --> F[(DELETE RETURNING fila)]
  F --> G{tiene public_id?}
  G -->|Si| H[eliminarImagenCloudinary]
  G -->|No| I[solo DB]
  H --> J[responde fila eliminada]
  I --> J
```

Si `public_id = null`, la API borra la fila de PostgreSQL pero no intenta borrar nada externo.

## SQL principal

Listar:

```sql
SELECT id, producto_id, imagen_url, public_id, principal, orden, creado_en
FROM producto_imagenes
WHERE producto_id = $1
ORDER BY principal DESC, orden ASC, id ASC;
```

Ver por id:

```sql
SELECT id, producto_id, imagen_url, public_id, principal, orden, creado_en
FROM producto_imagenes
WHERE producto_id = $1
  AND id = $2
LIMIT 1;
```

Crear:

```sql
INSERT INTO producto_imagenes (producto_id, imagen_url, public_id, principal, orden)
VALUES ($1, $2, $3, $4, $5);
```

Marcar principal:

```sql
BEGIN;
UPDATE producto_imagenes SET principal = false WHERE producto_id = $1;
UPDATE producto_imagenes SET principal = true WHERE producto_id = $1 AND id = $2;
COMMIT;
```

Reemplazar:

```sql
UPDATE producto_imagenes
SET imagen_url = $1,
    public_id = $2
WHERE producto_id = $3
  AND id = $4;
```

Eliminar:

```sql
DELETE FROM producto_imagenes
WHERE producto_id = $1
  AND id = $2
RETURNING id, producto_id, imagen_url, public_id, principal, orden, creado_en;
```

## Respuesta

Todas las respuestas exitosas usan `successResponse`.

```json
{
  "ok": true,
  "data": {
    "id": 8,
    "producto_id": 15,
    "imagen_url": "https://res.cloudinary.com/mi-nube/image/upload/...",
    "public_id": "sosaimpor/productos/15/archivo-generado",
    "principal": true,
    "orden": 1,
    "creado_en": "2026-05-21T15:20:00.000Z"
  },
  "pagination": null
}
```

## Postman rapido

Host ejemplo:

```txt
http://localhost:3003
```

| Accion | Metodo | URL | Body |
|---|---|---|---|
| Listar | GET | `/api/admin/productos/2/imagenes` | Sin body |
| Ver | GET | `/api/admin/productos/2/imagenes/201` | Sin body |
| Subir | POST | `/api/admin/productos/2/imagenes` | `form-data`: `imagen` File, `principal`, `orden` |
| Orden | PUT | `/api/admin/productos/2/imagenes/201` | JSON: `{ "orden": 1 }` |
| Principal | PATCH | `/api/admin/productos/2/imagenes/201/principal` | Sin body |
| Reemplazar | PUT | `/api/admin/productos/2/imagenes/201/reemplazar` | `form-data`: `imagen` File |
| Eliminar | DELETE | `/api/admin/productos/2/imagenes/201` | Sin body |

Para `FormData`, no escribir manualmente `Content-Type: multipart/form-data`; el navegador/Postman arma el boundary.

## Errores comunes

| Error | Causa | Solucion |
|---|---|---|
| `Cloudinary no esta configurado` | Falta `CLOUDINARY_URL` | Agregar variable en `.env` |
| `imagen es obligatoria` | No llego `req.file` | Enviar `form-data` con campo `imagen` |
| `El archivo debe ser una imagen` | Mimetype no empieza con `image/` | Subir archivo de imagen real |
| `La imagen debe pesar 5 MB o menos` | Archivo excede limite | Comprimir imagen |
| `Producto no encontrado` | `productoId` no existe | Usar producto valido |
| `Imagen no encontrada` | `imagenId` no pertenece al producto | Revisar listado primero |
| No borra archivo externo | `public_id` es `null` | Solo se borra la fila DB |

## Como leer el codigo sin perderse

```mermaid
flowchart TD
  A[Quiero entender imagenes admin] --> B[src/app.js]
  B --> C[src/routes/admin.producto-imagenes.routes.js]
  C --> D[src/middlewares/upload-imagen.middleware.js]
  C --> E[src/controllers/admin.producto-imagenes.controller.js]
  E --> F[src/services/admin.producto-imagenes.service.js]
  F --> G[src/services/cloudinary-imagenes.service.js]
  F --> H[src/models/producto-imagenes.model.js]
  G --> I[src/config/cloudinary.js]
  H --> J[src/config/db.js]
```

Regla simple:

| Si quieres ver... | Abre... |
|---|---|
| URLs | `src/routes/admin.producto-imagenes.routes.js` |
| Campo de archivo y limite | `src/middlewares/upload-imagen.middleware.js` |
| Respuesta HTTP | `src/controllers/admin.producto-imagenes.controller.js` |
| Validaciones y orden de operaciones | `src/services/admin.producto-imagenes.service.js` |
| Upload/delete Cloudinary | `src/services/cloudinary-imagenes.service.js` |
| SQL real | `src/models/producto-imagenes.model.js` |
| Config Cloudinary | `src/config/cloudinary.js` |

## Checklist para replicar

```mermaid
flowchart TD
  A[Crear tabla producto_imagenes] --> B[Instalar cloudinary + multer]
  B --> C[Agregar CLOUDINARY_URL]
  C --> D[Crear config/cloudinary.js]
  D --> E[Crear middleware upload]
  E --> F[Crear service Cloudinary]
  F --> G[Crear model SQL]
  G --> H[Crear service admin]
  H --> I[Crear controller]
  I --> J[Crear router]
  J --> K[Montar en app.js]
  K --> L[Probar listar, subir, principal, reemplazar, eliminar]
```

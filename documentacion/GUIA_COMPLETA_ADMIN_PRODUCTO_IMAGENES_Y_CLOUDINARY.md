# Guia completa admin producto imagenes y Cloudinary

Esta guia explica como funciona el CRUD admin de imagenes de producto y como se integra Cloudinary en esta API.

Sirve para:

- entender por que las imagenes se guardan fuera del servidor de la API;
- configurar Cloudinary con Node.js y Express;
- conocer las rutas admin de `producto_imagenes`;
- saber que hace cada controller;
- seguir como viajan los datos desde el admin hasta PostgreSQL y Cloudinary;
- replicar esta estructura en otro proyecto.

## Objetivo

Cada producto puede tener varias imagenes.

El admin necesita poder:

```txt
listar imagenes de un producto
ver una imagen por id
subir una imagen nueva
cambiar el orden visual
marcar una imagen como principal
reemplazar una imagen por otra
eliminar una imagen
```

La API no guarda el archivo final dentro de una carpeta local.

El archivo viaja asi:

```txt
admin -> API Express -> Cloudinary
```

La relacion de esa imagen con el producto se guarda en PostgreSQL:

```txt
Cloudinary guarda el archivo
PostgreSQL guarda la URL, public_id, principal y orden
```

## Que es Cloudinary aqui

Cloudinary es el servicio externo que guarda las imagenes reales.

En este proyecto Cloudinary devuelve dos datos importantes al subir:

```txt
secure_url -> URL publica segura para mostrar la imagen
public_id  -> identificador de Cloudinary para borrar o reemplazar el archivo
```

La API guarda esos datos asi:

```txt
secure_url -> producto_imagenes.imagen_url
public_id  -> producto_imagenes.public_id
```

Ejemplo conceptual:

```txt
imagen_url:
  https://res.cloudinary.com/mi-nube/image/upload/...

public_id:
  sosaimpor/productos/15/archivo-generado
```

## Por que se usa Cloudinary

Subir imagenes al disco local del servidor puede complicar la publicacion de la API.

Con Cloudinary:

- el admin sube imagenes desde la aplicacion;
- la API no depende de una carpeta `uploads` persistente;
- las URLs publicas quedan listas para el frontend;
- `public_id` permite borrar el archivo real cuando una imagen se elimina o se reemplaza.

## Flujo elegido

Esta API usa subida server-side:

```txt
Admin frontend
  -> envia multipart/form-data a Express

Multer
  -> recibe el archivo en memoria

Cloudinary SDK
  -> sube el buffer a Cloudinary

PostgreSQL
  -> guarda URL y public_id
```

No se usa subida directa desde React a Cloudinary en este flujo.

No se requiere un `unsigned upload preset` para la implementacion actual porque la API sube con sus credenciales server-side.

## Tabla usada

La tabla esperada por esta API es:

```sql
CREATE TABLE producto_imagenes (
    id SERIAL PRIMARY KEY,

    producto_id INT NOT NULL
    REFERENCES productos(id)
    ON DELETE CASCADE,

    imagen_url TEXT NOT NULL,

    -- ID interno de Cloudinary
    -- necesario para eliminar o reemplazar imagenes
    public_id TEXT,

    -- imagen principal del producto
    principal BOOLEAN DEFAULT FALSE,

    -- orden visual de las imagenes
    orden INT DEFAULT 0,

    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Campos usados

Cada imagen devuelta por la API tiene:

```txt
id
producto_id
imagen_url
public_id
principal
orden
creado_en
```

Significado:

| Campo | Uso |
| --- | --- |
| `id` | Id de la fila en PostgreSQL |
| `producto_id` | Producto al que pertenece la imagen |
| `imagen_url` | URL que usa frontend para mostrar la imagen |
| `public_id` | Id de Cloudinary para borrar o reemplazar |
| `principal` | Indica la imagen principal del producto |
| `orden` | Orden visual dentro de la galeria |
| `creado_en` | Fecha de creacion de la fila |

## Que pasa con imagenes antiguas

Una imagen antigua puede tener:

```txt
imagen_url = URL externa, por ejemplo Unsplash
public_id = null
```

La API puede mostrarla y puede borrar su fila de PostgreSQL.

No puede borrar un archivo en Cloudinary si `public_id` esta vacio porque ese archivo no pertenece a Cloudinary.

## Dependencias

Las dependencias que usa esta implementacion son:

```bash
pnpm add cloudinary multer
```

En este proyecto tambien quedo instalado:

```bash
pnpm add multer-storage-cloudinary
```

El codigo actual no importa `multer-storage-cloudinary`.

La implementacion usa:

```txt
multer -> recibir archivo multipart/form-data en memoria
cloudinary -> subir y borrar imagenes desde la API
```

## Configurar Cloudinary

### 1. Crear cuenta

Crea una cuenta de Cloudinary y entra al entorno de producto.

### 2. Ver credenciales

En Cloudinary busca:

```txt
Ver claves API
```

o la seccion de credenciales del entorno.

Cloudinary muestra:

```txt
Nombre de la nube
Clave API
Secreto de API
Variable de entorno API
```

### 3. Copiar variable de entorno

Para esta API se usa la variable completa:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

Cloudinary ya la muestra armada en la fila:

```txt
Variable de entorno API
```

### 4. Pegar en `.env`

En:

```txt
ecommerce-sosaimpor-api/.env
```

debe existir una linea real sin `#`:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

Ejemplo de formato:

```env
CLOUDINARY_URL=cloudinary://123456:secreto@mi_nube
```

No escribas tus claves en:

- frontend;
- documentos;
- capturas publicas;
- repositorio Git.

### 5. Plantilla segura

El proyecto incluye:

```txt
.env.example
```

Su objetivo es mostrar el formato sin guardar secretos:

```env
# Formato: CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_URL=
```

## Configuracion Cloudinary en codigo

Archivo:

```txt
src/config/cloudinary.js
```

Responsabilidad:

```txt
importar el SDK
usar configuracion de CLOUDINARY_URL
forzar URLs seguras
exportar el cliente cloudinary
```

Codigo usado:

```js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
});

export { cloudinary };
```

El SDK lee `CLOUDINARY_URL` desde el entorno.

## Servicio Cloudinary

Archivo:

```txt
src/services/cloudinary-imagenes.service.js
```

Funciones principales:

```txt
subirImagenProductoCloudinary(file, productoId)
eliminarImagenCloudinary(publicId)
```

### Subir

`subirImagenProductoCloudinary` recibe:

```txt
file.buffer
productoId
```

Sube la imagen a una carpeta por producto:

```txt
sosaimpor/productos/:productoId
```

Ejemplo:

```txt
sosaimpor/productos/15
```

Devuelve al service admin:

```js
{
  imagen_url: result.secure_url,
  public_id: result.public_id
}
```

### Borrar

`eliminarImagenCloudinary` recibe:

```txt
publicId
```

Si no hay `publicId`, no intenta borrar en Cloudinary.

Eso permite soportar imagenes antiguas que solo tengan una URL externa.

## Middleware de archivo

Archivo:

```txt
src/middlewares/upload-imagen.middleware.js
```

El middleware exporta:

```txt
subirImagenProducto
```

Ese middleware usa:

```js
multerImagen.single("imagen")
```

Por eso el campo del archivo debe llamarse:

```txt
imagen
```

Validaciones del middleware:

```txt
solo acepta mimetype image/*
solo acepta un archivo
limite actual: 5 MB
guarda archivo en memoria antes de enviarlo a Cloudinary
```

Si el archivo supera el limite:

```json
{
  "ok": false,
  "message": "La imagen debe pesar 5 MB o menos"
}
```

## Ruta base

La ruta base admin es:

```http
/api/admin/productos/:productoId/imagenes
```

Ejemplo para producto `15`:

```http
/api/admin/productos/15/imagenes
```

En `src/app.js` se monta asi:

```js
app.use(
  "/api/admin/productos/:productoId/imagenes",
  adminProductoImagenesRoutes
);
```

Por ahora estas rutas admin no tienen autenticacion.

Pendiente para produccion:

```js
// TODO: proteger rutas admin con authMiddleware y rol admin.
```

## Archivos usados

| Archivo | Responsabilidad |
| --- | --- |
| `src/app.js` | Monta la ruta base de imagenes admin |
| `src/routes/admin.producto-imagenes.routes.js` | Define las URLs y controllers |
| `src/controllers/admin.producto-imagenes.controller.js` | Recibe `req`, llama al service y responde JSON |
| `src/services/admin.producto-imagenes.service.js` | Valida ids, archivo, `orden` y coordina DB + Cloudinary |
| `src/models/producto-imagenes.model.js` | Ejecuta SQL de `producto_imagenes` |
| `src/services/cloudinary-imagenes.service.js` | Sube y borra imagenes en Cloudinary |
| `src/config/cloudinary.js` | Configura el SDK de Cloudinary |
| `src/middlewares/upload-imagen.middleware.js` | Recibe el archivo `imagen` con Multer |
| `src/utils/response.js` | Respuesta exitosa estandar |
| `src/middlewares/error.middleware.js` | Respuesta de errores |

## Estructura por capas

```txt
app
  -> route
  -> middleware upload cuando hay archivo
  -> controller
  -> service admin
  -> service Cloudinary cuando sube o borra archivo
  -> model
  -> PostgreSQL
```

Cloudinary y PostgreSQL tienen responsabilidades distintas:

```txt
Cloudinary:
  guarda archivo real

PostgreSQL:
  guarda la relacion entre producto e imagen
```

## Rutas disponibles

```http
GET    /api/admin/productos/:productoId/imagenes
GET    /api/admin/productos/:productoId/imagenes/:imagenId
POST   /api/admin/productos/:productoId/imagenes
PUT    /api/admin/productos/:productoId/imagenes/:imagenId
PATCH  /api/admin/productos/:productoId/imagenes/:imagenId/principal
PUT    /api/admin/productos/:productoId/imagenes/:imagenId/reemplazar
DELETE /api/admin/productos/:productoId/imagenes/:imagenId
```

## Rutas y controllers

| Metodo | Ruta | Controller |
| --- | --- | --- |
| GET | `/` | `listarImagenesProductoAdminController` |
| GET | `/:imagenId` | `obtenerImagenProductoAdminPorIdController` |
| POST | `/` | `crearImagenProductoAdminController` |
| PUT | `/:imagenId` | `actualizarImagenProductoAdminController` |
| PATCH | `/:imagenId/principal` | `marcarImagenProductoPrincipalAdminController` |
| PUT | `/:imagenId/reemplazar` | `reemplazarImagenProductoAdminController` |
| DELETE | `/:imagenId` | `eliminarImagenProductoAdminController` |

Todas esas rutas viven bajo:

```http
/api/admin/productos/:productoId/imagenes
```

Ejemplo:

```txt
Ruta interna del router:
  PUT /:imagenId/reemplazar

Ruta final:
  PUT /api/admin/productos/15/imagenes/8/reemplazar
```

## Mapa rapido de uso

Estas son las acciones que normalmente tendra el admin:

| Accion admin | Ruta | Body |
| --- | --- | --- |
| Cargar galeria de un producto | `GET /api/admin/productos/:productoId/imagenes` | Sin body |
| Ver una imagen puntual | `GET /api/admin/productos/:productoId/imagenes/:imagenId` | Sin body |
| Subir nueva imagen | `POST /api/admin/productos/:productoId/imagenes` | `form-data` con archivo |
| Cambiar orden | `PUT /api/admin/productos/:productoId/imagenes/:imagenId` | JSON con `orden` |
| Hacer principal | `PATCH /api/admin/productos/:productoId/imagenes/:imagenId/principal` | Sin body |
| Cambiar archivo equivocado | `PUT /api/admin/productos/:productoId/imagenes/:imagenId/reemplazar` | `form-data` con archivo |
| Eliminar imagen | `DELETE /api/admin/productos/:productoId/imagenes/:imagenId` | Sin body |

Importante:

```txt
PUT /:imagenId
  edita campos de la fila sin cambiar el archivo
  actualmente edita orden

PUT /:imagenId/reemplazar
  cambia el archivo real
  sube una imagen nueva a Cloudinary
  cambia imagen_url y public_id
```

## Formato de respuesta

Las respuestas exitosas usan:

```json
{
  "ok": true,
  "data": {},
  "pagination": null
}
```

Ejemplo de imagen:

```json
{
  "id": 8,
  "producto_id": 15,
  "imagen_url": "https://res.cloudinary.com/mi-nube/image/upload/...",
  "public_id": "sosaimpor/productos/15/archivo-generado",
  "principal": true,
  "orden": 1,
  "creado_en": "2026-05-21T15:20:00.000Z"
}
```

## Validaciones principales

El service admin valida:

```txt
productoId debe ser entero positivo
imagenId debe ser entero positivo cuando la ruta lo use
el producto debe existir
la imagen debe pertenecer al producto indicado
POST y reemplazar requieren archivo
principal debe ser true o false si se envia al crear
orden debe ser entero mayor o igual a 0
```

El middleware valida:

```txt
campo de archivo: imagen
tipo de archivo: image/*
tamano maximo: 5 MB
```

## Funcionalidad 1: listar imagenes

Ruta:

```http
GET /api/admin/productos/15/imagenes
```

Controller:

```txt
listarImagenesProductoAdminController
```

Que hace:

```txt
lista imagenes del producto 15
ordena primero la principal
luego orden ascendente
luego id ascendente
```

Respuesta ejemplo:

```json
{
  "ok": true,
  "data": [
    {
      "id": 8,
      "producto_id": 15,
      "imagen_url": "https://res.cloudinary.com/mi-nube/image/upload/...",
      "public_id": "sosaimpor/productos/15/archivo-generado",
      "principal": true,
      "orden": 1,
      "creado_en": "2026-05-21T15:20:00.000Z"
    }
  ],
  "pagination": null
}
```

Viaje de datos:

```txt
URL
  productoId = "15"

route
  GET "/" llama listarImagenesProductoAdminController

controller
  lee req.params.productoId
  llama obtenerImagenesProductoAdmin(productoId)

service
  convierte "15" a numero
  valida que producto exista

model
  SELECT FROM producto_imagenes
  WHERE producto_id = $1

controller
  responde JSON
```

## Funcionalidad 2: ver imagen por id

Ruta:

```http
GET /api/admin/productos/15/imagenes/8
```

Controller:

```txt
obtenerImagenProductoAdminPorIdController
```

Regla importante:

```txt
imagen 8 debe pertenecer a producto 15
```

Viaje de datos:

```txt
URL
  productoId = "15"
  imagenId = "8"

service
  valida ambos ids
  valida producto
  busca imagen por producto_id e id

model
  SELECT ...
  WHERE producto_id = $1
    AND id = $2
```

## Funcionalidad 3: subir imagen nueva

Ruta:

```http
POST /api/admin/productos/15/imagenes
```

Controller:

```txt
crearImagenProductoAdminController
```

Tipo de body:

```txt
multipart/form-data
```

Campos:

| Campo | Tipo | Obligatorio | Uso |
| --- | --- | --- | --- |
| `imagen` | File | Si | Archivo real |
| `principal` | Text boolean | No | `true` o `false` |
| `orden` | Text number | No | Orden visual |

Ejemplo en Postman:

```txt
Body -> form-data
imagen      File    foto.jpg
principal   Text    true
orden       Text    1
```

Respuesta `201`:

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

Viaje de datos:

```txt
frontend admin
  crea FormData
  envia archivo en campo imagen

route
  POST "/"
  primero ejecuta subirImagenProducto
  despues llama crearImagenProductoAdminController

middleware Multer
  valida que sea imagen
  valida limite de 5 MB
  deja archivo en req.file
  deja principal y orden en req.body

controller
  envia productoId, req.file y req.body al service

service admin
  valida productoId
  valida que archivo exista
  valida producto
  convierte principal y orden

service Cloudinary
  sube file.buffer
  obtiene secure_url y public_id

model
  INSERT en producto_imagenes
  guarda imagen_url y public_id

controller
  responde status 201
```

### Si se crea como principal

Si `principal=true`, el model hace dentro de una transaccion:

```txt
1. principal=false para las otras imagenes del mismo producto
2. INSERT de la nueva imagen principal
```

## Funcionalidad 4: cambiar orden

Ruta:

```http
PUT /api/admin/productos/15/imagenes/8
Content-Type: application/json
```

Controller:

```txt
actualizarImagenProductoAdminController
```

Body:

```json
{
  "orden": 2
}
```

Esta ruta solo actualiza:

```txt
orden
```

No cambia archivo ni URL.

Viaje de datos:

```txt
controller
  lee req.body

service
  valida productoId e imagenId
  valida que la imagen exista
  deja solo orden permitido
  valida entero >= 0

model
  UPDATE producto_imagenes
  SET orden = ...
```

## Funcionalidad 5: marcar principal

Ruta:

```http
PATCH /api/admin/productos/15/imagenes/8/principal
```

Controller:

```txt
marcarImagenProductoPrincipalAdminController
```

No necesita body.

Que hace:

```txt
deja principal=false en imagenes del producto 15
deja principal=true en imagen 8
```

El model usa transaccion para que el cambio sea consistente.

Viaje de datos:

```txt
route
  PATCH "/:imagenId/principal"

controller
  envia productoId e imagenId

service
  valida producto
  valida imagen

model
  BEGIN
  UPDATE otras imagenes -> principal=false
  UPDATE imagen elegida -> principal=true
  COMMIT
```

## Funcionalidad 6: reemplazar archivo

Ruta:

```http
PUT /api/admin/productos/15/imagenes/8/reemplazar
```

Controller:

```txt
reemplazarImagenProductoAdminController
```

Tipo de body:

```txt
multipart/form-data
```

Campo:

```txt
imagen File obligatorio
```

Que hace:

```txt
1. busca la imagen actual
2. sube la nueva imagen a Cloudinary
3. actualiza imagen_url y public_id en PostgreSQL
4. intenta borrar de Cloudinary la imagen anterior si tenia public_id
```

Viaje de datos:

```txt
middleware Multer
  deja nueva imagen en req.file

service admin
  valida ids y archivo
  obtiene imagen actual y su public_id

service Cloudinary
  sube nueva imagen
  devuelve nueva URL y nuevo public_id

model
  UPDATE imagen_url y public_id

service admin
  borra public_id anterior en Cloudinary cuando existe
```

Este orden evita perder la imagen vieja si la subida nueva falla antes de actualizar DB.

## Funcionalidad 7: eliminar imagen

Ruta:

```http
DELETE /api/admin/productos/15/imagenes/8
```

Controller:

```txt
eliminarImagenProductoAdminController
```

Que hace:

```txt
1. borra la fila de PostgreSQL
2. intenta borrar en Cloudinary usando public_id
3. devuelve la fila eliminada
```

Si la fila tiene:

```txt
public_id = null
```

solo se elimina de PostgreSQL.

Viaje de datos:

```txt
controller
  envia ids al service

service
  valida producto

model
  DELETE FROM producto_imagenes
  RETURNING fila eliminada

service Cloudinary
  destroy(public_id) cuando existe

controller
  responde la imagen eliminada
```

## SQL principal del modelo

### Listar

```sql
SELECT id, producto_id, imagen_url, public_id, principal, orden, creado_en
FROM producto_imagenes
WHERE producto_id = $1
ORDER BY principal DESC, orden ASC, id ASC;
```

### Crear

```sql
INSERT INTO producto_imagenes (
  producto_id,
  imagen_url,
  public_id,
  principal,
  orden
)
VALUES ($1, $2, $3, $4, $5);
```

### Cambiar orden

```sql
UPDATE producto_imagenes
SET orden = $1
WHERE producto_id = $2
  AND id = $3;
```

### Reemplazar

```sql
UPDATE producto_imagenes
SET imagen_url = $1,
    public_id = $2
WHERE producto_id = $3
  AND id = $4;
```

### Eliminar

```sql
DELETE FROM producto_imagenes
WHERE producto_id = $1
  AND id = $2;
```

## Ejemplos frontend admin

### Subir nueva imagen

```js
const formData = new FormData();

formData.append("imagen", archivoSeleccionado);
formData.append("principal", "true");
formData.append("orden", "1");

fetch("/api/admin/productos/15/imagenes", {
  method: "POST",
  body: formData,
});
```

Cuando uses `FormData`, no escribas manualmente:

```txt
Content-Type: multipart/form-data
```

El navegador arma ese header con su boundary.

### Cambiar orden

```js
fetch("/api/admin/productos/15/imagenes/8", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    orden: 2,
  }),
});
```

### Marcar principal

```js
fetch("/api/admin/productos/15/imagenes/8/principal", {
  method: "PATCH",
});
```

### Reemplazar archivo

```js
const formData = new FormData();

formData.append("imagen", nuevoArchivo);

fetch("/api/admin/productos/15/imagenes/8/reemplazar", {
  method: "PUT",
  body: formData,
});
```

### Eliminar

```js
fetch("/api/admin/productos/15/imagenes/8", {
  method: "DELETE",
});
```

## Como replicarlo en otro proyecto

Orden recomendado:

```txt
1. crear tabla producto_imagenes con imagen_url y public_id
2. instalar cloudinary y multer
3. agregar CLOUDINARY_URL al .env
4. crear config/cloudinary.js
5. crear middleware de upload con multer.memoryStorage()
6. crear service Cloudinary para upload y destroy
7. crear model SQL de imagenes
8. crear service admin que coordine DB + Cloudinary
9. crear controller
10. crear router
11. montar router en app.js
12. probar subir, listar, principal, reemplazar y eliminar
```

## Pruebas manuales recomendadas

Prueba en este orden:

```txt
1. GET lista de imagenes de producto existente
2. POST subir imagen con principal=true
3. POST subir segunda imagen con principal=false
4. PATCH marcar segunda como principal
5. PUT cambiar orden
6. PUT reemplazar archivo
7. DELETE eliminar imagen subida
```

Al revisar resultados confirma:

```txt
Cloudinary tiene imagen nueva tras POST
DB guarda imagen_url y public_id
solo la imagen elegida queda principal=true
reemplazar cambia URL y public_id
DELETE quita fila y archivo Cloudinary cuando tenia public_id
```

## Probar rutas con Postman

Esta seccion sirve como guia de prueba ruta por ruta.

Usa como host local:

```txt
http://localhost:3003
```

Antes de probar:

```txt
la API debe estar levantada
el producto debe existir
CLOUDINARY_URL debe estar configurado para POST y reemplazar
```

Los ejemplos usan:

```txt
productoId = 2
imagenId = 201
```

Si tu respuesta al subir una imagen fue:

```json
{
  "id": 201,
  "producto_id": 2
}
```

entonces:

```txt
productoId sale de producto_id -> 2
imagenId sale de id -> 201
```

### Postman 1: listar imagenes del producto

Uso:

```txt
ver la galeria del producto
confirmar ids, orden y cual es principal
```

Metodo:

```http
GET
```

URL:

```http
http://localhost:3003/api/admin/productos/2/imagenes
```

Body:

```txt
sin body
```

Postman:

```txt
1. crea request nueva
2. elige GET
3. pega la URL
4. presiona Send
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": [
    {
      "id": 201,
      "producto_id": 2,
      "imagen_url": "https://res.cloudinary.com/...",
      "public_id": "sosaimpor/productos/2/...",
      "principal": false,
      "orden": 6,
      "creado_en": "2026-05-21T12:20:17.197Z"
    }
  ],
  "pagination": null
}
```

### Postman 2: ver una imagen por id

Uso:

```txt
ver la fila de una imagen puntual
confirmar que pertenece a ese producto
```

Metodo:

```http
GET
```

URL:

```http
http://localhost:3003/api/admin/productos/2/imagenes/201
```

Body:

```txt
sin body
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "id": 201,
    "producto_id": 2,
    "imagen_url": "https://res.cloudinary.com/...",
    "public_id": "sosaimpor/productos/2/...",
    "principal": false,
    "orden": 6,
    "creado_en": "2026-05-21T12:20:17.197Z"
  },
  "pagination": null
}
```

### Postman 3: subir imagen nueva

Uso:

```txt
agregar una imagen al producto desde admin
```

Metodo:

```http
POST
```

URL:

```http
http://localhost:3003/api/admin/productos/2/imagenes
```

Body en Postman:

```txt
Body -> form-data
```

Campos:

| Key | Type | Value ejemplo |
| --- | --- | --- |
| `imagen` | File | Selecciona `foto-producto.webp` |
| `principal` | Text | `false` |
| `orden` | Text | `6` |

Postman:

```txt
1. elige POST
2. abre Body
3. marca form-data
4. crea key imagen
5. cambia el tipo de imagen de Text a File
6. selecciona el archivo
7. agrega principal como Text
8. agrega orden como Text
9. presiona Send
```

No uses:

```txt
raw JSON
binary
x-www-form-urlencoded
```

para subir esta imagen.

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "id": 201,
    "producto_id": 2,
    "imagen_url": "https://res.cloudinary.com/dqt75zrm1/image/upload/...",
    "public_id": "sosaimpor/productos/2/archivo-generado",
    "principal": false,
    "orden": 6,
    "creado_en": "2026-05-21T12:20:17.197Z"
  },
  "pagination": null
}
```

Al terminar verifica:

```txt
imagen_url ya apunta a Cloudinary
public_id ya no esta vacio
la imagen aparece en Cloudinary
la fila aparece en producto_imagenes
```

### Postman 4: editar campos sin cambiar archivo

Uso:

```txt
cambiar metadatos de la fila
no reemplaza la imagen
```

Actualmente esta ruta edita:

```txt
orden
```

Metodo:

```http
PUT
```

URL:

```http
http://localhost:3003/api/admin/productos/2/imagenes/201
```

Body en Postman:

```txt
Body -> raw -> JSON
```

Header:

```txt
Content-Type: application/json
```

Body:

```json
{
  "orden": 1
}
```

Postman:

```txt
1. elige PUT
2. pega la URL sin /reemplazar
3. abre Body
4. marca raw
5. elige JSON
6. envia orden
7. presiona Send
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "id": 201,
    "producto_id": 2,
    "imagen_url": "https://res.cloudinary.com/...",
    "public_id": "sosaimpor/productos/2/...",
    "principal": false,
    "orden": 1,
    "creado_en": "2026-05-21T12:20:17.197Z"
  },
  "pagination": null
}
```

Debes ver:

```txt
orden cambia
imagen_url queda igual
public_id queda igual
```

### Postman 5: marcar imagen principal

Uso:

```txt
poner una imagen como portada del producto
```

Metodo:

```http
PATCH
```

URL:

```http
http://localhost:3003/api/admin/productos/2/imagenes/201/principal
```

Body:

```txt
sin body
```

Postman:

```txt
1. elige PATCH
2. pega la URL terminada en /principal
3. no envies body
4. presiona Send
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "id": 201,
    "producto_id": 2,
    "imagen_url": "https://res.cloudinary.com/...",
    "public_id": "sosaimpor/productos/2/...",
    "principal": true,
    "orden": 1,
    "creado_en": "2026-05-21T12:20:17.197Z"
  },
  "pagination": null
}
```

Al terminar consulta el listado:

```http
GET http://localhost:3003/api/admin/productos/2/imagenes
```

Debes ver:

```txt
imagen 201 -> principal=true
las otras imagenes del producto -> principal=false
```

### Postman 6: cambiar imagen equivocada

Uso:

```txt
reemplazar el archivo que se subio por error
mantener el mismo registro de DB
```

Metodo:

```http
PUT
```

URL:

```http
http://localhost:3003/api/admin/productos/2/imagenes/201/reemplazar
```

Body en Postman:

```txt
Body -> form-data
```

Campo:

| Key | Type | Value ejemplo |
| --- | --- | --- |
| `imagen` | File | Selecciona la imagen correcta |

Postman:

```txt
1. elige PUT
2. pega la URL terminada en /reemplazar
3. abre Body
4. marca form-data
5. crea key imagen
6. cambia el tipo a File
7. selecciona el archivo correcto
8. presiona Send
```

No envies:

```txt
imagen_url manual
public_id manual
raw JSON con archivo
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "id": 201,
    "producto_id": 2,
    "imagen_url": "https://res.cloudinary.com/.../imagen-nueva.webp",
    "public_id": "sosaimpor/productos/2/public-id-nuevo",
    "principal": true,
    "orden": 1,
    "creado_en": "2026-05-21T12:20:17.197Z"
  },
  "pagination": null
}
```

Debes ver:

```txt
id queda igual
producto_id queda igual
orden queda igual
principal queda igual
imagen_url cambia
public_id cambia
```

La API intenta borrar de Cloudinary la imagen anterior cuando tenia `public_id`.

### Postman 7: eliminar imagen

Uso:

```txt
quitar una imagen del producto
```

Metodo:

```http
DELETE
```

URL:

```http
http://localhost:3003/api/admin/productos/2/imagenes/201
```

Body:

```txt
sin body
```

Postman:

```txt
1. elige DELETE
2. pega la URL
3. no envies body
4. presiona Send
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "id": 201,
    "producto_id": 2,
    "imagen_url": "https://res.cloudinary.com/...",
    "public_id": "sosaimpor/productos/2/...",
    "principal": true,
    "orden": 1,
    "creado_en": "2026-05-21T12:20:17.197Z"
  },
  "pagination": null
}
```

La respuesta muestra la fila que se elimino.

Al terminar verifica:

```txt
GET por id debe devolver Imagen no encontrada
GET listado ya no debe incluir imagen 201
Cloudinary ya no debe conservar la imagen si tenia public_id
```

## Errores comunes

### Falta Cloudinary en `.env`

Si `CLOUDINARY_URL` no esta configurado, la subida o borrado que dependa de Cloudinary falla con:

```txt
Cloudinary no esta configurado: falta CLOUDINARY_URL en .env
```

### Enviar JSON al subir archivo

`POST` y `reemplazar` no reciben la foto como JSON.

Debes usar:

```txt
multipart/form-data
```

### Nombre incorrecto del campo archivo

El archivo debe llamarse:

```txt
imagen
```

No:

```txt
file
foto
image
```

si no cambias antes el middleware.

### Querer borrar una URL externa en Cloudinary

Si una imagen tiene URL de Unsplash y `public_id` vacio:

```txt
Cloudinary no tiene ese archivo
```

La API puede borrar la fila de DB, pero no puede borrar un asset externo.

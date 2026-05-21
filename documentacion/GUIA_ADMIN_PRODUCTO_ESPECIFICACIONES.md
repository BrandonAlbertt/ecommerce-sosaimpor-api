# Guia admin producto especificaciones

Esta guia explica el CRUD admin de especificaciones de producto.

Sirve para:

- conocer las rutas disponibles;
- saber que datos se envian en cada peticion;
- entender como viajan los datos entre `routes`, `controllers`, `services`, `models` y PostgreSQL;
- consumir esta parte de la API desde un panel admin.

## Objetivo

Una especificacion guarda un dato tecnico o descriptivo de un producto.

Ejemplos:

```txt
nombre: Procesador
valor: Intel Core i7

nombre: Color
valor: Negro

nombre: Compatibilidad
valor: Toyota Hilux 2021
```

Cada especificacion pertenece a un producto por medio de `producto_id`.

## Tabla usada

La tabla esperada es:

```sql
CREATE TABLE producto_especificaciones (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL,
    valor TEXT NOT NULL
);
```

La regla `ON DELETE CASCADE` significa que si PostgreSQL borra fisicamente un producto, tambien borra sus especificaciones relacionadas.

## Ruta base

La ruta base admin es:

```http
/api/admin/productos/:productoId/especificaciones
```

Ejemplo con un producto de id `15`:

```http
/api/admin/productos/15/especificaciones
```

En `src/app.js` se monta asi:

```js
app.use(
  "/api/admin/productos/:productoId/especificaciones",
  adminProductoEspecificacionesRoutes
);
```

Por ahora estas rutas admin no tienen autenticacion.

Pendiente para produccion:

```js
// TODO: proteger rutas admin con authMiddleware y rol admin.
```

## Rutas disponibles

```http
GET    /api/admin/productos/:productoId/especificaciones
GET    /api/admin/productos/:productoId/especificaciones/:especificacionId
POST   /api/admin/productos/:productoId/especificaciones
PUT    /api/admin/productos/:productoId/especificaciones/:especificacionId
DELETE /api/admin/productos/:productoId/especificaciones/:especificacionId
```

## Resumen rapido

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/admin/productos/:productoId/especificaciones` | Listar especificaciones de un producto |
| GET | `/api/admin/productos/:productoId/especificaciones/:especificacionId` | Ver una especificacion por id |
| POST | `/api/admin/productos/:productoId/especificaciones` | Crear especificacion |
| PUT | `/api/admin/productos/:productoId/especificaciones/:especificacionId` | Editar especificacion |
| DELETE | `/api/admin/productos/:productoId/especificaciones/:especificacionId` | Eliminar especificacion |

## Archivos usados

| Archivo | Responsabilidad |
| --- | --- |
| `src/app.js` | Monta la ruta base admin |
| `src/routes/admin.producto-especificaciones.routes.js` | Define metodos y URLs |
| `src/controllers/admin.producto-especificaciones.controller.js` | Recibe `req`, llama al service y devuelve JSON |
| `src/services/admin.producto-especificaciones.service.js` | Valida ids y datos enviados |
| `src/models/producto-especificaciones.model.js` | Ejecuta SQL contra PostgreSQL |
| `src/utils/response.js` | Formato estandar de respuesta exitosa |
| `src/middlewares/error.middleware.js` | Formato de errores |

## Campos

Una especificacion devuelve:

```txt
id
producto_id
nombre
valor
```

Para crear o editar se aceptan estos campos en el body:

```txt
nombre
valor
```

No se toma `producto_id` desde el body.

El `producto_id` se obtiene desde la URL:

```http
/api/admin/productos/:productoId/especificaciones
```

Esto evita mover una especificacion a otro producto por accidente al editarla.

## Validaciones principales

El service valida:

```txt
productoId debe ser entero positivo
especificacionId debe ser entero positivo cuando la ruta lo use
el producto debe existir
nombre es obligatorio al crear
valor es obligatorio al crear
nombre no puede superar 120 caracteres
nombre y valor no pueden quedar vacios al editar
```

Si el producto no existe:

```json
{
  "ok": false,
  "message": "Producto no encontrado"
}
```

Si la especificacion no existe dentro de ese producto:

```json
{
  "ok": false,
  "message": "Especificacion no encontrada"
}
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

El listado devuelve un arreglo en `data`:

```json
{
  "ok": true,
  "data": [
    {
      "id": 8,
      "producto_id": 15,
      "nombre": "Color",
      "valor": "Negro"
    },
    {
      "id": 9,
      "producto_id": 15,
      "nombre": "Compatibilidad",
      "valor": "Toyota Hilux 2021"
    }
  ],
  "pagination": null
}
```

## Listar especificaciones

Peticion:

```http
GET /api/admin/productos/15/especificaciones
```

Uso:

```txt
trae todas las especificaciones del producto 15
ordena por id ascendente
```

Respuesta ejemplo:

```json
{
  "ok": true,
  "data": [
    {
      "id": 8,
      "producto_id": 15,
      "nombre": "Color",
      "valor": "Negro"
    }
  ],
  "pagination": null
}
```

## Ver una especificacion por id

Peticion:

```http
GET /api/admin/productos/15/especificaciones/8
```

Importante:

```txt
la especificacion 8 debe pertenecer al producto 15
```

Si existe:

```json
{
  "ok": true,
  "data": {
    "id": 8,
    "producto_id": 15,
    "nombre": "Color",
    "valor": "Negro"
  },
  "pagination": null
}
```

## Crear especificacion

Peticion:

```http
POST /api/admin/productos/15/especificaciones
Content-Type: application/json
```

Body:

```json
{
  "nombre": "Color",
  "valor": "Negro"
}
```

El backend inserta:

```txt
producto_id = 15 desde req.params.productoId
nombre = "Color" desde req.body.nombre
valor = "Negro" desde req.body.valor
```

Respuesta `201` ejemplo:

```json
{
  "ok": true,
  "data": {
    "id": 8,
    "producto_id": 15,
    "nombre": "Color",
    "valor": "Negro"
  },
  "pagination": null
}
```

## Editar especificacion

Peticion:

```http
PUT /api/admin/productos/15/especificaciones/8
Content-Type: application/json
```

Body para cambiar ambos campos:

```json
{
  "nombre": "Color exterior",
  "valor": "Negro brillante"
}
```

Tambien se puede enviar solo un campo permitido:

```json
{
  "valor": "Negro mate"
}
```

El backend actualiza solo campos presentes en el body:

```txt
nombre
valor
```

Respuesta ejemplo:

```json
{
  "ok": true,
  "data": {
    "id": 8,
    "producto_id": 15,
    "nombre": "Color",
    "valor": "Negro mate"
  },
  "pagination": null
}
```

## Eliminar especificacion

Peticion:

```http
DELETE /api/admin/productos/15/especificaciones/8
```

Esta ruta borra fisicamente la fila:

```sql
DELETE FROM producto_especificaciones
WHERE producto_id = $1
  AND id = $2;
```

Respuesta ejemplo:

```json
{
  "ok": true,
  "data": {
    "id": 8,
    "producto_id": 15,
    "nombre": "Color",
    "valor": "Negro"
  },
  "pagination": null
}
```

## Como viajan los datos

La estructura general es:

```txt
app -> route -> controller -> service -> model -> PostgreSQL
```

Para este CRUD:

```txt
src/app.js
  -> monta /api/admin/productos/:productoId/especificaciones

src/routes/admin.producto-especificaciones.routes.js
  -> decide el controller segun metodo y URL

src/controllers/admin.producto-especificaciones.controller.js
  -> lee req.params y req.body
  -> llama al service
  -> responde con successResponse(...)

src/services/admin.producto-especificaciones.service.js
  -> valida productoId y especificacionId
  -> verifica si el producto existe
  -> limpia nombre y valor
  -> llama al model

src/models/producto-especificaciones.model.js
  -> ejecuta SQL parametrizado
  -> devuelve filas de PostgreSQL
```

## Viaje de datos al listar

Peticion:

```http
GET /api/admin/productos/15/especificaciones
```

Flujo:

```txt
URL
  productoId = "15"

route
  GET "/" llama listarEspecificacionesProductoAdminController

controller
  toma req.params.productoId
  llama obtenerEspecificacionesProductoAdmin("15")

service
  convierte "15" a numero 15
  valida que el id sea positivo
  valida que el producto 15 exista

model
  ejecuta SELECT en producto_especificaciones
  filtra WHERE producto_id = $1

controller
  devuelve { ok, data, pagination }
```

## Viaje de datos al crear

Peticion:

```http
POST /api/admin/productos/15/especificaciones
```

Body:

```json
{
  "nombre": "Material",
  "valor": "Aluminio"
}
```

Flujo:

```txt
URL
  productoId = "15"

body
  nombre = "Material"
  valor = "Aluminio"

route
  POST "/" llama crearEspecificacionProductoAdminController

controller
  envia req.params.productoId y req.body al service

service
  convierte productoId a numero
  valida nombre y valor
  valida que el producto exista

model
  ejecuta INSERT
  usa producto_id desde la URL
  usa nombre y valor desde el body validado
  vuelve a consultar la fila creada

controller
  responde con status 201
```

## Viaje de datos al editar

Peticion:

```http
PUT /api/admin/productos/15/especificaciones/8
```

Body:

```json
{
  "valor": "Acero"
}
```

Flujo:

```txt
URL
  productoId = "15"
  especificacionId = "8"

body
  valor = "Acero"

service
  valida productoId
  valida especificacionId
  valida que el producto exista
  valida que la especificacion 8 pertenezca al producto 15
  deja solo campos permitidos del body

model
  ejecuta UPDATE por producto_id e id
  actualiza solo valor
```

## Viaje de datos al eliminar

Peticion:

```http
DELETE /api/admin/productos/15/especificaciones/8
```

Flujo:

```txt
URL
  productoId = "15"
  especificacionId = "8"

service
  valida ids
  valida que el producto exista

model
  ejecuta DELETE con producto_id e id
  devuelve la fila eliminada

controller
  responde la especificacion eliminada
```

## SQL que usa el modelo

Listado:

```sql
SELECT id, producto_id, nombre, valor
FROM producto_especificaciones
WHERE producto_id = $1
ORDER BY id ASC;
```

Detalle:

```sql
SELECT id, producto_id, nombre, valor
FROM producto_especificaciones
WHERE producto_id = $1
  AND id = $2
LIMIT 1;
```

Crear:

```sql
INSERT INTO producto_especificaciones (producto_id, nombre, valor)
VALUES ($1, $2, $3);
```

Editar:

```sql
UPDATE producto_especificaciones
SET nombre = $1,
    valor = $2
WHERE producto_id = $3
  AND id = $4;
```

Eliminar:

```sql
DELETE FROM producto_especificaciones
WHERE producto_id = $1
  AND id = $2;
```

## Ejemplos rapidos para frontend admin

Listar al abrir la ficha de un producto:

```js
fetch("/api/admin/productos/15/especificaciones")
  .then((response) => response.json())
  .then((response) => {
    console.log(response.data);
  });
```

Crear desde un formulario:

```js
fetch("/api/admin/productos/15/especificaciones", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    nombre: "Material",
    valor: "Aluminio",
  }),
});
```

Editar:

```js
fetch("/api/admin/productos/15/especificaciones/8", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    valor: "Acero",
  }),
});
```

Eliminar:

```js
fetch("/api/admin/productos/15/especificaciones/8", {
  method: "DELETE",
});
```

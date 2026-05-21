# Guia tecnica de admin productos

Esta guia explica como se agregaron las rutas admin de productos sin romper la API publica existente.

## Objetivo

Mantener la API publica:

```http
GET /api/productos
GET /api/productos/filtros-opciones
```

y agregar una API separada para administracion:

```http
/api/admin/productos
```

La ruta publica sigue mostrando solo productos activos. La ruta admin puede listar, crear, editar, activar y desactivar productos.

Estado de visibilidad actual:

```txt
publico -> exige producto activo y categoria activa
admin   -> puede ver productos activos e inactivos, incluso si su categoria esta inactiva
```

## Archivos usados

| Archivo | Responsabilidad |
| --- | --- |
| `src/app.js` | Monta `/api/admin/productos` |
| `src/routes/admin.productos.routes.js` | Define rutas admin |
| `src/controllers/admin.productos.controller.js` | Recibe request y responde JSON |
| `src/services/admin.productos.service.js` | Valida datos y coordina filtros, paginacion y modelo |
| `src/models/productos.model.js` | Contiene funciones SQL publicas y admin |
| `src/utils/filters.js` | Tiene filtros publicos y filtros admin |
| `src/utils/pagination.js` | Calcula `page`, `limit` y `offset` |
| `src/utils/response.js` | Mantiene formato `{ ok, data, pagination }` |

## Montaje en Express

En `src/app.js`:

```js
import adminProductosRoutes from "./routes/admin.productos.routes.js";

app.use("/api/admin/productos", adminProductosRoutes);
```

Tambien se deja un comentario pendiente:

```js
// TODO: proteger rutas admin con authMiddleware y rol admin.
```

## Rutas admin

En `src/routes/admin.productos.routes.js`:

```js
router.get("/", listarProductosAdmin);
router.get("/:id", obtenerProductoAdminPorIdController);
router.post("/", crearProductoAdminController);
router.put("/:id", actualizarProductoAdminController);
router.patch("/:id/desactivar", desactivarProductoAdminController);
router.patch("/:id/activar", activarProductoAdminController);
```

Rutas finales:

```http
GET    /api/admin/productos
GET    /api/admin/productos/:id
POST   /api/admin/productos
PUT    /api/admin/productos/:id
PATCH  /api/admin/productos/:id/desactivar
PATCH  /api/admin/productos/:id/activar
```

## Flujo por capas

Ejemplo:

```http
GET /api/admin/productos?search=faro&activo=true&page=1&limit=20
```

Viaje interno:

```txt
src/app.js
  -> monta /api/admin/productos

src/routes/admin.productos.routes.js
  -> GET "/" llama a listarProductosAdmin

src/controllers/admin.productos.controller.js
  -> recibe req.query
  -> llama a obtenerProductosAdmin(req.query)

src/services/admin.productos.service.js
  -> getAdminProductFilters(query)
  -> getPagination(query)
  -> listarProductosAdminFiltrados(filters, pagination)

src/models/productos.model.js
  -> arma WHERE admin
  -> ejecuta COUNT
  -> ejecuta SELECT con LIMIT y OFFSET

PostgreSQL
  -> devuelve filas
```

## Diferencia entre filtros publicos y admin

Filtro publico:

```js
getProductFilters(query)
```

Uso:

```txt
GET /api/productos
```

La consulta publica en el modelo mantiene:

```sql
WHERE p.activo = true
```

Filtro admin:

```js
getAdminProductFilters(query)
```

Uso:

```txt
GET /api/admin/productos
```

Agrega soporte para:

```txt
activo=true
activo=false
```

Reglas admin:

```txt
activo no enviado -> no filtra por activo
activo=true      -> p.activo = true
activo=false     -> p.activo = false
```

Esto permite que admin vea productos activos e inactivos sin cambiar la ruta publica.

## Funciones admin en service

En `src/services/admin.productos.service.js`:

```js
obtenerProductosAdmin(query)
obtenerProductoAdmin(id)
crearProducto(data)
actualizarProducto(id, data)
desactivarProducto(id)
activarProducto(id)
```

Responsabilidades del service:

```txt
validar id
validar campos obligatorios
validar precio y stock
validar categoria_id si se envia
separar filtros y paginacion
devolver errores con statusCode
```

## Funciones admin en model

En `src/models/productos.model.js` se agregaron funciones nuevas, sin eliminar las publicas:

```js
listarProductosAdminFiltrados(filters, pagination)
obtenerProductoAdminPorId(id)
crearProductoAdmin(data)
actualizarProductoAdmin(id, data)
desactivarProductoAdmin(id)
activarProductoAdmin(id)
categoriaProductoExiste(categoriaId)
```

La funcion publica sigue existiendo:

```js
listarProductosFiltrados(filters, pagination)
```

Esta funcion publica no debe modificarse para admin porque fuerza productos activos.

Ademas, la funcion publica aplica visibilidad por categoria activa. Esa regla no se copia al listado admin porque el admin debe conservar acceso a productos asociados a categorias inactivas.

## SQL de listado admin

Admin no fuerza `p.activo = true`.

Caso sin `activo`:

```sql
SELECT ...
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
ORDER BY p.creado_en DESC, p.id DESC
LIMIT $n
OFFSET $n
```

Caso con `activo=true`:

```sql
WHERE p.activo = true
```

Caso con `activo=false`:

```sql
WHERE p.activo = false
```

## Busqueda admin

La busqueda admin usa la misma idea que la publica:

```sql
p.nombre ILIKE '%texto%'
OR p.marca ILIKE '%texto%'
OR p.modelo ILIKE '%texto%'
OR p.tipo_producto ILIKE '%texto%'
OR p.codigo_producto ILIKE '%texto%'
```

Ejemplo:

```http
GET /api/admin/productos?search=faro&page=1&limit=20
```

Si no se manda `activo`, busca en activos e inactivos.

## Paginacion admin

Admin reutiliza:

```js
getPagination(query)
```

Reglas:

```txt
page minimo: 1
limit por defecto: 12
limit maximo: 50
offset: (page - 1) * limit
```

Ejemplo:

```http
GET /api/admin/productos?page=2&limit=20
```

Resultado interno:

```js
{
  page: 2,
  limit: 20,
  offset: 20
}
```

## Campos permitidos para crear y editar

```txt
categoria_id
nombre
slug
descripcion
tipo_producto
marca
modelo
anio
codigo_producto
condicion
precio
stock
proximamente
destacado
orden_destacado
activo
```

No se incluyen imagenes en `POST /api/admin/productos` ni en `PUT /api/admin/productos/:id`.

La imagen principal se lee desde `producto_imagenes` y se devuelve como:

```txt
imagen_principal
```

Esto sirve para mostrar una miniatura en el listado admin, pero la administracion completa de imagenes debe manejarse en rutas separadas.

Tabla esperada:

```sql
producto_imagenes
```

Campos esperados:

```txt
id
producto_id
imagen_url
principal
orden
```

## Validaciones

Crear:

```txt
nombre obligatorio
slug obligatorio
precio obligatorio
precio >= 0
stock >= 0
categoria_id debe existir si se envia
```

Editar:

```txt
producto debe existir
nombre no puede quedar vacio si se envia
slug no puede quedar vacio si se envia
precio >= 0 si se envia
stock >= 0 si se envia
categoria_id debe existir si se envia
```

## Crear producto

Ruta:

```http
POST /api/admin/productos
```

El service valida datos y llama:

```js
crearProductoAdmin(productData)
```

El model ejecuta:

```sql
INSERT INTO productos (...)
VALUES (...)
RETURNING id
```

Luego vuelve a consultar por id para devolver el producto completo con `categoria_nombre` e `imagen_principal`.

## Editar producto

Ruta:

```http
PUT /api/admin/productos/:id
```

El service:

```txt
valida id
verifica que exista el producto
limpia campos permitidos
valida datos
llama al model
```

El model arma un `UPDATE` dinamico solo con campos enviados.

## Desactivar producto

Ruta:

```http
PATCH /api/admin/productos/:id/desactivar
```

SQL:

```sql
UPDATE productos SET activo = false WHERE id = $1
```

Esto es eliminacion logica. El producto deja de aparecer en la ruta publica porque la publica solo lista `activo = true`.

## Activar producto

Ruta:

```http
PATCH /api/admin/productos/:id/activar
```

SQL:

```sql
UPDATE productos SET activo = true WHERE id = $1
```

El producto vuelve a poder aparecer en la ruta publica.

## Imagen principal

El listado admin y el detalle admin devuelven `imagen_principal` usando una subconsulta:

```sql
SELECT pi.imagen_url
FROM producto_imagenes pi
WHERE pi.producto_id = p.id
ORDER BY pi.principal DESC, pi.orden ASC
LIMIT 1
```

Regla:

```txt
primero toma la imagen marcada como principal
si no hay principal, toma la de menor orden
```

Esto permite que el panel admin muestre una imagen del producto sin cargar todas las imagenes.

## Pendiente tecnico: CRUD de imagenes

Las rutas admin de productos actuales no crean ni editan imagenes. Para completar esa parte, se recomienda agregar una capa separada para `producto_imagenes`.

Rutas sugeridas:

```http
GET    /api/admin/productos/:id/imagenes
POST   /api/admin/productos/:id/imagenes
PUT    /api/admin/productos/:id/imagenes/:imagenId
PATCH  /api/admin/productos/:id/imagenes/:imagenId/principal
DELETE /api/admin/productos/:id/imagenes/:imagenId
```

Archivos sugeridos:

```txt
src/routes/admin.producto-imagenes.routes.js
src/controllers/admin.producto-imagenes.controller.js
src/services/admin.producto-imagenes.service.js
```

Funciones sugeridas en model:

```txt
listarImagenesProductoAdmin(productoId)
crearImagenProductoAdmin(productoId, data)
actualizarImagenProductoAdmin(productoId, imagenId, data)
marcarImagenPrincipalAdmin(productoId, imagenId)
eliminarImagenProductoAdmin(productoId, imagenId)
```

Validaciones recomendadas:

```txt
producto debe existir
imagen_url obligatorio al crear
orden debe ser numerico si se envia
principal debe ser booleano si se envia
imagen debe pertenecer al producto
```

Para marcar imagen principal, conviene usar transaccion:

```sql
BEGIN;

UPDATE producto_imagenes
SET principal = false
WHERE producto_id = $1;

UPDATE producto_imagenes
SET principal = true
WHERE id = $2 AND producto_id = $1;

COMMIT;
```

Asi se evita que un producto tenga mas de una imagen principal.

## Formato de respuesta

Todas las respuestas exitosas usan:

```js
successResponse(data, pagination)
```

Listado:

```json
{
  "ok": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

Detalle, crear, editar, activar o desactivar:

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "nombre": "Faro delantero Toyota Hilux",
    "activo": true
  },
  "pagination": null
}
```

## Errores

El service crea errores con `statusCode`.

Ejemplos:

```txt
400 -> validacion incorrecta
404 -> producto no encontrado
```

El middleware de errores responde:

```json
{
  "ok": false,
  "message": "Producto no encontrado"
}
```

## Pruebas manuales recomendadas

Publicas:

```http
GET /api/productos
GET /api/productos?page=1&limit=12&search=faro
```

Admin:

```http
GET /api/admin/productos?page=1&limit=20
GET /api/admin/productos?activo=true&page=1&limit=20
GET /api/admin/productos?activo=false&page=1&limit=20
GET /api/admin/productos?search=faro&page=1&limit=20
GET /api/admin/productos/1
```

Mutaciones:

```http
POST /api/admin/productos
PUT /api/admin/productos/1
PATCH /api/admin/productos/1/desactivar
PATCH /api/admin/productos/1/activar
```

## Reglas para no romper la API publica

- No cambiar `listarProductosFiltrados`.
- No quitar `WHERE p.activo = true` de la consulta publica.
- No cambiar los campos del `SELECT` publico.
- No cambiar `GET /api/productos`.
- No cambiar `GET /api/productos/filtros-opciones`.
- Agregar funciones admin con nombres nuevos.

## Pendientes futuros

- Proteger rutas admin con autenticacion.
- Agregar rol admin.
- Agregar logs de auditoria para crear, editar, activar y desactivar.
- CRUD admin para categorias ya existe en `/api/admin/categorias`; falta conectarlo al panel admin cuando se implemente frontend.
- Agregar CRUD admin para producto_imagenes.
- Agregar CRUD admin para producto_especificaciones.
- Agregar tests automatizados para rutas admin.

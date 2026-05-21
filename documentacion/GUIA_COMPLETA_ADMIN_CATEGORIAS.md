# Guia completa admin categorias

Esta guia explica la parte admin de categorias de la API.

Sirve para:

- entender que hace cada ruta;
- saber que archivos participan;
- seguir como viajan los datos desde la URL hasta PostgreSQL;
- replicar la misma estructura en otro proyecto Node.js + Express + PostgreSQL.

## Objetivo

La tabla `categorias` permite organizar productos.

Ejemplo:

```txt
Faros
Motores
Frenos
Accesorios
```

El admin necesita poder:

```txt
listar categorias
buscar categorias
filtrar categorias
ver categoria por id
crear categoria
editar categoria
desactivar categoria
activar categoria
```

## Tabla usada

La tabla esperada es:

```sql
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,

    color_hex VARCHAR(20) DEFAULT '#2563EB',
    color_texto_hex VARCHAR(20) DEFAULT '#FFFFFF',

    destacada BOOLEAN DEFAULT FALSE,
    orden_destacado INT DEFAULT 0,
    visitas INT DEFAULT 0,

    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Ruta base

La ruta base admin es:

```http
/api/admin/categorias
```

En `src/app.js` se monta asi:

```js
app.use("/api/admin/categorias", adminCategoriasRoutes);
```

Por ahora estas rutas no tienen autenticacion.

Pendiente para produccion:

```js
// TODO: proteger rutas admin con authMiddleware y rol admin.
```

## Rutas disponibles

```http
GET    /api/admin/categorias
GET    /api/admin/categorias/:id
POST   /api/admin/categorias
PUT    /api/admin/categorias/:id
PATCH  /api/admin/categorias/:id/desactivar
PATCH  /api/admin/categorias/:id/activar
DELETE /api/admin/categorias/:id
```

## Resumen rapido

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/admin/categorias` | Listar con filtros y paginacion |
| GET | `/api/admin/categorias/:id` | Ver una categoria por id |
| POST | `/api/admin/categorias` | Crear categoria |
| PUT | `/api/admin/categorias/:id` | Editar categoria |
| PATCH | `/api/admin/categorias/:id/desactivar` | Desactivar categoria |
| PATCH | `/api/admin/categorias/:id/activar` | Activar categoria |
| DELETE | `/api/admin/categorias/:id` | Desactivar categoria como eliminacion logica |

## Importante sobre eliminar

`DELETE /api/admin/categorias/:id` no borra fisicamente la fila.

Hace eliminacion logica:

```sql
UPDATE categorias
SET activa = false
WHERE id = $1
```

Esto es util porque productos pueden depender de una categoria existente.

## Efecto en productos publicos

Desactivar una categoria no borra productos asociados.

La regla actual es:

```txt
admin:
  puede ver la categoria inactiva
  puede ver productos asociados a esa categoria

frontend usuario:
  no recibe productos de categorias inactivas desde GET /api/productos
```

Ejemplo:

```txt
Categoria Faros -> activa = false
Producto Faro Toyota -> activo = true
```

Resultado:

```txt
GET /api/admin/productos      -> el admin puede ver Faro Toyota
GET /api/productos            -> el usuario no recibe Faro Toyota
```

La regla se aplica en la API publica de productos, no en el frontend.

## Archivos usados

| Archivo | Responsabilidad |
| --- | --- |
| `src/app.js` | Monta la ruta `/api/admin/categorias` |
| `src/routes/admin.categorias.routes.js` | Define metodos y URLs |
| `src/controllers/admin.categorias.controller.js` | Recibe `req`, llama al service y responde JSON |
| `src/services/admin.categorias.service.js` | Valida datos, arma filtros y paginacion |
| `src/models/categorias.model.js` | Ejecuta SQL contra PostgreSQL |
| `src/utils/pagination.js` | Calcula `page`, `limit` y `offset` |
| `src/utils/response.js` | Formato estandar `{ ok, data, pagination }` |
| `src/middlewares/error.middleware.js` | Respuesta de errores |

## Flujo general

La estructura por capas es:

```txt
route -> controller -> service -> model -> PostgreSQL
```

En este proyecto:

```txt
src/app.js
  -> monta /api/admin/categorias

src/routes/admin.categorias.routes.js
  -> decide que controller usar

src/controllers/admin.categorias.controller.js
  -> recibe req.params, req.query o req.body
  -> llama al service

src/services/admin.categorias.service.js
  -> valida datos
  -> limpia datos permitidos
  -> usa paginacion
  -> llama al model

src/models/categorias.model.js
  -> arma SQL parametrizado
  -> consulta PostgreSQL
```

## Ejemplo facil: listar categorias

Peticion:

```http
GET /api/admin/categorias?page=1&limit=20
```

Asi viajan los datos:

```txt
URL
  page=1
  limit=20

routes/admin.categorias.routes.js
  GET "/" llama a listarCategoriasAdmin

controllers/admin.categorias.controller.js
  recibe req.query
  llama obtenerCategoriasAdmin(req.query)

services/admin.categorias.service.js
  crea filtros admin
  llama getPagination(query)

utils/pagination.js
  page: 1
  limit: 20
  offset: 0

models/categorias.model.js
  ejecuta COUNT para total
  ejecuta SELECT con LIMIT 20 y OFFSET 0

PostgreSQL
  devuelve categorias
```

Respuesta:

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

## Campos que devuelve categoria

```txt
id
nombre
slug
descripcion
imagen_url
color_hex
color_texto_hex
destacada
orden_destacado
visitas
activa
creado_en
```

## Listar categorias con filtros

Ruta:

```http
GET /api/admin/categorias
```

Query params soportados:

| Campo | Query param | Ejemplo |
| --- | --- | --- |
| Pagina | `page` | `page=1` |
| Limite | `limit` | `limit=20` |
| Busqueda | `search` | `search=faro` |
| Activa | `activa` | `activa=true` |
| Destacada | `destacada` | `destacada=false` |

### Listar todas

```http
GET /api/admin/categorias?page=1&limit=20
```

Si no mandas `activa`, devuelve activas e inactivas.

### Listar activas

```http
GET /api/admin/categorias?activa=true&page=1&limit=20
```

### Listar inactivas

```http
GET /api/admin/categorias?activa=false&page=1&limit=20
```

### Buscar por texto

```http
GET /api/admin/categorias?search=faro&page=1&limit=20
```

Busca coincidencias parciales en:

```txt
nombre
slug
descripcion
```

Internamente usa `ILIKE`:

```sql
nombre ILIKE '%faro%'
OR slug ILIKE '%faro%'
OR descripcion ILIKE '%faro%'
```

### Listar destacadas

```http
GET /api/admin/categorias?destacada=true&page=1&limit=20
```

### Listar no destacadas

```http
GET /api/admin/categorias?destacada=false&page=1&limit=20
```

### Filtros combinados

```http
GET /api/admin/categorias?search=faro&activa=true&destacada=true&page=1&limit=20
```

## Paginacion

El service usa:

```js
getPagination(query)
```

Reglas del proyecto:

```txt
page minimo = 1
limit por defecto = 12
limit maximo = 50
offset = (page - 1) * limit
```

Ejemplo:

```http
GET /api/admin/categorias?page=2&limit=10
```

Resultado interno:

```js
{
  page: 2,
  limit: 10,
  offset: 10
}
```

## Ver categoria por id

Ruta:

```http
GET /api/admin/categorias/1
```

Viaje:

```txt
route
  -> lee :id
controller
  -> llama obtenerCategoriaAdmin(req.params.id)
service
  -> valida que id sea entero positivo
model
  -> SELECT por id
```

SQL parecido:

```sql
SELECT ...
FROM categorias
WHERE id = $1
LIMIT 1
```

Si no existe:

```json
{
  "ok": false,
  "message": "Categoria no encontrada"
}
```

## Crear categoria

Ruta:

```http
POST /api/admin/categorias
Content-Type: application/json
```

Body ejemplo:

```json
{
  "nombre": "Faros",
  "slug": "faros",
  "descripcion": "Faros delanteros y posteriores",
  "imagen_url": "https://ejemplo.com/faros.jpg",
  "color_hex": "#EF4444",
  "color_texto_hex": "#FFFFFF",
  "destacada": true,
  "orden_destacado": 1,
  "activa": true
}
```

Campos obligatorios:

```txt
nombre
slug
```

Campos permitidos al crear:

```txt
nombre
slug
descripcion
imagen_url
color_hex
color_texto_hex
destacada
orden_destacado
activa
```

El campo `visitas` no se crea desde el admin de esta ruta. La base de datos usa su valor por defecto.

Flujo:

```txt
controller
  -> recibe req.body

service
  -> deja solo campos permitidos
  -> valida nombre
  -> valida slug
  -> valida booleanos y numeros enviados

model
  -> INSERT INTO categorias
  -> RETURNING id
  -> vuelve a consultar la categoria completa
```

Respuesta exitosa:

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "nombre": "Faros",
    "slug": "faros",
    "activa": true
  },
  "pagination": null
}
```

## Editar categoria

Ruta:

```http
PUT /api/admin/categorias/1
Content-Type: application/json
```

Body ejemplo:

```json
{
  "nombre": "Faros importados",
  "descripcion": "Faros verificados",
  "destacada": true,
  "orden_destacado": 2
}
```

Puede recibir body parcial.

Validaciones:

```txt
id debe ser valido
categoria debe existir
nombre no puede quedar vacio si se envia
slug no puede quedar vacio si se envia
orden_destacado debe ser numerico si se envia
destacada y activa deben ser booleanos si se envian
```

El model arma el `UPDATE` solo con campos enviados.

## Desactivar categoria

Ruta:

```http
PATCH /api/admin/categorias/1/desactivar
```

Tambien existe:

```http
DELETE /api/admin/categorias/1
```

Ambas desactivan:

```sql
UPDATE categorias
SET activa = false
WHERE id = $1
```

## Activar categoria

Ruta:

```http
PATCH /api/admin/categorias/1/activar
```

SQL:

```sql
UPDATE categorias
SET activa = true
WHERE id = $1
```

## Orden del listado

El listado admin se ordena asi:

```sql
ORDER BY destacada DESC, orden_destacado ASC, creado_en DESC, id DESC
```

Significa:

```txt
primero categorias destacadas
luego menor orden_destacado
luego categorias mas recientes
```

## Formato estandar de respuesta

El controller usa:

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
    "limit": 12,
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
  "data": {},
  "pagination": null
}
```

Error:

```json
{
  "ok": false,
  "message": "Categoria no encontrada"
}
```

## Validaciones implementadas

```txt
nombre obligatorio al crear
slug obligatorio al crear
nombre no vacio si se edita
slug no vacio si se edita
id entero positivo
orden_destacado numerico si se envia
destacada boolean si se envia
activa boolean si se envia
```

## Pruebas manuales

Listar:

```http
GET /api/admin/categorias?page=1&limit=20
```

Filtrar activas:

```http
GET /api/admin/categorias?activa=true&page=1&limit=20
```

Filtrar inactivas:

```http
GET /api/admin/categorias?activa=false&page=1&limit=20
```

Buscar:

```http
GET /api/admin/categorias?search=faro&page=1&limit=20
```

Detalle:

```http
GET /api/admin/categorias/1
```

Crear:

```http
POST /api/admin/categorias
```

Editar:

```http
PUT /api/admin/categorias/1
```

Desactivar:

```http
PATCH /api/admin/categorias/1/desactivar
```

Activar:

```http
PATCH /api/admin/categorias/1/activar
```

## Como replicarlo en otro proyecto

### 1. Crear la tabla

Necesitas una tabla con:

```txt
id
campos editables
campo activo o activa para eliminacion logica
fecha de creacion
```

### 2. Montar ruta base

```js
app.use("/api/admin/categorias", adminCategoriasRoutes);
```

### 3. Crear archivo de routes

```js
router.get("/", listar);
router.get("/:id", obtenerPorId);
router.post("/", crear);
router.put("/:id", editar);
router.patch("/:id/desactivar", desactivar);
router.patch("/:id/activar", activar);
router.delete("/:id", desactivar);
```

### 4. Crear controller

El controller debe ser delgado:

```txt
recibe req
llama service
responde JSON
pasa error a next
```

### 5. Crear service

El service debe:

```txt
validar ids
validar body
limpiar campos permitidos
usar paginacion
llamar model
decidir errores 400 o 404
```

### 6. Crear model

El model debe:

```txt
armar SQL parametrizado
listar con COUNT y SELECT
obtener por id
insertar
actualizar
activar
desactivar
```

### 7. Mantener respuestas consistentes

Listado:

```txt
data + pagination
```

Detalle o mutacion:

```txt
data + pagination null
```

### 8. Proteger admin despues

Cuando agregues login:

```txt
authMiddleware
validacion de rol admin
auditoria de cambios
```

## Diferencia con categorias publicas

En este proyecto existe:

```txt
src/routes/categorias.routes.js
```

Actualmente esa ruta publica esta vacia.

El admin vive separado en:

```txt
src/routes/admin.categorias.routes.js
```

Esto evita mezclar:

```txt
lecturas publicas
operaciones de administracion
```

## Pendientes posibles

- Agregar autenticacion admin.
- Agregar validacion de formato de colores hex.
- Agregar manejo claro de error por `slug` duplicado.
- Agregar pruebas automatizadas.
- Crear ruta publica de categorias activas si el frontend la necesita.

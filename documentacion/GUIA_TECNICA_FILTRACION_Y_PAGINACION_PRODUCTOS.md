# Guia tecnica de filtracion y paginacion de productos

Esta guia explica como se implemento la filtracion y paginacion de productos en la API. Sirve como referencia tecnica para mantener este proyecto o replicar el mismo patron en otra API.

## Idea principal

Todos los filtros usan una sola ruta:

```http
GET /api/productos
```

Los filtros se envian como query params:

```http
GET /api/productos?page=1&limit=12&marca=Toyota&search=faro
```

El flujo esta separado por capas:

```txt
routes -> controller -> service -> model -> database
```

## Archivos usados

| Archivo | Responsabilidad |
| --- | --- |
| `src/routes/productos.routes.js` | Define las rutas de productos |
| `src/controllers/productos.controller.js` | Recibe `req.query` y responde JSON |
| `src/services/productos.service.js` | Arma filtros, paginacion y metadata |
| `src/models/productos.model.js` | Construye y ejecuta el SQL |
| `src/utils/filters.js` | Limpia y convierte query params |
| `src/utils/pagination.js` | Calcula `page`, `limit` y `offset` |
| `src/utils/response.js` | Estandariza la respuesta exitosa |
| `src/middlewares/error.middleware.js` | Centraliza errores |

## Base de datos esperada

Tabla principal:

```sql
productos
```

Campos usados por filtros:

```sql
productos.categoria_id
productos.nombre
productos.tipo_producto
productos.marca
productos.modelo
productos.anio
productos.codigo_producto
productos.condicion
productos.precio
productos.stock
productos.proximamente
productos.destacado
productos.activo
productos.creado_en
```

Tablas relacionadas:

```sql
categorias
producto_imagenes
```

La relacion de categoria:

```sql
productos.categoria_id REFERENCES categorias(id)
```

## Filtros soportados

| Query param | Tipo interno | Regla SQL |
| --- | --- | --- |
| `categoria_id` | Numero | `p.categoria_id = valor` |
| `marca` | Texto | `LOWER(p.marca) = LOWER(valor)` |
| `modelo` | Texto | `LOWER(p.modelo) = LOWER(valor)` |
| `tipo_producto` | Texto | `LOWER(p.tipo_producto) = LOWER(valor)` |
| `condicion` | Texto | `p.condicion = valor` |
| `precio_min` | Numero | `p.precio >= valor` |
| `precio_max` | Numero | `p.precio <= valor` |
| `stock` | Numero | `p.stock = valor` |
| `anio` | Numero | `p.anio = valor` |
| `anio_min` | Numero | `p.anio >= valor` |
| `anio_max` | Numero | `p.anio <= valor` |
| `destacado` | Booleano | `p.destacado = valor` |
| `disponibilidad` | Texto | `stock > 0` o `stock = 0 AND proximamente = true` |
| `search` | Texto | Busca con `ILIKE` |

Siempre se filtra:

```sql
p.activo = true
```

## Rutas

En `src/routes/productos.routes.js` se definen las rutas del modulo:

```js
router.get("/filtros-opciones", listarFiltrosProductos);
router.get("/", listarProductos);
```

Rutas finales:

```http
GET /api/productos
GET /api/productos/filtros-opciones
```

## Controller

El controller lee los query params y llama al service.

```js
export async function listarProductos(req, res, next) {
  try {
    const resultado = await obtenerProductos(req.query);

    res.json(successResponse(resultado.data, resultado.pagination));
  } catch (error) {
    next(error);
  }
}
```

Para las opciones de filtros:

```js
export async function listarFiltrosProductos(_req, res, next) {
  try {
    const filtros = await obtenerFiltrosProductos();

    res.json(successResponse(filtros));
  } catch (error) {
    next(error);
  }
}
```

## Service

El service separa filtros y paginacion.

```js
export async function obtenerProductos(query) {
  const filters = getProductFilters(query);
  const pagination = getPagination(query);

  const { productos, total } = await listarProductosFiltrados(
    filters,
    pagination
  );

  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data: productos,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    },
  };
}
```

## Limpieza de filtros

En `src/utils/filters.js` se convierten strings de query params a tipos utiles.

Ejemplos:

```txt
"1" -> 1
"100" -> 100
"true" -> true
"" -> null
```

La estructura final de filtros:

```js
return {
  categoria_id: toNumber(query.categoria_id),
  marca: toTrimmedString(query.marca),
  modelo: toTrimmedString(query.modelo),
  tipo_producto: toTrimmedString(query.tipo_producto),
  condicion: toTrimmedString(query.condicion),
  precio_min: toNumber(query.precio_min),
  precio_max: toNumber(query.precio_max),
  stock: toNumber(query.stock),
  anio: toNumber(query.anio),
  anio_min: toNumber(query.anio_min),
  anio_max: toNumber(query.anio_max),
  disponibilidad: toLowerCaseString(query.disponibilidad),
  destacado: toBoolean(query.destacado),
  search: toTrimmedString(query.search),
};
```

## Paginacion

En `src/utils/pagination.js` se calcula:

```txt
page
limit
offset
```

Reglas:

- `page` minimo es `1`.
- `limit` por defecto es `12`.
- `limit` maximo es `50`.
- `offset` se calcula con `(page - 1) * limit`.

Ejemplo:

```http
GET /api/productos?page=2&limit=12
```

Resultado interno:

```js
{
  page: 2,
  limit: 12,
  offset: 12
}
```

## SQL dinamico

En `src/models/productos.model.js` se construye el `WHERE` con arrays:

```js
const values = [];
const where = ["p.activo = true"];
```

Cada filtro agrega un valor parametrizado y una condicion:

```js
if (filters.marca) {
  values.push(filters.marca);
  where.push(`LOWER(p.marca) = LOWER($${values.length})`);
}
```

Esto evita concatenar valores directos en SQL y mantiene la consulta segura contra inyeccion SQL.

### Rangos

Precio:

```js
if (filters.precio_min !== null) {
  values.push(filters.precio_min);
  where.push(`p.precio >= $${values.length}`);
}

if (filters.precio_max !== null) {
  values.push(filters.precio_max);
  where.push(`p.precio <= $${values.length}`);
}
```

Anio:

```js
if (filters.anio_min !== null) {
  values.push(filters.anio_min);
  where.push(`p.anio >= $${values.length}`);
}

if (filters.anio_max !== null) {
  values.push(filters.anio_max);
  where.push(`p.anio <= $${values.length}`);
}
```

### Stock admin

```js
if (filters.stock !== null) {
  values.push(filters.stock);
  where.push(`p.stock = $${values.length}`);
}
```

Esto permite:

```http
GET /api/productos?stock=0
```

### Disponibilidad

```js
if (filters.disponibilidad) {
  if (filters.disponibilidad === "disponible") {
    where.push("p.stock > 0");
  }

  if (filters.disponibilidad === "proximamente") {
    where.push("p.stock = 0 AND p.proximamente = true");
  }
}
```

### Busqueda

La busqueda usa `ILIKE` para encontrar coincidencias parciales:

```js
if (filters.search) {
  values.push(`%${filters.search}%`);
  where.push(`
    (
      p.nombre ILIKE $${values.length}
      OR p.marca ILIKE $${values.length}
      OR p.modelo ILIKE $${values.length}
      OR p.tipo_producto ILIKE $${values.length}
      OR p.codigo_producto ILIKE $${values.length}
    )
  `);
}
```

## Consulta de conteo y consulta de datos

Primero se cuenta el total:

```sql
SELECT COUNT(*)::int AS total
FROM productos p
WHERE ...
```

Luego se trae la pagina actual:

```sql
SELECT ...
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
WHERE ...
ORDER BY p.destacado DESC, p.creado_en DESC
LIMIT $n
OFFSET $n
```

Se hacen dos consultas para poder devolver:

```json
{
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 40,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Opciones de filtros

La ruta:

```http
GET /api/productos/filtros-opciones
```

consulta valores distintos desde la base de datos para llenar combos:

```sql
SELECT DISTINCT p.marca AS value
FROM productos p
WHERE p.activo = true
  AND p.marca IS NOT NULL
  AND BTRIM(p.marca) <> ''
ORDER BY p.marca ASC
```

La misma idea se aplica para:

- marcas;
- modelos;
- tipos de producto;
- condiciones;
- anios;
- rango de precios;
- disponibilidad.

## Formato de respuesta

El helper `successResponse` mantiene una respuesta estandar:

```js
successResponse(data, pagination);
```

Respuesta de listado:

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

Respuesta de opciones:

```json
{
  "ok": true,
  "data": {
    "categorias": [],
    "marcas": [],
    "modelos": [],
    "tipos_producto": [],
    "condiciones": [],
    "anios": [],
    "precios": {
      "precio_min": "100.00",
      "precio_max": "800.00"
    },
    "disponibilidad": ["disponible", "proximamente"]
  },
  "pagination": null
}
```

## Como replicarlo en otra API

1. Define una ruta base para el recurso:

```js
app.use("/api/productos", productosRoutes);
```

2. Crea una ruta `GET /` para listar:

```js
router.get("/", listarProductos);
```

3. En el controller, envia `req.query` al service:

```js
const resultado = await obtenerProductos(req.query);
```

4. En el service, separa filtros y paginacion:

```js
const filters = getProductFilters(query);
const pagination = getPagination(query);
```

5. En el model, crea:

```js
const values = [];
const where = ["p.activo = true"];
```

6. Agrega cada filtro con parametros SQL:

```js
values.push(filters.marca);
where.push(`LOWER(p.marca) = LOWER($${values.length})`);
```

7. Ejecuta una consulta para contar y otra para listar.

8. Devuelve siempre:

```txt
data
pagination
```

## Checklist para agregar un nuevo filtro

1. Agregar el campo en `src/utils/filters.js`.
2. Convertirlo al tipo correcto: numero, booleano o texto.
3. Agregar la condicion SQL en `src/models/productos.model.js`.
4. Si el frontend necesita combo, agregarlo en `obtenerOpcionesFiltrosProductos`.
5. Documentar el query param en `FILTRACION_Y_PAGINACION_PRODUCTOS.md`.
6. Probar con una URL real en el navegador o Postman.

## Notas de produccion

Los `console.log` actuales ayudan durante desarrollo:

```txt
[productos] Request recibida
[productos] Filtros construidos
[productos] Paginacion usada
```

Antes de produccion se pueden quitar o reemplazar por un logger controlado por entorno.

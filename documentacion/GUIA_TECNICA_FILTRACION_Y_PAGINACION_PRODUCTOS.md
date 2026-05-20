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

Para una barra de busqueda en vivo o autocomplete se usa la misma ruta, pero con un limite pequeno:

```http
GET /api/productos?search=te&page=1&limit=4
```

Ese ejemplo significa: buscar productos activos que coincidan parcialmente con `te`, traer la pagina `1` y devolver maximo `4` productos.

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

## Flujo real por archivo

Esta es la cadena completa, de arriba hacia abajo:

```txt
src/server.js
  -> carga .env y arranca Express
src/app.js
  -> monta /api/productos
src/routes/productos.routes.js
  -> llama a listarProductos()
src/controllers/productos.controller.js
  -> llama a obtenerProductos(req.query)
src/services/productos.service.js
  -> llama a getProductFilters(query)
  -> llama a getPagination(query)
  -> llama a listarProductosFiltrados(filters, pagination)
src/models/productos.model.js
  -> usa pool desde src/config/db.js
  -> ejecuta SQL real en PostgreSQL
```

Resumen corto de dependencias:

- `productos.routes.js` depende de `productos.controller.js`.
- `productos.controller.js` depende de `productos.service.js`.
- `productos.service.js` depende de `utils/filters.js`, `utils/pagination.js` y `productos.model.js`.
- `productos.model.js` depende de `config/db.js`.
- `config/db.js` depende del `.env`.

Si quieres seguir la funcionalidad sin perderte, lee en este orden:

1. `src/routes/productos.routes.js`
2. `src/controllers/productos.controller.js`
3. `src/services/productos.service.js`
4. `src/utils/filters.js`
5. `src/utils/pagination.js`
6. `src/models/productos.model.js`

## Ejemplo simple: busqueda por letra

Supongamos que el usuario escribe `te` en la barra de busqueda del frontend.

El frontend deberia esperar un pequeno debounce, por ejemplo 300 ms, y luego llamar:

```http
GET /api/productos?search=te&page=1&limit=4
```

Asi viaja ese dato dentro de la API:

```txt
URL del navegador o fetch
  search=te
  page=1
  limit=4

src/routes/productos.routes.js
  GET "/" coincide con /api/productos
  llama a listarProductos

src/controllers/productos.controller.js
  recibe req.query
  req.query = { search: "te", page: "1", limit: "4" }
  llama a obtenerProductos(req.query)

src/services/productos.service.js
  getProductFilters(query) convierte search
  getPagination(query) convierte page y limit

src/utils/filters.js
  search: "te"

src/utils/pagination.js
  page: 1
  limit: 4
  offset: 0

src/models/productos.model.js
  arma WHERE con ILIKE '%te%'
  arma LIMIT 4
  arma OFFSET 0
  consulta PostgreSQL
```

Resultado esperado:

```json
{
  "ok": true,
  "data": [
    {
      "nombre": "Faro delantero Toyota",
      "slug": "faro-delantero-toyota",
      "marca": "Toyota",
      "modelo": "Corolla",
      "precio": "280.00",
      "imagen_principal": "https://ejemplo.com/faro.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 4,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

Importante: la API no sabe si el resultado se usara para catalogo o para sugerencias. El frontend decide eso con `limit`. Para sugerencias puede mandar `limit=4`; para catalogo puede mandar `limit=12`.

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

Ruta final para busqueda por letra o autocomplete:

```http
GET /api/productos?search=te&page=1&limit=4
```

No es una ruta nueva en Express. Es la misma ruta `GET /api/productos`, solo que recibe query params. Esto mantiene la API simple y evita duplicar logica.

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

Con `search=te`, el parametro real que llega a PostgreSQL queda parecido a:

```txt
%te%
```

Eso permite encontrar coincidencias aunque las letras esten dentro del texto:

```txt
Toyota
Faro delantero
Alternador
codigo TE-123
```

Campos donde busca actualmente:

- `p.nombre`
- `p.marca`
- `p.modelo`
- `p.tipo_producto`
- `p.codigo_producto`

No busca en `descripcion` actualmente. Para autocomplete eso puede ser positivo porque evita resultados demasiado amplios.

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

## Recomendaciones para autocomplete

- Usar debounce de 300 ms o 400 ms en el frontend.
- Consultar desde 2 caracteres para reducir trabajo del servidor.
- Usar `page=1`.
- Usar `limit=4` o `limit=5` para sugerencias.
- No traer todos los productos al frontend para filtrarlos ahi.
- Mostrar `imagen_principal` solo como miniatura pequena.
- Si el servidor o almacenamiento es gratuito, comprimir imagenes o usar thumbnails para no gastar ancho de banda innecesario.
- Cuando el usuario presiona "Ver mas resultados", navegar al catalogo con el mismo search, por ejemplo `/productos?search=te`.

Ejemplo de comportamiento:

```txt
Input vacio -> no consulta
t           -> opcionalmente no consulta
te          -> GET /api/productos?search=te&page=1&limit=4
toy         -> GET /api/productos?search=toy&page=1&limit=4
Ver mas     -> /productos?search=toy
```

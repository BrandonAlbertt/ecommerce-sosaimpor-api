# Guia de filtracion y paginacion de productos

Esta guia explica como funciona el listado de productos con filtros, busqueda y paginacion en la API `ecommerce-sosaimpor-api`.

La idea principal es simple: todos los filtros de productos usan una sola ruta `GET /api/productos`, y cada filtro se envia como query param.

```http
GET /api/productos?page=1&limit=12&marca=Toyota&search=faro
```

Esta estructura es facil de replicar en otro proyecto porque separa responsabilidades por capas:

```txt
routes -> controller -> service -> model -> database
```

## Objetivo

El endpoint de productos permite:

- cargar productos activos;
- mostrar destacados en el home;
- buscar por texto libre;
- filtrar por categoria, marca, modelo, tipo, condicion, anio y precio;
- combinar varios filtros al mismo tiempo;
- paginar resultados para no enviar todos los productos de golpe;
- devolver una respuesta estandar para que el frontend consuma facil.

## Base de datos esperada

La tabla principal es `productos`.

Campos usados por el filtrado:

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
productos.destacado
productos.activo
productos.creado_en
```

Tablas relacionadas usadas por el listado:

```sql
categorias
producto_imagenes
```

La categoria se filtra por ID porque existe esta relacion:

```sql
productos.categoria_id REFERENCES categorias(id)
```

En cambio `marca`, `modelo`, `tipo_producto` y `condicion` se filtran por texto controlado, porque en la base actual son columnas `VARCHAR` dentro de `productos`.

## Regla de filtros segun esta base

| Campo del frontend | Query param | Tipo | Como se usa |
| --- | --- | --- | --- |
| Barra de busqueda | `search` | Texto libre | Busca con `ILIKE` |
| Categoria | `categoria_id` | Numero / ID | Filtra por `productos.categoria_id` |
| Marca | `marca` | Texto controlado | Filtra por marca exacta ignorando mayusculas |
| Modelo | `modelo` | Texto controlado | Filtra por modelo exacto ignorando mayusculas |
| Tipo de producto | `tipo_producto` | Texto controlado | Filtra por tipo exacto ignorando mayusculas |
| Condicion | `condicion` | Texto controlado | Filtra por condicion exacta |
| Anio exacto | `anio` | Numero | Filtra por un anio especifico |
| Anio minimo | `anio_min` | Numero | Filtra desde un anio |
| Anio maximo | `anio_max` | Numero | Filtra hasta un anio |
| Precio minimo | `precio_min` | Numero | Filtra desde un precio |
| Precio maximo | `precio_max` | Numero | Filtra hasta un precio |
| Destacado | `destacado` | Booleano | Filtra destacados con `true` |
| Pagina | `page` | Numero | Pagina actual |
| Limite | `limit` | Numero | Cantidad por pagina |

La barra de busqueda es el unico campo que el cliente escribe libremente. Los demas filtros deben venir de combo boxes, selects, sliders o inputs controlados.

## Respuesta estandar

El frontend siempre recibe una respuesta con esta forma:

```json
{
  "ok": true,
  "data": [],
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

Cuando se piden opciones para combo boxes, la respuesta usa el mismo formato, pero `pagination` puede venir como `null`.

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
    }
  },
  "pagination": null
}
```

## Flujo de archivos

### 1. app.js

Registra el router de productos.

```js
app.use("/api/productos", productosRoutes);
```

Todo lo que empiece con `/api/productos` entra al modulo de productos.

### 2. routes/productos.routes.js

Define las rutas del modulo.

```js
router.get("/filtros-opciones", listarFiltrosProductos);
router.get("/", listarProductos);
```

Rutas resultantes:

```http
GET /api/productos
GET /api/productos/filtros-opciones
```

### 3. controllers/productos.controller.js

Recibe la request de Express.

Responsabilidades:

- leer `req.query`;
- llamar al service;
- responder con JSON estandar;
- enviar errores al middleware.

Ejemplo del flujo:

```js
const resultado = await obtenerProductos(req.query);
res.json(successResponse(resultado.data, resultado.pagination));
```

### 4. services/productos.service.js

Contiene la logica de aplicacion.

Responsabilidades:

- convertir query params en filtros limpios;
- calcular paginacion;
- llamar al model;
- calcular metadata de paginacion.

Ejemplo:

```js
const filters = getProductFilters(query);
const pagination = getPagination(query);
const { productos, total } = await listarProductosFiltrados(filters, pagination);
```

### 5. models/productos.model.js

Construye el SQL y consulta PostgreSQL.

Siempre filtra productos activos:

```sql
p.activo = true
```

Tambien:

- une `categorias` para devolver `categoria_nombre`;
- consulta `producto_imagenes` para devolver `imagen_principal`;
- ordena por destacados y fecha de creacion;
- usa `LIMIT` y `OFFSET`.

Orden:

```sql
ORDER BY p.destacado DESC, p.creado_en DESC
```

Paginacion:

```sql
LIMIT $n
OFFSET $n
```

### 6. utils/filters.js

Convierte los query params a tipos correctos.

Ejemplos:

```txt
"1" -> 1
"100" -> 100
"true" -> true
"" -> null
```

Tambien ignora filtros vacios o invalidos.

### 7. utils/pagination.js

Calcula la paginacion.

Reglas:

- `page` minimo es `1`;
- `limit` por defecto es `12`;
- `limit` maximo es `50`;
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

### 8. utils/response.js

Centraliza el formato de respuesta exitosa.

```js
successResponse(data, pagination);
```

### 9. middlewares/error.middleware.js

Centraliza errores.

Ruta inexistente:

```json
{
  "ok": false,
  "message": "Ruta no encontrada: GET /ruta"
}
```

Error interno:

```json
{
  "ok": false,
  "message": "Error interno del servidor"
}
```

## Como replicarlo en otro proyecto

1. Crea una ruta base para el recurso.

```js
app.use("/api/productos", productosRoutes);
```

2. Define una ruta `GET /`.

```js
router.get("/", listarProductos);
```

3. En el controller, lee `req.query`.

```js
const resultado = await obtenerProductos(req.query);
```

4. En el service, separa filtros y paginacion.

```js
const filters = getProductFilters(query);
const pagination = getPagination(query);
```

5. En el model, arma el `WHERE` dinamicamente usando parametros SQL.

```js
values.push(filters.marca);
where.push(`LOWER(p.marca) = LOWER($${values.length})`);
```

6. Ejecuta dos consultas:

- una para contar el total;
- otra para traer la pagina actual.

7. Devuelve siempre `data` y `pagination`.

## Campos que debe tener el frontend

### Barra de busqueda

Campo de texto libre.

Envia:

```txt
search
```

Ejemplo:

```http
GET /api/productos?search=faro&page=1&limit=12
```

### Categoria

Combo box cargado desde:

```http
GET /api/productos/filtros-opciones
```

Envia el ID:

```txt
categoria_id
```

Ejemplo:

```http
GET /api/productos?categoria_id=1&page=1&limit=12
```

### Marca

Combo box con valores controlados desde la API.

Envia:

```txt
marca
```

Ejemplo:

```http
GET /api/productos?marca=Toyota&page=1&limit=12
```

### Modelo

Combo box con valores controlados desde la API.

Envia:

```txt
modelo
```

Ejemplo:

```http
GET /api/productos?modelo=Hilux&page=1&limit=12
```

### Tipo de producto

Combo box con valores controlados desde la API.

Envia:

```txt
tipo_producto
```

Ejemplo:

```http
GET /api/productos?tipo_producto=Faro&page=1&limit=12
```

### Condicion

Combo box con valores controlados desde la API.

Envia:

```txt
condicion
```

Ejemplo:

```http
GET /api/productos?condicion=nuevo&page=1&limit=12
```

### Anio

Puede ser selector exacto o rango.

Anio exacto:

```txt
anio
```

Rango:

```txt
anio_min
anio_max
```

Ejemplos:

```http
GET /api/productos?anio=2020&page=1&limit=12
GET /api/productos?anio_min=2018&anio_max=2024&page=1&limit=12
```

### Precio

Inputs numericos o slider de rango.

Envia:

```txt
precio_min
precio_max
```

Ejemplo:

```http
GET /api/productos?precio_min=100&precio_max=800&page=1&limit=12
```

### Destacados

Usado para home o secciones destacadas.

Envia:

```txt
destacado
```

Ejemplo:

```http
GET /api/productos?destacado=true&page=1&limit=8
```

### Paginacion

Debe enviarse junto con cualquier filtro.

Envia:

```txt
page
limit
```

Ejemplo:

```http
GET /api/productos?page=1&limit=12
```

## Rutas y casos de uso

En los ejemplos se usa:

```txt
http://localhost:3003
```

Si el proyecto usa otro puerto, cambia `3003` por el valor real de `PORT`.

### Productos generales (GET)

Carga productos activos normales paginados.

```http
GET http://localhost:3003/api/productos
```

### Productos paginados (GET)

Carga productos por paginas para no enviar todos de golpe.

```http
GET http://localhost:3003/api/productos?page=1&limit=12
```

### Productos destacados del home (GET)

Carga solo productos destacados para el inicio.

```http
GET http://localhost:3003/api/productos?destacado=true&page=1&limit=8
```

### Filtrar por categoria usando ID (GET)

Muestra productos de una categoria especifica.

```http
GET http://localhost:3003/api/productos?categoria_id=1&page=1&limit=12
```

### Filtrar por marca (GET)

Muestra productos de una marca especifica.

```http
GET http://localhost:3003/api/productos?marca=Toyota&page=1&limit=12
```

### Filtrar por modelo (GET)

Muestra productos compatibles con un modelo especifico.

```http
GET http://localhost:3003/api/productos?modelo=Hilux&page=1&limit=12
```

### Filtrar por tipo de producto (GET)

Muestra productos como faros, espejos, parachoques, etc.

```http
GET http://localhost:3003/api/productos?tipo_producto=Faro&page=1&limit=12
```

### Filtrar por condicion (GET)

Muestra productos nuevos o usados importados.

```http
GET http://localhost:3003/api/productos?condicion=nuevo&page=1&limit=12
```

### Filtrar por anio exacto (GET)

Muestra productos compatibles con cierto anio.

```http
GET http://localhost:3003/api/productos?anio=2020&page=1&limit=12
```

### Filtrar por rango de anios (GET)

Muestra productos compatibles dentro de un rango de anios.

```http
GET http://localhost:3003/api/productos?anio_min=2018&anio_max=2024&page=1&limit=12
```

### Filtrar por rango de precio (GET)

Muestra productos dentro de un rango de precio.

```http
GET http://localhost:3003/api/productos?precio_min=100&precio_max=800&page=1&limit=12
```

### Barra de busqueda general (GET)

Busca por nombre, marca, modelo, tipo o codigo.

```http
GET http://localhost:3003/api/productos?search=faro&page=1&limit=12
```

### Buscar por marca usando barra de busqueda (GET)

Busca cualquier producto relacionado a Toyota.

```http
GET http://localhost:3003/api/productos?search=Toyota&page=1&limit=12
```

### Buscar por modelo usando barra de busqueda (GET)

Busca cualquier producto relacionado a Hilux.

```http
GET http://localhost:3003/api/productos?search=Hilux&page=1&limit=12
```

### Categoria + marca (GET)

Filtra productos por categoria y marca juntas.

```http
GET http://localhost:3003/api/productos?categoria_id=1&marca=Toyota&page=1&limit=12
```

### Categoria + marca + modelo (GET)

Filtra productos especificos por categoria, marca y modelo.

```http
GET http://localhost:3003/api/productos?categoria_id=1&marca=Toyota&modelo=Hilux&page=1&limit=12
```

### Barra de busqueda + marca (GET)

Busca una palabra dentro de una marca especifica.

```http
GET http://localhost:3003/api/productos?search=faro&marca=Toyota&page=1&limit=12
```

### Filtro avanzado completo (GET)

Usa varios filtros al mismo tiempo.

```http
GET http://localhost:3003/api/productos?categoria_id=1&marca=Toyota&modelo=Hilux&tipo_producto=Faro&precio_min=100&precio_max=800&anio_min=2018&anio_max=2024&page=1&limit=12
```

### Opciones para combo boxes (GET)

Devuelve categorias, marcas, modelos, tipos, condiciones, anios y rangos para llenar filtros del frontend.

```http
GET http://localhost:3003/api/productos/filtros-opciones
```

## Notas para produccion

Los `console.log` de productos son temporales y sirven para depurar durante desarrollo:

```txt
[productos] Request recibida
[productos] Filtros construidos
[productos] Paginacion usada
```

Antes de produccion se pueden quitar o reemplazar por un logger controlado por entorno.


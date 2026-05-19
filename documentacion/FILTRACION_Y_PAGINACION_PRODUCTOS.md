# Filtracion y paginacion de productos

Este documento explica como funciona el flujo de productos en la API `ecommerce-sosaimpor-api`, desde que llega una request HTTP hasta que se consulta la base de datos y se devuelve una respuesta lista para el frontend.

## Ruta principal

Todos los filtros de productos usan la misma ruta base:

```http
GET /api/productos
```

Los filtros, la busqueda y la paginacion se envian como query params:

```http
GET /api/productos?page=1&limit=12&marca=Toyota&search=faro
```

No existe una ruta separada para filtros. Los filtros pertenecen al modulo de productos.

## Flujo por capas

La arquitectura sigue este orden:

```txt
routes -> controller -> service -> model -> database
```

## Archivos que participan

### src/app.js

Registra las rutas principales de la API.

Para productos usa:

```js
app.use("/api/productos", productosRoutes);
```

Eso significa que cualquier request que empiece con `/api/productos` sera enviada al router de productos.

### src/routes/productos.routes.js

Define las rutas propias del modulo productos.

La ruta principal es:

```js
router.get("/", listarProductos);
```

Como `app.js` ya monto el router en `/api/productos`, esta ruta responde a:

```http
GET /api/productos
```

### src/controllers/productos.controller.js

Recibe la request de Express.

Sus responsabilidades son:

- leer `req.query`;
- enviar los query params al service;
- devolver una respuesta JSON estandar;
- pasar errores al middleware de errores.

Tambien deja logs temporales utiles:

```txt
[productos] Request recibida
```

### src/services/productos.service.js

Contiene la logica de aplicacion.

Sus responsabilidades son:

- construir los filtros usando `getProductFilters`;
- construir la paginacion usando `getPagination`;
- llamar al modelo `listarProductosFiltrados`;
- calcular `totalPages`, `hasNextPage` y `hasPrevPage`;
- devolver `data` y `pagination`.

Tambien deja logs temporales:

```txt
[productos] Filtros construidos
[productos] Paginacion usada
```

### src/models/productos.model.js

Construye y ejecuta el SQL contra PostgreSQL.

Siempre filtra solo productos activos:

```sql
p.activo = true
```

Permite filtrar por:

- `categoria_id`
- `marca`
- `modelo`
- `tipo_producto`
- `condicion`
- `precio_min`
- `precio_max`
- `anio`
- `destacado`
- `search`

La busqueda `search` usa `ILIKE` sobre:

- `p.nombre`
- `p.marca`
- `p.modelo`
- `p.tipo_producto`
- `p.codigo_producto`

Tambien devuelve:

- `categoria_nombre` desde la tabla `categorias`;
- `imagen_principal` desde la tabla `producto_imagenes`.

Ordena los productos asi:

```sql
ORDER BY p.destacado DESC, p.creado_en DESC
```

Y aplica paginacion con:

```sql
LIMIT
OFFSET
```

### src/utils/filters.js

Convierte los query params recibidos desde la URL a filtros limpios para el modelo.

Hace estas tareas:

- convierte numeros con `Number`;
- convierte `destacado=true` a booleano `true`;
- convierte `destacado=false` a booleano `false`;
- si `destacado` no viene, deja `null` para no filtrar por destacado;
- elimina strings vacios;
- ignora filtros invalidos.

Ejemplo:

```http
GET /api/productos?marca=Toyota&precio_min=100&destacado=true
```

Se convierte en algo parecido a:

```js
{
  marca: "Toyota",
  precio_min: 100,
  destacado: true
}
```

### src/utils/pagination.js

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

Resultado:

```js
{
  page: 2,
  limit: 12,
  offset: 12
}
```

### src/utils/response.js

Estandariza la respuesta para el frontend.

La respuesta correcta tiene esta forma:

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

### src/middlewares/error.middleware.js

Maneja errores de forma centralizada.

Si la ruta no existe, responde:

```json
{
  "ok": false,
  "message": "Ruta no encontrada: GET /ruta"
}
```

Si ocurre un error interno, responde:

```json
{
  "ok": false,
  "message": "Error interno del servidor"
}
```

### src/config/db.js

Configura el pool de PostgreSQL usando variables de entorno.

Lee el archivo `.env` desde la raiz del proyecto y usa:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### src/server.js

Es el punto de arranque de la API.

Carga el `.env`, importa `app.js` y levanta el servidor con:

```js
app.listen(port);
```

El puerto viene de:

```env
PORT=3003
```

## Casos de uso y rutas

En los ejemplos se usa:

```txt
http://localhost:3003
```

Si tu `.env` usa otro puerto, cambia `3003` por el valor de `PORT`.

## 1. Cuando el cliente entra por primera vez al home

El frontend debe cargar productos destacados activos.

Ruta:

```http
GET http://localhost:3003/api/productos?destacado=true&page=1&limit=8
```

Uso:

- home principal;
- seccion de productos destacados;
- primera carga de la pagina.

## 2. Cuando el cliente entra al catalogo general

El frontend carga productos activos sin filtro especial.

Ruta:

```http
GET http://localhost:3003/api/productos?page=1&limit=12
```

Uso:

- pagina de catalogo;
- listado general de productos;
- cuando no se selecciono ningun filtro.

## 3. Cuando el cliente pasa a la siguiente pagina

Ruta:

```http
GET http://localhost:3003/api/productos?page=2&limit=12
```

Uso:

- boton siguiente;
- paginacion del catalogo;
- cargar mas productos sin enviar todos de golpe.

## 4. Cuando el cliente busca una palabra en la barra de busqueda

Ejemplo buscando `faro`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&search=faro
```

Uso:

- barra de busqueda;
- busqueda por nombre;
- busqueda por marca;
- busqueda por modelo;
- busqueda por tipo de producto;
- busqueda por codigo de producto.

## 5. Cuando el cliente filtra por categoria

Ejemplo categoria con id `1`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&categoria_id=1
```

Uso:

- menu de categorias;
- filtro lateral por categoria;
- seccion de productos de una categoria.

## 6. Cuando el cliente filtra por marca

Ejemplo marca `Toyota`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&marca=Toyota
```

Uso:

- selector de marca;
- filtros laterales;
- catalogo por fabricante.

## 7. Cuando el cliente filtra por modelo

Ejemplo modelo `Hilux`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&modelo=Hilux
```

Uso:

- filtro de modelo;
- busqueda de repuestos compatibles con un modelo especifico.

## 8. Cuando el cliente filtra por tipo de producto

Ejemplo tipo `faro`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&tipo_producto=faro
```

Uso:

- filtro por tipo de repuesto;
- separar faros, parachoques, espejos, accesorios, etc.

## 9. Cuando el cliente filtra por condicion

Ejemplo condicion `nuevo`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&condicion=nuevo
```

Uso:

- filtro por productos nuevos;
- filtro por productos usados;
- filtro por condicion comercial.

## 10. Cuando el cliente filtra por rango de precio

Ejemplo productos entre `100` y `800`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&precio_min=100&precio_max=800
```

Uso:

- slider de precio;
- minimo y maximo;
- filtros por presupuesto.

## 11. Cuando el cliente filtra solo por precio minimo

Ejemplo productos desde `100`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&precio_min=100
```

Uso:

- mostrar productos desde cierto precio.

## 12. Cuando el cliente filtra solo por precio maximo

Ejemplo productos hasta `800`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&precio_max=800
```

Uso:

- mostrar productos dentro de un presupuesto maximo.

## 13. Cuando el cliente filtra por anio

Ejemplo anio `2020`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&anio=2020
```

Uso:

- repuestos compatibles con un anio especifico.

## 14. Cuando el cliente filtra solo destacados

Ruta:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&destacado=true
```

Uso:

- seccion de destacados;
- carrusel de productos destacados;
- landing o home.

## 15. Cuando el cliente combina busqueda con marca

Ejemplo buscar `faro` dentro de marca `Toyota`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&search=faro&marca=Toyota
```

Uso:

- el cliente escribe una palabra y ademas selecciona marca.

## 16. Cuando el cliente combina categoria y marca

Ejemplo categoria `1` y marca `Toyota`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&categoria_id=1&marca=Toyota
```

Uso:

- productos de una categoria especifica y una marca especifica.

## 17. Cuando el cliente combina categoria, marca y busqueda

Ejemplo:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&categoria_id=1&marca=Toyota&search=faro
```

Uso:

- el cliente esta dentro de una categoria;
- selecciona una marca;
- escribe una palabra en la barra de busqueda.

## 18. Cuando el cliente rellena todos los campos de filtro

Ejemplo completo:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&categoria_id=1&marca=Toyota&modelo=Hilux&tipo_producto=faro&condicion=nuevo&precio_min=100&precio_max=800&anio=2020&destacado=true&search=faro
```

Uso:

- busqueda avanzada;
- formulario completo de filtros;
- el cliente quiere resultados muy especificos.

## 19. Cuando el cliente limpia todos los filtros

El frontend debe volver a llamar la ruta base paginada:

```http
GET http://localhost:3003/api/productos?page=1&limit=12
```

Uso:

- boton limpiar filtros;
- resetear catalogo;
- volver al listado general.

## 20. Cuando el cliente cambia el limite de productos por pagina

Ejemplo mostrar `24` productos:

```http
GET http://localhost:3003/api/productos?page=1&limit=24
```

Uso:

- selector de cantidad por pagina;
- vistas de catalogo mas densas.

El limite maximo permitido por la API es `50`.


# Rutas admin de productos

Esta guia es para consumir la API de administracion de productos.

La ruta base del admin es:

```http
GET /api/admin/productos
```

Ejemplo con host local:

```http
GET http://localhost:3003/api/admin/productos
```

El admin usa rutas separadas para no romper la API publica:

```http
GET /api/productos
```

La ruta publica muestra solo productos activos. La ruta admin puede mostrar productos activos e inactivos.

> Importante: estas rutas admin todavia no tienen autenticacion. Mas adelante deben protegerse con `authMiddleware` y rol admin.

## Respuesta del listado

```json
{
  "ok": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 40,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Campos devueltos por admin

`GET /api/admin/productos` y `GET /api/admin/productos/:id` devuelven campos completos:

```txt
id
categoria_id
categoria_nombre
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
visitas
consultas
activo
creado_en
imagen_principal
```

`imagen_principal` viene de la tabla `producto_imagenes`. La API admin de productos solo devuelve la imagen principal como referencia rapida para el listado y el detalle.

Campos esperados en `producto_imagenes`:

```txt
id
producto_id
imagen_url
principal
orden
```

> Nota: el CRUD especifico para administrar imagenes todavia debe implementarse en rutas separadas. Esta guia documenta la ruta admin de productos actual.

## Parametros soportados

| Campo | Query param | Ejemplo |
| --- | --- | --- |
| Pagina | `page` | `page=1` |
| Limite | `limit` | `limit=20` |
| Busqueda | `search` | `search=faro` |
| Categoria | `categoria_id` | `categoria_id=1` |
| Marca | `marca` | `marca=Toyota` |
| Modelo | `modelo` | `modelo=Hilux` |
| Tipo de producto | `tipo_producto` | `tipo_producto=faro` |
| Condicion | `condicion` | `condicion=nuevo` |
| Anio exacto | `anio` | `anio=2020` |
| Anio minimo | `anio_min` | `anio_min=2018` |
| Anio maximo | `anio_max` | `anio_max=2024` |
| Precio minimo | `precio_min` | `precio_min=100` |
| Precio maximo | `precio_max` | `precio_max=800` |
| Disponibilidad | `disponibilidad` | `disponibilidad=disponible` |
| Stock exacto | `stock` | `stock=0` |
| Destacado | `destacado` | `destacado=true` |
| Activo | `activo` | `activo=false` |

## Regla de activo

Si no se envia `activo`, el admin lista todos:

```http
GET /api/admin/productos?page=1&limit=20
```

Solo activos:

```http
GET /api/admin/productos?activo=true&page=1&limit=20
```

Solo inactivos:

```http
GET /api/admin/productos?activo=false&page=1&limit=20
```

## Rutas principales

### Listar productos admin

```http
GET /api/admin/productos?page=1&limit=20
```

### Listar producto por id

```http
GET /api/admin/productos/1
```

### Crear producto

```http
POST /api/admin/productos
Content-Type: application/json
```

Body:

```json
{
  "categoria_id": 1,
  "nombre": "Faro delantero Toyota Hilux",
  "slug": "faro-delantero-toyota-hilux",
  "descripcion": "Faro delantero usado importado",
  "tipo_producto": "Faro",
  "marca": "Toyota",
  "modelo": "Hilux",
  "anio": 2021,
  "codigo_producto": "TY-HLX-F001",
  "condicion": "usado_importado",
  "precio": 280,
  "stock": 2,
  "proximamente": false,
  "destacado": false,
  "orden_destacado": 0,
  "activo": true
}
```

Campos obligatorios al crear:

```txt
nombre
slug
precio
```

Validaciones basicas:

```txt
precio >= 0
stock >= 0
categoria_id debe existir si se envia
```

### Editar producto

```http
PUT /api/admin/productos/1
Content-Type: application/json
```

Body parcial o completo:

```json
{
  "nombre": "Faro delantero Toyota Hilux actualizado",
  "precio": 300,
  "stock": 4,
  "destacado": true
}
```

Validaciones basicas al editar:

```txt
el producto debe existir
precio >= 0 si se envia
stock >= 0 si se envia
categoria_id debe existir si se envia
```

### Desactivar producto

No borra fisicamente el producto. Hace eliminacion logica:

```http
PATCH /api/admin/productos/1/desactivar
```

Internamente:

```sql
UPDATE productos SET activo = false WHERE id = $1
```

### Activar producto

```http
PATCH /api/admin/productos/1/activar
```

Internamente:

```sql
UPDATE productos SET activo = true WHERE id = $1
```

## Ejemplos de filtros admin

### Buscar por texto

```http
GET /api/admin/productos?search=faro&page=1&limit=20
```

Busca con coincidencia parcial en:

```txt
nombre
marca
modelo
tipo_producto
codigo_producto
```

### Buscar por letra para admin

```http
GET /api/admin/productos?search=te&page=1&limit=5
```

Sirve si el panel admin tambien quiere una barra de busqueda rapida.

### Filtrar por marca

```http
GET /api/admin/productos?marca=Toyota&page=1&limit=20
```

### Filtrar por modelo

```http
GET /api/admin/productos?modelo=Hilux&page=1&limit=20
```

### Filtrar por categoria

```http
GET /api/admin/productos?categoria_id=1&page=1&limit=20
```

### Filtrar por tipo de producto

```http
GET /api/admin/productos?tipo_producto=Faro&page=1&limit=20
```

### Filtrar por condicion

```http
GET /api/admin/productos?condicion=usado_importado&page=1&limit=20
```

### Filtrar por stock exacto

```http
GET /api/admin/productos?stock=0&page=1&limit=20
```

Esto sirve para ver productos agotados.

### Filtrar destacados

```http
GET /api/admin/productos?destacado=true&page=1&limit=20
```

### Filtrar no destacados

```http
GET /api/admin/productos?destacado=false&page=1&limit=20
```

### Filtrar por disponibilidad

Disponibles:

```http
GET /api/admin/productos?disponibilidad=disponible&page=1&limit=20
```

Proximamente:

```http
GET /api/admin/productos?disponibilidad=proximamente&page=1&limit=20
```

Reglas:

```txt
disponible = stock > 0
proximamente = stock = 0 AND proximamente = true
```

### Filtrar por anio exacto

```http
GET /api/admin/productos?anio=2021&page=1&limit=20
```

### Filtrar por rango de anios

```http
GET /api/admin/productos?anio_min=2018&anio_max=2024&page=1&limit=20
```

### Filtrar por rango de precios

```http
GET /api/admin/productos?precio_min=100&precio_max=800&page=1&limit=20
```

## Filtros combinados

### Busqueda + activo

```http
GET /api/admin/productos?search=faro&activo=true&page=1&limit=20
```

### Marca + modelo + activo

```http
GET /api/admin/productos?marca=Toyota&modelo=Hilux&activo=true&page=1&limit=20
```

### Productos inactivos agotados

```http
GET /api/admin/productos?activo=false&stock=0&page=1&limit=20
```

### Productos destacados disponibles

```http
GET /api/admin/productos?destacado=true&disponibilidad=disponible&page=1&limit=20
```

### Filtro completo de admin

```http
GET /api/admin/productos?page=1&limit=20&search=faro&categoria_id=1&marca=Toyota&modelo=Hilux&tipo_producto=Faro&condicion=usado_importado&precio_min=100&precio_max=800&anio_min=2018&anio_max=2024&destacado=true&disponibilidad=disponible&activo=true
```

## Diferencia con la ruta publica

Ruta publica:

```http
GET /api/productos
```

Caracteristicas:

```txt
solo productos activos
campos pensados para frontend publico
no permite crear, editar, activar ni desactivar
```

Ruta admin:

```http
GET /api/admin/productos
```

Caracteristicas:

```txt
productos activos e inactivos
campos completos
permite crear, editar, activar y desactivar
```

## Flujo recomendado en el panel admin

1. Listar productos:

```http
GET /api/admin/productos?page=1&limit=20
```

2. Buscar o filtrar:

```http
GET /api/admin/productos?search=faro&activo=true&page=1&limit=20
```

3. Abrir detalle:

```http
GET /api/admin/productos/1
```

4. Editar:

```http
PUT /api/admin/productos/1
```

5. Desactivar si ya no debe aparecer al publico:

```http
PATCH /api/admin/productos/1/desactivar
```

6. Activar si debe volver al catalogo:

```http
PATCH /api/admin/productos/1/activar
```

## Pendiente: administracion de imagenes

Para administrar imagenes de producto de forma profesional, conviene agregar rutas separadas mas adelante:

```http
GET    /api/admin/productos/:id/imagenes
POST   /api/admin/productos/:id/imagenes
PUT    /api/admin/productos/:id/imagenes/:imagenId
PATCH  /api/admin/productos/:id/imagenes/:imagenId/principal
DELETE /api/admin/productos/:id/imagenes/:imagenId
```

Uso recomendado:

```txt
GET    -> listar imagenes del producto
POST   -> agregar una imagen
PUT    -> editar url, orden o principal
PATCH  -> marcar una imagen como principal
DELETE -> eliminar una imagen
```

Regla importante para imagen principal:

```txt
Solo una imagen por producto deberia tener principal = true.
```

Cuando se marque una nueva imagen como principal, el backend deberia hacer:

```sql
UPDATE producto_imagenes
SET principal = false
WHERE producto_id = $1;

UPDATE producto_imagenes
SET principal = true
WHERE id = $2 AND producto_id = $1;
```

Mientras esas rutas no existan, el admin de productos solo puede mostrar `imagen_principal`, pero no crear, editar ni ordenar imagenes desde `/api/admin/productos`.

# Rutas de filtracion y paginacion de productos

Esta guia es para consumir la API desde el frontend publico o desde el admin.

La ruta principal para listar productos es:

```http
GET http://localhost:3003/api/productos
```

Todos los filtros se envian como query params sobre esa misma ruta.

```http
GET http://localhost:3003/api/productos?page=1&limit=12&marca=Toyota&search=faro
```

Si el proyecto usa otro puerto, cambia `3003` por el valor real de `PORT`.

## Respuesta del listado

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

## Opciones para combo boxes

Ruta para llenar combos/selects del frontend:

```http
GET /api/productos/filtros-opciones
GET http://localhost:3003/api/productos/filtros-opciones
```

Devuelve categorias, marcas, modelos, tipos, condiciones, anios, rango de precios y disponibilidad.

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

## Parametros soportados

| Campo | Query param | Ejemplo |
| --- | --- | --- |
| Pagina | `page` | `page=1` |
| Limite | `limit` | `limit=12` |
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

## Reglas importantes

La ruta publica de productos solo devuelve productos visibles para usuarios:

```txt
producto activo
categoria activa
```

Regla interna:

```txt
productos.activo = true
categorias.activa = true
```

Si el admin desactiva una categoria, sus productos no se borran, pero dejan de aparecer en el listado, filtros y busqueda publica mientras la categoria siga inactiva.

Si el admin desactiva un producto, ese producto deja de aparecer al usuario aunque su categoria siga activa.

`disponibilidad` acepta:

```txt
disponible
proximamente
```

Reglas internas:

```txt
disponible = stock > 0
proximamente = stock = 0 y proximamente = true
```

`stock` es un filtro exacto pensado principalmente para el admin:

```txt
stock=0
```

Eso lista productos sin stock, aunque no esten marcados como proximamente.

## Rutas comunes

### Productos generales

```http
GET http://localhost:3003/api/productos
```

### Productos paginados

```http
GET http://localhost:3003/api/productos?page=1&limit=12
```

### Productos destacados del home

```http
GET http://localhost:3003/api/productos?destacado=true&page=1&limit=8
```

### Filtrar por categoria

```http
GET http://localhost:3003/api/productos?categoria_id=1&page=1&limit=12
```

### Filtrar por marca

```http
GET http://localhost:3003/api/productos?marca=Toyota&page=1&limit=12
```

### Filtrar por modelo

```http
GET http://localhost:3003/api/productos?modelo=Hilux&page=1&limit=12
```

### Filtrar por tipo de producto

```http
GET http://localhost:3003/api/productos?tipo_producto=faro&page=1&limit=12
```

### Filtrar por condicion

```http
GET http://localhost:3003/api/productos?condicion=nuevo&page=1&limit=12
```

### Filtrar por anio exacto

```http
GET http://localhost:3003/api/productos?anio=2020&page=1&limit=12
```

### Filtrar por rango de anios

```http
GET http://localhost:3003/api/productos?anio_min=2018&anio_max=2024&page=1&limit=12
```

### Filtrar por rango de precio

```http
GET http://localhost:3003/api/productos?precio_min=100&precio_max=800&page=1&limit=12
```

### Filtrar disponibles

```http
GET http://localhost:3003/api/productos?disponibilidad=disponible&page=1&limit=12
```

### Filtrar proximamente

```http
GET http://localhost:3003/api/productos?disponibilidad=proximamente&page=1&limit=12
```

### Admin: productos sin stock

```http
GET http://localhost:3003/api/productos?page=1&limit=12&stock=0
```

### Barra de busqueda general

```http
GET http://localhost:3003/api/productos?search=faro&page=1&limit=12
```

### Barra de busqueda por letra para sugerencias

Esta ruta sirve para una barra tipo autocomplete. El frontend envia el texto que el usuario va escribiendo y decide cuantos resultados quiere mostrar.

Ejemplo: si el usuario escribe `te`, el frontend puede pedir solo 4 sugerencias:

```http
GET http://localhost:3003/api/productos?search=te&page=1&limit=4
```

La API busca coincidencias parciales con `ILIKE '%te%'` en productos activos. Por eso puede encontrar productos cuyo nombre, marca, modelo, tipo de producto o codigo contengan esas letras.

Ejemplo de uso en frontend:

```txt
Usuario escribe: t
Frontend espera debounce
Frontend consulta: /api/productos?search=t&page=1&limit=4

Usuario escribe: te
Frontend espera debounce
Frontend consulta: /api/productos?search=te&page=1&limit=4
```

Recomendacion practica: para ahorrar recursos, conviene empezar a consultar desde 2 caracteres:

```txt
t  -> no consultar todavia
te -> consultar /api/productos?search=te&page=1&limit=4
```

### Buscar por marca usando barra de busqueda

```http
GET http://localhost:3003/api/productos?search=Toyota&page=1&limit=12
```

### Buscar por modelo usando barra de busqueda

```http
GET http://localhost:3003/api/productos?search=Hilux&page=1&limit=12
```

### Categoria + marca

```http
GET http://localhost:3003/api/productos?categoria_id=1&marca=Toyota&page=1&limit=12
```

### Categoria + marca + modelo

```http
GET http://localhost:3003/api/productos?categoria_id=1&marca=Toyota&modelo=Hilux&page=1&limit=12
```

### Busqueda + marca

```http
GET http://localhost:3003/api/productos?search=faro&marca=Toyota&page=1&limit=12
```

## Filtros completos

### Frontend publico

Ejemplo con busqueda, paginacion, filtros de vehiculo, precio, anio, destacado y disponibilidad:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&categoria_id=1&marca=Toyota&modelo=Hilux&tipo_producto=faro&condicion=nuevo&precio_min=100&precio_max=800&anio_min=2018&anio_max=2024&destacado=true&search=faro&disponibilidad=disponible
```

### Admin con stock

Ejemplo para admin usando tambien `stock=0`:

```http
GET http://localhost:3003/api/productos?page=1&limit=12&categoria_id=1&marca=Toyota&modelo=Hilux&tipo_producto=faro&condicion=nuevo&precio_min=100&precio_max=800&anio_min=2018&anio_max=2024&destacado=true&search=faro&disponibilidad=proximamente&stock=0
```

## Notas para frontend

- Los combos de categoria, marca, modelo, tipo, condicion, anio, precios y disponibilidad pueden llenarse con `/api/productos/filtros-opciones`.
- `stock` puede manejarse como filtro del admin, no necesariamente del frontend publico.
- Si se usan filtros, siempre conviene enviar tambien `page` y `limit`.
- La busqueda `search` es texto libre; los demas filtros deberian venir de selects, sliders o inputs controlados.
- Para autocomplete, no cargues todos los productos en el frontend. Consulta la API con `search`, `page=1` y un `limit` pequeno como `4` o `5`.
- Si quieres mostrar imagen en sugerencias, usa `imagen_principal` y muestra una miniatura pequena. Para un servidor gratuito, es mejor usar imagenes comprimidas o thumbnails.
- El frontend publico no debe intentar mostrar productos ocultos por estados admin. La API publica ya filtra por producto activo y categoria activa.

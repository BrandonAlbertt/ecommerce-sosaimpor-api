# Estado actual API productos y admin

Este documento resume lo que hace actualmente la API del proyecto en productos y categorias.

Sirve como mapa rapido antes de entrar a las guias detalladas.

## Arquitectura usada

La API sigue esta separacion:

```txt
routes -> controllers -> services -> models -> PostgreSQL
```

Utilidades compartidas:

```txt
src/utils/filters.js
src/utils/pagination.js
src/utils/response.js
src/middlewares/error.middleware.js
```

## Modulos actuales

| Modulo | Estado actual |
| --- | --- |
| Productos publicos | Listado, filtros, busqueda, paginacion y opciones de filtros |
| Productos admin | Listado admin, filtros, busqueda, detalle, crear, editar, activar y desactivar |
| Categorias admin | Listado admin, filtros, busqueda, detalle, crear, editar, activar, desactivar y DELETE logico |
| Categorias publicas | Ruta base existe, pero no tiene endpoints implementados |
| Imagenes de producto admin | Pendiente CRUD; productos devuelve `imagen_principal` |
| Especificaciones de producto admin | Pendiente CRUD |

## Regla de visibilidad publica

La API publica de productos muestra solo:

```txt
productos activos
productos cuya categoria esta activa
```

Equivalente:

```txt
producto.activo = true
categoria.activa = true
```

Efectos:

```txt
producto inactivo -> no aparece al usuario
categoria inactiva -> sus productos no aparecen al usuario
```

Admin conserva acceso:

```txt
producto activo o inactivo
categoria activa o inactiva
producto asociado a categoria inactiva
```

## Rutas publicas de productos

```http
GET /api/productos
GET /api/productos/filtros-opciones
```

Ejemplos:

```http
GET /api/productos?page=1&limit=12
GET /api/productos?search=faro&page=1&limit=12
GET /api/productos?search=te&page=1&limit=4
GET /api/productos?categoria_id=1&marca=Toyota&page=1&limit=12
```

Filtros publicos soportados:

```txt
page
limit
search
categoria_id
marca
modelo
tipo_producto
condicion
precio_min
precio_max
stock
anio
anio_min
anio_max
destacado
disponibilidad
```

## Rutas admin de productos

```http
GET    /api/admin/productos
GET    /api/admin/productos/:id
POST   /api/admin/productos
PUT    /api/admin/productos/:id
PATCH  /api/admin/productos/:id/desactivar
PATCH  /api/admin/productos/:id/activar
```

Filtros admin de productos:

```txt
los filtros publicos
activo
```

Ejemplos:

```http
GET /api/admin/productos?page=1&limit=20
GET /api/admin/productos?activo=true&page=1&limit=20
GET /api/admin/productos?activo=false&page=1&limit=20
GET /api/admin/productos?search=faro&marca=Toyota&page=1&limit=20
```

El admin de productos devuelve campos completos, incluyendo:

```txt
activo
orden_destacado
visitas
consultas
categoria_nombre
imagen_principal
```

## Rutas admin de categorias

```http
GET    /api/admin/categorias
GET    /api/admin/categorias/:id
POST   /api/admin/categorias
PUT    /api/admin/categorias/:id
PATCH  /api/admin/categorias/:id/desactivar
PATCH  /api/admin/categorias/:id/activar
DELETE /api/admin/categorias/:id
```

`DELETE` es eliminacion logica:

```txt
activa = false
```

Filtros admin de categorias:

```txt
page
limit
search
activa
destacada
```

Ejemplos:

```http
GET /api/admin/categorias?page=1&limit=20
GET /api/admin/categorias?activa=true&page=1&limit=20
GET /api/admin/categorias?activa=false&page=1&limit=20
GET /api/admin/categorias?search=faro&destacada=true&page=1&limit=20
```

## Flujo de una lectura publica

Ejemplo:

```http
GET /api/productos?search=faro&page=1&limit=12
```

Viaja asi:

```txt
src/routes/productos.routes.js
  -> src/controllers/productos.controller.js
  -> src/services/productos.service.js
  -> src/utils/filters.js
  -> src/utils/pagination.js
  -> src/models/productos.model.js
  -> PostgreSQL
```

## Flujo de una lectura admin

Ejemplo:

```http
GET /api/admin/categorias?activa=false&page=1&limit=20
```

Viaja asi:

```txt
src/routes/admin.categorias.routes.js
  -> src/controllers/admin.categorias.controller.js
  -> src/services/admin.categorias.service.js
  -> src/utils/pagination.js
  -> src/models/categorias.model.js
  -> PostgreSQL
```

## Estados y eliminacion logica

Productos:

```txt
desactivar -> activo = false
activar    -> activo = true
```

Categorias:

```txt
desactivar -> activa = false
activar    -> activa = true
DELETE     -> activa = false
```

No se borran productos ni categorias al desactivarlos.

## Imagenes y especificaciones

Tablas existentes:

```txt
producto_imagenes
producto_especificaciones
```

Estado actual:

```txt
productos publicos y admin pueden devolver imagen_principal
no existe todavia CRUD admin para imagenes
no existe todavia CRUD admin para especificaciones
```

Rutas sugeridas futuras:

```http
GET    /api/admin/productos/:id/imagenes
POST   /api/admin/productos/:id/imagenes
PUT    /api/admin/productos/:id/imagenes/:imagenId
PATCH  /api/admin/productos/:id/imagenes/:imagenId/principal
DELETE /api/admin/productos/:id/imagenes/:imagenId

GET    /api/admin/productos/:id/especificaciones
POST   /api/admin/productos/:id/especificaciones
PUT    /api/admin/productos/:id/especificaciones/:especificacionId
DELETE /api/admin/productos/:id/especificaciones/:especificacionId
```

## Documentos detallados

Productos publicos:

```txt
FILTRACION_Y_PAGINACION_PRODUCTOS.md
GUIA_TECNICA_FILTRACION_Y_PAGINACION_PRODUCTOS.md
```

Productos admin:

```txt
ADMIN_PRODUCTOS_RUTAS_Y_FILTROS.md
GUIA_TECNICA_ADMIN_PRODUCTOS.md
```

Categorias admin:

```txt
GUIA_COMPLETA_ADMIN_CATEGORIAS.md
```

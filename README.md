# 🛍️ Ecommerce Sosaimpor API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

API REST moderna, estructurada y de alto rendimiento diseñada para dar soporte al e-commerce de **Sosaimpor**. Este backend proporciona todos los endpoints necesarios tanto para la tienda pública como para el panel de administración de productos, categorías, especificaciones técnicas e imágenes asociadas.

---

## ✨ Características Principales

* 🛒 **API Pública**:
  * Búsqueda inteligente de productos, paginación dinámica y filtros avanzados (por categoría, marca, modelo, rango de precios, etc.).
  * Endpoints optimizados para consultas rápidas de categorías destacadas.
* ⚡ **Sistema de Caché Inteligente (In-Memory)**:
  * Implementación nativa de caché mediante `Map` en [cache.js](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/src/utils/cache.js).
  * Auto-invalidación al detectar cambios exitosos en la base de datos a través de [cache-invalidator.middleware.js](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/src/middlewares/cache-invalidator.middleware.js).
  * Expiración (TTL) diferenciada: Listado de productos (5 min), Detalle por Slug (10 min), Categorías y Filtros (15 min).
* 🛠️ **Panel de Administración (`/api/admin`)**:
  * Gestión completa (CRUD) de productos, categorías y especificaciones técnicas.
  * Carga directa e inteligente de imágenes conectada con **Cloudinary** (con guardado automático de `public_id` para permitir la eliminación física y evitar imágenes huérfanas en la nube).
  * Protegido por una clave de seguridad a nivel de middleware.

---

## 📁 Estructura del Proyecto

El proyecto sigue una arquitectura limpia basada en capas de responsabilidades:

```txt
ecommerce-sosaimpor-api/
├── documentacion/       # Guías de desarrollo, estructura de la DB y endpoints
├── node_modules/        # Dependencias instaladas
├── src/                 # Código fuente principal
│   ├── config/          # Conexión a Base de Datos y Cloudinary
│   ├── controllers/     # Controladores HTTP (manejan req, res y errores)
│   ├── middlewares/     # Validación de seguridad, errores y archivos (Multer)
│   ├── models/          # Consultas SQL nativas e interacción con PostgreSQL
│   ├── routes/          # Definición de rutas públicas y administrativas
│   ├── scripts/         # Herramientas auxiliares (test de conexión a la DB)
│   ├── services/        # Lógica de negocio principal y validaciones
│   ├── utils/           # Ayudantes (formateador de respuestas, paginación, filtros y caché)
│   ├── app.js           # Inicialización y configuración de Express
│   └── server.js        # Punto de entrada de la aplicación
├── .env.example         # Plantilla de variables de entorno
├── GEMINI.md            # Reglas esenciales de arquitectura y estilo de código
├── package.json         # Scripts de inicio y dependencias declaradas
└── pnpm-lock.yaml       # Registro estricto de versiones de dependencias
```

La información fluye de la siguiente manera:
```txt
Cliente ──> [Routes] ──> [Controllers] ──> [Services] (Caché) ──> [Models] ──> [PostgreSQL]
```

---

## 🚀 Guía de Instalación Rápida (Tras Git Clone)

Sigue estos sencillos pasos para levantar el servidor en tu máquina local:

### 1️⃣ Clonar el repositorio y acceder
```bash
git clone <url-del-repositorio>
cd ecommerce-sosaimpor-api
```

### 2️⃣ Instalar dependencias con `pnpm`
Este proyecto utiliza `pnpm` para una instalación ultrarrápida y un almacenamiento en caché eficiente:
```bash
pnpm install
```

### 3️⃣ Configurar las variables de entorno (`.env`)
> [!WARNING]
> El archivo `.env` contiene credenciales sensibles y **no se sube al repositorio** de Git por razones de seguridad. Está configurado en el `.gitignore`.

Copia la plantilla de ejemplo para crear tu propio archivo `.env`:
```bash
cp .env.example .env
```

Abre el archivo `.env` recién creado en la raíz del proyecto y configúralo con tus datos locales o de producción:
```env
PORT=3003

# Configuración de base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=ecommerce_sosaimpor

# Token de seguridad para acceder a rutas de administración
ADMIN_API_KEY=tu_token_secreto_super_seguro

# Credenciales de Cloudinary
# Formato: CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_URL=cloudinary://123456789012345:secreto_real_aqui@mi_nube_cloudinary
```

### 4️⃣ Probar la conexión a la Base de Datos
Antes de arrancar el servidor, puedes validar que tus credenciales de PostgreSQL sean correctas ejecutando:
```bash
pnpm db:test
```

### 5️⃣ Levantar el servidor de desarrollo
Inicia el entorno de desarrollo que incluye recarga en caliente con `nodemon`:
```bash
pnpm dev
```

El servidor estará escuchando en `http://localhost:3003`. Puedes verificar que todo está listo haciendo una consulta a la ruta de salud:
```http
GET http://localhost:3003/health
```
**Respuesta esperada:**
```json
{
  "ok": true,
  "service": "ecommerce-sosaimpor-api"
}
```

---

## ⚙️ Variables de Entorno Explicadas

| Variable | Descripción | Estado |
| :--- | :--- | :--- |
| `PORT` | Puerto en el que se levantará la API de Express. | Opcional (Default: 3000) |
| `DB_HOST` | Dirección del host de la base de datos PostgreSQL. | **Requerido** |
| `DB_PORT` | Puerto de PostgreSQL. | Opcional (Default: 5432) |
| `DB_USER` | Usuario administrador de la base de datos. | **Requerido** |
| `DB_PASSWORD` | Contraseña del usuario de la base de datos. | **Requerido** |
| `DB_NAME` | Nombre de la base de datos de Sosaimpor. | **Requerido** |
| `ADMIN_API_KEY` | Llave secreta para autorizar peticiones en el header `x-api-key`. | **Requerido en producción** |
| `CLOUDINARY_URL` | String de configuración del SDK de Cloudinary para imágenes. | **Requerido para carga de imágenes** |

---

## 🛡️ Lista de Verificación antes de Producción

* [ ] **CORS Restringido**: Asegúrate de cambiar `app.use(cors())` en [app.js](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/src/app.js) para que apunte al dominio del frontend real y no admita todas las peticiones externas (`*`).
* [ ] **SSL en base de datos**: En servicios en la nube (como Supabase o Neon), define la variable de entorno `PGSSLMODE=require` para cifrar la conexión.
* [ ] **ADMIN_API_KEY segura**: Define una clave larga y robusta que actúe como token para el panel de administración.
* [ ] **Estructura SQL Completa**: Importa el archivo de migración necesario en PostgreSQL. Revisa [ESQUEMA_SUPABASE_TABLAS_E_INDICES.md](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/documentacion/ESQUEMA_SUPABASE_TABLAS_E_INDICES.md).

---

## 📚 Índice de Documentación Disponible

Para obtener detalles de payloads, modelos de respuesta y lógica de negocio por módulos, consulta:

| Guía y Ruta | Propósito |
| :--- | :--- |
| [Estructura y Tablas SQL](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/documentacion/ESQUEMA_SUPABASE_TABLAS_E_INDICES.md) | Detalle del esquema y optimización de índices. |
| [Productos Públicos](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/documentacion/FILTRACION_Y_PAGINACION_PRODUCTOS.md) | Consulta, ordenamiento y paginación de catálogo. |
| [Imágenes con Cloudinary](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/documentacion/GUIA_COMPLETA_ADMIN_PRODUCTO_IMAGENES_Y_CLOUDINARY.md) | Subida, ordenación y eliminación de recursos multimedia. |
| [Comentarios](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/documentacion/GUIA_COMENTARIOS_PAGINA.md) | Moderación y listado de reseñas de productos. |
| [Categorías Admin](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/documentacion/GUIA_COMPLETA_ADMIN_CATEGORIAS.md) | Gestión interna y reglas de jerarquía de categorías. |
| [Configuración General](file:///d:/Proyectos/proyectos-sosaimpor/ecommerce-sosaimpor-api/documentacion/GUIA_CONFIGURACION_ADMIN_Y_USUARIO.md) | Parámetros globales del e-commerce. |

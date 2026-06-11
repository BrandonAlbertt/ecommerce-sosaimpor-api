# Guia rapida: Railway + Supabase

Objetivo: evitar errores al desplegar la API en Railway y dejar clara la conexion correcta con Supabase.

## Semaforo rapido

| Color | Significa |
|---|---|
| <span style="color:#16a34a"><b>VERDE</b></span> | Correcto, listo para desplegar |
| <span style="color:#ca8a04"><b>AMARILLO</b></span> | Revisar antes de subir |
| <span style="color:#dc2626"><b>ROJO</b></span> | No usar, puede romper el deploy |

## Lo que se corrigio para Railway

<span style="color:#16a34a"><b>VERDE</b></span> `pnpm-workspace.yaml` ahora debe tener paquetes declarados:

```yaml
packages:
  - "."
```

<span style="color:#16a34a"><b>VERDE</b></span> `pnpm-lock.yaml` debe ser un solo documento YAML.

<span style="color:#dc2626"><b>ROJO</b></span> No debe aparecer un segundo separador `---` en medio del archivo.

<span style="color:#16a34a"><b>VERDE</b></span> `package.json` debe usar el campo estandar:

```json
"packageManager": "pnpm@11.5.3"
```

<span style="color:#dc2626"><b>ROJO</b></span> Evitar `devEngines.packageManager`, porque puede generar metadata extra de pnpm dentro del lockfile y Railway lo rechaza.

## Antes de desplegar a Railway

1. Ejecutar instalacion local:

```bash
pnpm install
```

2. Verificar que Railway no fallara en install:

```bash
pnpm install --frozen-lockfile --prefer-offline
```

3. Verificar que el lockfile no tenga documentos duplicados:

```bash
Select-String -Path pnpm-lock.yaml -Pattern '^---$'
```

<span style="color:#16a34a"><b>VERDE</b></span> Si no devuelve nada, esta bien.

<span style="color:#dc2626"><b>ROJO</b></span> Si devuelve mas de una linea, regenerar:

```bash
Remove-Item pnpm-lock.yaml
pnpm install
```

4. Subir cambios:

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "fix railway deploy config"
git push origin main
```

## Variables en Railway

En Railway configurar las variables desde el panel del servicio. No depender de `.env` local.

Variables importantes:

```env
PORT=3003
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=postgres
DB_SSL=true
CLOUDINARY_URL=...
ADMIN_API_KEY=...
COMMENT_HASH_SECRET=...
METRICS_HASH_SECRET=...
METRICS_VIEW_COOLDOWN_MINUTES=30
```

<span style="color:#ca8a04"><b>AMARILLO</b></span> `.env` es solo para desarrollo local. No subir contrasenas reales al repositorio.

## Como conectar la API con Supabase

En Supabase:

1. Entrar al proyecto.
2. Presionar el boton verde <span style="color:#16a34a"><b>Connect</b></span> en el header.
3. Abrir la pestana <b>Direct</b>.
4. Revisar <b>Connection Method</b>.

## Configuracion usada en este proyecto

<span style="color:#16a34a"><b>VERDE</b></span> Para este proyecto se debe usar <b>Shared Pooler</b>, porque es compatible con IPv4.

Datos copiados desde Supabase:

```txt
host: aws-1-us-east-2.pooler.supabase.com
port: 6543
database: postgres
user: postgres.yhdechavppckrbqwictm
```

El `.env` local debe quedar asi:

```env
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.yhdechavppckrbqwictm
DB_PASSWORD=TU_PASSWORD_DE_SUPABASE
DB_NAME=postgres
DB_SSL=true
```

<span style="color:#ca8a04"><b>AMARILLO</b></span> Despues de cambiar `.env`, cerrar y volver a iniciar la API:

```bash
Ctrl + C
pnpm run dev
```

Si Windows pregunta:

```txt
Desea terminar el trabajo por lotes (S/N)?
```

Responder:

```txt
S
```

### Opcion recomendada para Railway

<span style="color:#16a34a"><b>VERDE</b></span> Usar <b>Transaction pooler</b> o <b>Session pooler</b>.

Sirve mejor para Railway y redes IPv4.

Formato esperado:

```env
DB_HOST=aws-0-region.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.PROJECT_REF
DB_PASSWORD=TU_PASSWORD
DB_NAME=postgres
DB_SSL=true
```

Ejemplo del usuario:

```env
DB_USER=postgres.yhdechavppckrbqwictm
DB_NAME=postgres
DB_SSL=true
```

### Opcion que puede fallar

<span style="color:#dc2626"><b>ROJO</b></span> Evitar usar <b>Direct connection</b> si aparece el aviso:

```txt
Direct connections use IPv6 by default
Not IPv4 compatible
```

Ese host suele verse asi:

```env
DB_HOST=db.PROJECT_REF.supabase.co
DB_PORT=5432
DB_USER=postgres
```

Puede fallar con:

```txt
getaddrinfo ENOENT db.PROJECT_REF.supabase.co
```

En este proyecto el error viejo era:

```txt
getaddrinfo ENOENT db.yhdechavppckrbqwictm.supabase.co
```

<span style="color:#dc2626"><b>ROJO</b></span> Si vuelve a salir ese host viejo, significa que la API sigue corriendo con variables anteriores o que Railway todavia tiene variables antiguas.

Revisar:

```env
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.yhdechavppckrbqwictm
DB_SSL=true
```

## Prueba de conexion

Antes de probar el admin, ejecutar:

```bash
pnpm run db:test
```

Resultado correcto:

```txt
host: aws-1-us-east-2.pooler.supabase.com
port: 6543
user: postgres.yhdechavppckrbqwictm
ssl: true
[db] Conexion OK
```

## Checklist final

| Revision | Estado esperado |
|---|---|
| `pnpm-workspace.yaml` tiene `packages` | <span style="color:#16a34a"><b>VERDE</b></span> |
| `pnpm-lock.yaml` no tiene `---` duplicado | <span style="color:#16a34a"><b>VERDE</b></span> |
| `package.json` usa `packageManager` | <span style="color:#16a34a"><b>VERDE</b></span> |
| Railway tiene variables configuradas | <span style="color:#16a34a"><b>VERDE</b></span> |
| Supabase usa pooler si no hay IPv4 dedicada | <span style="color:#16a34a"><b>VERDE</b></span> |
| `DB_SSL=true` esta activo | <span style="color:#16a34a"><b>VERDE</b></span> |

## Prueba local antes de subir

```bash
pnpm run db:test
pnpm run dev
```

Resultado esperado:

```txt
[db] Conexion OK
[server] Servidor escuchando en http://localhost:3003
```

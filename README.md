# API de Reportes de Fugas de Agua

API REST construida con **NestJS 11 + TypeScript** para que los ciudadanos reporten
fugas de agua en la vía pública. Al crear un reporte, se guarda en PostgreSQL y se
envía automáticamente un correo de aviso a la cuadrilla de mantenimiento.

## Stack

- NestJS 11 + TypeScript
- PostgreSQL + TypeORM (migraciones, `synchronize: false`)
- `env-var` + `dotenv` para variables de entorno (`src/config/envs.ts`)
- `bcryptjs` para hash de contraseñas
- `nodemailer` para envío de correos
- `@aws-sdk/client-s3` para guardar las fotos de las fugas en un bucket de S3
- Docker (`node:22-alpine`) + Docker Compose
- GitHub Actions publica la imagen en Docker Hub en cada push a `main`
- Arquitectura por módulos: `controller -> service -> repository`
- DTOs con `class-validator`

## Estructura del proyecto

```
src/
  config/envs.ts              # Variables de entorno
  database/data-source.ts     # DataSource de TypeORM para migraciones
  migrations/                 # Migraciones SQL versionadas
  users/                      # Entidad SYSTEM_USER + lógica de usuarios
  auth/                       # Registro / login
  email/                      # EmailService con nodemailer
  storage/                    # StorageModule + StorageService (S3)
  reports/                    # Entidad WATER_REPORT + lógica de reportes
    templates/report.template.ts  # Plantilla HTML del correo
  app.module.ts
  main.ts
Dockerfile                    # Imagen de la API (node:22-alpine, node dist/main)
.dockerignore                 # Deja fuera .env, compose.yaml, node_modules, dist, .git
compose.yaml                  # API (imagen de Docker Hub) + PostgreSQL
.github/workflows/docker-publish.yml  # CI: build + push a Docker Hub
```

## Requisitos previos

- Node.js 22 (o Docker, que ya trae todo)
- PostgreSQL 14 o superior corriendo localmente o en un contenedor
- Una cuenta de correo para enviar los avisos (Gmail con "contraseña de aplicación",
  Mailtrap, o cualquier SMTP)

---

## Paso a paso para dejarlo funcionando

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear la base de datos en PostgreSQL

Con `psql` o cualquier cliente (DBeaver, pgAdmin, TablePlus, etc.):

```sql
CREATE DATABASE water_leaks_db;
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y llena tus datos reales:

```bash
cp .env.example .env
```

Edita `.env`:

```
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=water_leaks_db

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_correo@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_FROM="Municipio - Reportes de Fugas <tu_correo@gmail.com>"

MAINTENANCE_CREW_EMAIL=cuadrilla@municipio.gob

DOCKER_USER=tu_usuario_dockerhub

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_BUCKET_NAME=aguafix-fotos-tunombre
```

(La sección "Segundo parcial" al final explica cómo crear el bucket y las llaves.)

> **¿Cómo obtengo una "contraseña de aplicación" de Gmail?**
> 1. Activa la verificación en 2 pasos en tu cuenta de Google.
> 2. Ve a https://myaccount.google.com/apppasswords
> 3. Genera una contraseña de aplicación para "Correo" y úsala en `MAIL_PASSWORD`
>    (no uses tu contraseña normal de Gmail, Google la rechaza para SMTP).
>
> Alternativa más simple para pruebas: crea una cuenta gratis en
> [Mailtrap](https://mailtrap.io) (sandbox de correo), copia el host/puerto/usuario/
> password que te da su "Inbox" y pégalos en el `.env`. Así ves los correos en su
> panel sin enviarlos a una bandeja real.

### 4. Ejecutar las migraciones

Esto crea las tablas `SYSTEM_USER` y `WATER_REPORT` en la base de datos (recuerda
que `synchronize` está en `false`, así que sin este paso las tablas no existen):

```bash
npm run migration:run
```

### 5. Levantar la API

```bash
npm run start:dev
```

Deberías ver en consola:

```
🚀 API de reportes de fugas de agua corriendo en el puerto 3000
```

---

## Endpoints disponibles

### Autenticación

**POST `/auth/register`**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "secreta123",
  "isNotificationEnabled": true
}
```

**POST `/auth/login`**
```json
{
  "email": "juan@example.com",
  "password": "secreta123"
}
```
Si las credenciales son inválidas responde `400 Bad Request` con un mensaje claro
("Credenciales inválidas").

### Reportes de fugas

**POST `/reports`** — body `multipart/form-data`. Sube la foto a la carpeta
`reports/` del bucket, guarda el reporte con `photoUrl` y envía el correo a la
cuadrilla (`MAINTENANCE_CREW_EMAIL`) con la foto dentro.

| Campo           | Tipo    | Ejemplo                                   |
|-----------------|---------|-------------------------------------------|
| `address`       | texto   | Av. Patria 100, Zapopan                   |
| `description`   | texto   | Fuga fuerte saliendo de la banqueta       |
| `severity`      | texto   | `low`, `medium` o `high`                  |
| `reporterPhone` | texto   | 33-1234-5678                              |
| `photo`         | archivo | imagen jpg/png/webp, máx. 5 MB (**obligatoria**) |

Si no viene `photo` responde `400 Bad Request`.

**GET `/reports`** — lista todos los reportes, más recientes primero, incluyendo
`photoUrl` y `repairPhotoUrl`.

**PATCH `/reports/:id/repair`** (extra) — `multipart/form-data` con el archivo
`photo`: sube la foto de la reparación a `repairs/`, llena `repairPhotoUrl` y
marca el reporte como resuelto.

---

## Probar la API rápidamente

Con `curl`:

```bash
# Registrar usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","email":"juan@example.com","password":"secreta123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"secreta123"}'

# Crear reporte con foto (sube a S3 y dispara el correo)
curl -X POST http://localhost:3000/reports \
  -F address="Av. Patria 100, Zapopan" \
  -F description="Fuga en la banqueta" \
  -F severity=high \
  -F reporterPhone="33-1234-5678" \
  -F photo=@fuga.jpg

# Listar reportes
curl http://localhost:3000/reports
```

En **Postman**: `POST http://localhost:3000/reports` → pestaña *Body* →
`form-data` → agrega `address`, `description`, `severity`, `reporterPhone` como
*Text* y `photo` cambiándolo a tipo *File* para elegir la imagen.

---

## Comandos de migraciones (por si necesitas modificar entidades)

```bash
# Generar una nueva migración a partir de cambios en las entidades
npm run migration:generate -- src/migrations/NombreDeLaMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir la última migración
npm run migration:revert
```

---

## Notas de diseño

- Las contraseñas nunca se devuelven en las respuestas de `/auth/register` y
  `/auth/login` (se excluyen explícitamente antes de responder).
- Si el envío de correo falla, el reporte **igual queda guardado** en la base de
  datos (no se pierde el reporte del ciudadano por un problema de SMTP); el
  error se registra en los logs del servidor.
- `synchronize: false` está fijado a propósito: todo cambio de esquema debe
  pasar por una migración, tal como pide el municipio. La API ejecuta las
  migraciones pendientes al arrancar (`migrationsRun: true`), por eso el
  contenedor de Docker crea/actualiza las tablas solo.
- La columna `photo_url` es nullable en la base de datos para no romper los
  reportes creados antes del segundo parcial; la API exige la foto en todos los
  reportes nuevos.
- Ninguna credencial está en el código, el Dockerfile ni el workflow: todo sale
  de variables de entorno (`.env` local, GitHub Secrets en CI).

---

# Segundo parcial: S3, Docker y GitHub Actions

## 1. Bucket de S3 (fotos)

1. En la consola de AWS → **S3** → *Create bucket* (ej. `aguafix-fotos-tunombre`,
   región `us-east-1`).
2. En *Block Public Access* desmarca **Block all public access** (las fotos
   deben verse dentro del correo) y confirma.
3. En el bucket → *Permissions* → *Bucket policy*, pega (cambia el nombre):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadFotos",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::aguafix-fotos-tunombre/*"
       }
     ]
   }
   ```
4. **IAM** → *Users* → *Create user* (ej. `aguafix-api`) → *Attach policies
   directly* → `AmazonS3FullAccess` (o una política solo con `s3:PutObject` sobre
   tu bucket). Luego *Security credentials* → *Create access key* →
   "Application running outside AWS" → copia el Access Key y el Secret.
5. Pon esos valores en tu `.env`: `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`.

## 2. Docker Hub y GitHub Secrets

1. En https://hub.docker.com → *Account settings* → *Personal access tokens* →
   genera un token con permiso **Read & Write**.
2. En GitHub → tu repo → *Settings* → *Secrets and variables* → *Actions* →
   *New repository secret*:
   - `DOCKER_USER` = tu usuario de Docker Hub
   - `DOCKER_PASSWORD` = el token del paso anterior
3. Haz push a `main`: el workflow `Publicar imagen en Docker Hub` construye la
   imagen y la publica como `<DOCKER_USER>/water-leaks-api:latest`
   (https://hub.docker.com/r/<DOCKER_USER>/water-leaks-api).

## 3. Levantar con Docker Compose

```bash
cp .env.example .env      # llena DOCKER_USER, correo, AWS y DB_PASSWORD
docker compose pull       # descarga la imagen publicada en Docker Hub
docker compose up -d      # API en http://localhost:3000, Postgres en el puerto 5433
docker compose logs -f api
```

Las migraciones corren solas al arrancar la API. Para apagar:
`docker compose down` (agrega `-v` si quieres borrar la base de datos).

Para construir la imagen localmente sin Docker Hub:
`docker build -t water-leaks-api .`

## 4. Guion del video (en este orden)

1. **Cambio + commit + push:** cambia algo visible (por ejemplo el mensaje del
   `console.log` en `src/main.ts`), luego
   `git add . && git commit -m "cambio para el video" && git push origin main`.
2. **GitHub → Actions:** abre el workflow que se disparó y espera a que termine
   en verde ✅.
3. **Docker Hub:** abre `hub.docker.com/r/<usuario>/water-leaks-api` y muestra
   el tag `latest` con la fecha de "Last pushed" de hace unos minutos.
4. **API funcionando:** `docker compose pull && docker compose up -d`, y en
   Postman haz `POST /reports` con la foto (form-data). Muestra:
   - la respuesta 201 con `photoUrl`,
   - el objeto dentro de `reports/` en la consola de S3,
   - el correo recibido con la foto visible,
   - (opcional) `GET /reports` con `photoUrl` y `repairPhotoUrl`, y un
     `POST /reports` sin foto devolviendo 400.

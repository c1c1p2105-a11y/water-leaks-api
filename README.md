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
  reports/                    # Entidad WATER_REPORT + lógica de reportes
    templates/report.template.ts  # Plantilla HTML del correo
  app.module.ts
  main.ts
```

## Requisitos previos

- Node.js 20 o superior
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
```

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

**POST `/reports`** — crea el reporte, lo guarda en la base de datos y envía el
correo a la cuadrilla de mantenimiento (`MAINTENANCE_CREW_EMAIL`).
```json
{
  "address": "Av. Reforma 123, esquina con Calle 5",
  "description": "Fuga importante saliendo de la banqueta, se está encharcando la calle",
  "severity": "high",
  "reporterPhone": "555-123-4567"
}
```
`severity` acepta únicamente: `low`, `medium`, `high`.

**GET `/reports`** — lista todos los reportes, más recientes primero.

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

# Crear reporte (dispara el correo)
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{"address":"Av. Reforma 123","description":"Fuga en la banqueta","severity":"high","reporterPhone":"555-123-4567"}'

# Listar reportes
curl http://localhost:3000/reports
```

También puedes importar estas peticiones en **Postman** o **Insomnia** creando una
colección con esos 4 requests.

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

## Cómo subir el proyecto a un repositorio de Git (paso a paso)

Si nunca has hecho esto, sigue estos pasos exactos desde la carpeta del proyecto
(`water-leaks-api`):

1. **Instala Git** si no lo tienes: https://git-scm.com/downloads

2. **Inicializa el repositorio local:**
   ```bash
   git init
   git add .
   git commit -m "API de reportes de fugas de agua - version inicial"
   ```
   > El `.gitignore` ya está configurado para que `node_modules` y `.env` (con tus
   > contraseñas reales) NO se suban al repositorio. Nunca subas tu `.env` real.

3. **Crea un repositorio vacío en GitHub (o GitLab/Bitbucket):**
   - Entra a https://github.com/new
   - Ponle un nombre, por ejemplo `water-leaks-api`
   - NO marques "Initialize with README" (ya tienes uno)
   - Da clic en "Create repository"

4. **Conecta tu repositorio local con el remoto y sube el código:**
   GitHub te mostrará algo como esto después de crear el repo (cópialo tal cual
   te lo muestra a ti, la URL cambia según tu usuario):
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/water-leaks-api.git
   git push -u origin main
   ```

5. **Verifica:** entra a la URL de tu repositorio en el navegador y confirma que
   los archivos aparecen ahí (sin `node_modules` ni `.env`).

Listo, ese es tu entregable de "Repositorio de Git".

---

## Cómo grabar el video de la API funcionando

No necesitas nada complicado, con la grabadora de pantalla de tu propio sistema
operativo es suficiente:

- **Windows:** `Win + G` abre la Xbox Game Bar, tiene botón de grabar pantalla.
- **Mac:** `Cmd + Shift + 5` abre el selector de grabación de pantalla.
- **Ubuntu/Linux:** la app "Grabadora de pantalla" (o `Kazam`, `OBS Studio`).
- Alternativa multiplataforma: [OBS Studio](https://obsproject.com/) (gratis).

**Guion sugerido para el video (3-5 minutos):**

1. Muestra el proyecto abierto en tu editor (VS Code), enseña brevemente la
   estructura de carpetas (`users`, `auth`, `reports`, `email`).
2. Muestra el archivo `.env` (puedes tapar/difuminar las contraseñas reales).
3. Corre `npm run start:dev` en la terminal y muestra que arranca sin errores.
4. Abre Postman/Insomnia (o usa `curl` en otra terminal) y en vivo:
   - Haz un `POST /auth/register` y muestra la respuesta.
   - Haz un `POST /auth/login` con la contraseña correcta (200 OK) y luego con
     una incorrecta (400 Bad Request con el mensaje de error) para demostrar la
     validación de credenciales.
   - Haz un `POST /reports` con datos de una fuga.
5. Muestra tu bandeja de correo (o el panel de Mailtrap) recibiendo el aviso con
   la plantilla HTML con dirección, descripción, severidad y teléfono.
6. Haz un `GET /reports` y muestra que el reporte recién creado aparece en la
   lista.
7. (Opcional) Muestra la tabla `WATER_REPORT` en tu cliente de PostgreSQL con el
   registro guardado.

Exporta el video en `.mp4` y súbelo a donde el municipio te indique (Drive,
YouTube no listado, o adjunto directo), o inclúyelo en el repositorio dentro de
una carpeta `docs/` si el tamaño lo permite (evita subir videos pesados
directamente a GitHub; mejor usa un link).

---

## Notas de diseño

- Las contraseñas nunca se devuelven en las respuestas de `/auth/register` y
  `/auth/login` (se excluyen explícitamente antes de responder).
- Si el envío de correo falla, el reporte **igual queda guardado** en la base de
  datos (no se pierde el reporte del ciudadano por un problema de SMTP); el
  error se registra en los logs del servidor.
- `synchronize: false` está fijado a propósito: todo cambio de esquema debe
  pasar por una migración, tal como pide el municipio.

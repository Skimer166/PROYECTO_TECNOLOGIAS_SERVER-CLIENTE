# AI Market - Backend Node + Express

Backend del proyecto académico **AI Market** para la materia de **Tecnologías del Cliente/Servidor**.  
API REST en **Node.js + TypeScript + Express**, con autenticación local y Google, manejo de usuarios, agentes de IA, renta de agentes, chat en tiempo real, almacenamiento de archivos y pagos con **Stripe**.

## Requisitos
- **Node.js** 20+ y **npm**
- **MongoDB** local o Atlas accesible desde el backend
- Cuentas/llaves para servicios externos:
  - **Google OAuth** (login con Google)
  - **Gmail / SMTP** (envío de correos)
  - **OpenAI API** (respuestas de los agentes)
  - **Stripe** (pagos y checkout)

## Instalación y ejecución

```bash # Instalar dependencias
cd Backend
npm install           
```
Luego ejecuta el servidor en modo desarrollo:

```bash
npm run dev          
```

Si necesitas HTTPS en local (por ejemplo para Stripe):
```bash
# backend HTTP normal
npm run dev

# en otra terminal (desde Backend o raíz del repo)
npx local-ssl-proxy --source 3443 --target 3001
```
Con esto podrás acceder al backend también en `https://localhost:3443`.

---
## La documentacion y endpoints estan en el swagger
Swagger permite visualizar y probar todos los endpoints desde el navegador.

- **URL:** `http://localhost:3001/swagger`
- **Config:** `swagger.config.ts`

Los comentarios `@swagger` están distribuidos en los archivos de rutas de cada modulo (`src/app/**/routes.ts`).

## Módulos y rutas principales
### 1. Autenticación (`/auth`)

- `POST /auth/login` → login con email/contraseña devuelve jwt
- `POST /auth/signup` → registro de usuario
- `POST /auth/forgot-password` → envía correo de recuperacion
- `POST /auth/reset-password` → cambia contraseña usando token de recuperacion
- `GET  /auth/google` → inicio de login con gogle
- `GET  /auth/google/callback` → callback de google oauth

Todas las rutas protegidas usan el middleware `verifyToken`, que valida el jwt y bloquea usuarios con estado `blocked`.

### 2. Usuarios (`/users`)

- `GET    /users` → listar usuarios (solo autenticado)
- `GET    /users/:id` → detalle de usuario
- `POST   /users` o `/users/register` → crear usuario
- `PUT    /users/:id` → actualizar datos de usuario
- `DELETE /users/:id` → eliminar usuario (**solo admin**)
- `GET    /users/favorites` → lista de agentes favoritos (demo)
- `PUT    /users/:id/role` → cambiar rol (`user`/`admin`) (**solo admin**)
- `PUT    /users/:id/status` → cambiar estado (`active`/`blocked`) (**solo admin**)
- `PUT    /users/:id/credits` → agregar creditos a un usuario (**solo admin**)

El panel de administración consume estas rutas para gestionar usuarios, roles, estado y creditos.

### 3. Agentes (`/agents`)

- `GET    /agents` → listar agentes (filtros `category`, `available=true`)
- `GET    /agents/search?search=texto` → buscar por nombre/descripcion
- `POST   /agents` → crear agente (**solo admin**)
- `GET    /agents/:id` → detalle de un agente
- `PUT    /agents/:id` → actualizar agente (**admin/owner**)
- `DELETE /agents/:id` → eliminar agente (**admin/owner**)
- `POST   /agents/:id/rent` → rentar un agente
- `POST   /agents/:id/release` → liberar agente rentado
- `GET    /agents/my-rentals` → agentes rentados por el usuario actual


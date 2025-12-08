# PROYECTO TECNOLOGÍAS SERVER-CLIENTE: MARKET AI

## 🚀 Visión General del Proyecto

**Market AI** es un marketplace de Agentes de Inteligencia Artificial desarrollado como un proyecto full-stack. La aplicación permite a los usuarios rentar agentes de IA por tiempo limitado utilizando un sistema de créditos, integra pagos reales mediante Stripe, y ofrece una experiencia de usuario fluida con una arquitectura de Componentes Standalone de Angular.

### ⚙️ Stack Tecnológico

| Componente | Tecnología | Notas |
| :--- | :--- | :--- |
| **Frontend** | Angular (v20+) | Standalone Components, TypeScript, RxJS, Angular Material. |
| **Backend** | Node.js / Express | TypeScript, Mongoose (MongoDB ODM). |
| **Base de Datos** | MongoDB Atlas | Base de datos NoSQL para almacenamiento. |
| **Pagos** | Stripe Checkout | Sistema de recarga de créditos. |
| **Tiempo Real** | Socket.IO | Implementado para el Chat de Soporte. |
| **Almacenamiento** | AWS S3 | Almacenamiento de imágenes de perfil y documentos. |
| **Despliegue** | Vercel (Frontend) & Render (Backend) | Plataformas de producción. |

### ✨ Características Principales

* **Autenticación Completa:** Login local, Registro y autenticación mediante Google (OAuth).
* **Gestión de Roles:** Diferenciación entre usuarios (`user`) y administradores (`admin`).
* **Marketplace de Agentes:** CRUD completo para administradores.
* **Sistema de Renta:** Renta de agentes por hora, con cálculo y consumo de créditos.
* **Sistema de Pagos:** Recarga de créditos mediante Stripe Checkout.
* **Chat de Soporte:** Comunicación en tiempo real (Socket.IO) para asistencia.
* **SSR (Server-Side Rendering):** Configuración inicial para un mejor SEO.

---

## 🛠️ Configuración y Ejecución Local

Sigue estos pasos para levantar el proyecto en tu entorno local.

### 1. Prerrequisitos

Asegúrate de tener instalado:
* Node.js (LTS recomendado)
* npm (o yarn)
* Angular CLI (`npm install -g @angular/cli`)
* Acceso a MongoDB Atlas, Stripe y AWS S3.

### 2. Variables de Entorno (`.env`)

Crea un archivo `.env` en la carpeta **`Backend/`** y añade las siguientes variables con tus credenciales.

```env
# --------------------
# 🔑 CORE
# --------------------
PORT=3001
MONGO_URL="mongodb+srv://[USER]:[PASSWORD]@cluster..." 
JWT_KEY="tu_clave_secreta_jwt_para_firmar"

# --------------------
# 🌐 DEPLOYMENT & CORS
# --------------------
# Nota: Para desarrollo local, usa http://localhost:4200
FRONTEND_URL="http://localhost:4200"

# --------------------
# 💳 PAGOS (STRIPE)
# --------------------
# Solo para el backend (NUNCA expuesto en el frontend)
STRIPE_SECRET_KEY="sk_test_..."

# --------------------
# ✉️ EMAIL (NODEMAILER)
# --------------------
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER="tu_correo@gmail.com"
EMAIL_PASSWORD="tu_app_password_de_google"

# --------------------
# 🔒 GOOGLE OAUTH
# --------------------
GOOGLE_CLIENT_ID="[TU_CLIENT_ID]"
GOOGLE_CLIENT_SECRET="[TU_CLIENT_SECRET]"
# Callback local para Google (ajustar si es necesario):
GOOGLE_CALLBACK_URL="http://localhost:3001/auth/google/callback" 

# --------------------
# ☁️ AWS S3
# --------------------
S3_REGION="us-east-1"
S3_ACCESS_KEY="[TU_ACCESS_KEY]"
S3_SECRET_KEY="[TU_SECRET_KEY]"
S3_BUCKET="[TU_NOMBRE_DEL_BUCKET]"

### 3. Ejecutar el Backend (API)
Abre una terminal y navega a la carpeta Backend/.

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (con hot-reload)
npm run dev 
# El servidor se iniciará en http://localhost:3001

### 4. Ejecutar el Frontend (Angular)
Abre otra terminal y navega a la carpeta Frontend/Market-AI/

# Instalar dependencias
npm install

# Iniciar la aplicación Angular
npm start 
# La aplicación se abrirá en http://localhost:4200

########BACKEND

 AI Market - Backend (Node + Express)

Backend del proyecto académico **AI Market** para la materia de **Tecnologías del Cliente/Servidor**.  
Expone una API REST en **Node.js + TypeScript + Express**, con autenticación (local y Google), manejo de usuarios, agentes de IA, renta de agentes, chat en tiempo real, almacenamiento de archivos y pagos con **Stripe**.

---

## Requisitos

- **Node.js** 20+ y **npm**
- **MongoDB** (local o Atlas) accesible desde el backend
- Cuentas/llaves para servicios externos:
  - **Google OAuth** (login con Google)
  - **Gmail / SMTP** (envío de correos)
  - **OpenAI API** (respuestas de los agentes)
  - **Stripe** (pagos y checkout)

---

## Instalación y ejecución

```bash
cd Backend
npm install           # Instalar dependencias
```

Configura tu archivo `.env` (ya existe uno en este proyecto).  
Variables típicas que deben estar definidas:

- `PORT` → puerto del backend (en el proyecto se usa **3001**)
- `MONGO_URL` → cadena de conexión a MongoDB
- `SECRET_KEY` / `JWT_KEY` → claves para firmar JWT
- `FRONTEND_URL` → URL del frontend (por ejemplo `http://localhost:4200` o `https://localhost:4443`)
- `OPENAI_API_KEY` → clave de OpenAI
- `STRIPE_SECRET_KEY` → clave secreta de Stripe (modo test)
- Credenciales de correo (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`)
- Credenciales de Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`)

Luego ejecuta el servidor en modo desarrollo:

```bash
npm run dev          # arranca en http://localhost:3001 (según PORT)
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

## Documentación de la API (Swagger)

Swagger permite visualizar y probar todos los endpoints desde el navegador.

- **URL:** `http://localhost:3001/swagger`
- **Config:** `swagger.config.ts`

Los comentarios `@swagger` están distribuidos en los archivos de rutas de cada módulo (`src/app/**/routes.ts`).

---

## Módulos y rutas principales

### 1. Autenticación (`/auth`)

- `POST /auth/login` → login con email/contraseña (devuelve JWT)
- `POST /auth/signup` → registro de usuario
- `POST /auth/forgot-password` → envía correo de recuperación
- `POST /auth/reset-password` → cambia contraseña usando token de recuperación
- `GET  /auth/google` → inicio de login con Google
- `GET  /auth/google/callback` → callback de Google OAuth

Todas las rutas protegidas usan el middleware `verifyToken`, que valida el JWT y bloquea usuarios con estado `blocked`.

### 2. Usuarios (`/users`)

- `GET    /users` → listar usuarios (solo autenticado)
- `GET    /users/:id` → detalle de usuario
- `POST   /users` o `/users/register` → crear usuario
- `PUT    /users/:id` → actualizar datos de usuario
- `DELETE /users/:id` → eliminar usuario (**solo admin**)
- `GET    /users/favorites` → lista de agentes favoritos (demo)
- `PUT    /users/:id/role` → cambiar rol (`user`/`admin`) (**solo admin**)
- `PUT    /users/:id/status` → cambiar estado (`active`/`blocked`) (**solo admin**)
- `PUT    /users/:id/credits` → agregar créditos a un usuario (**solo admin**)

El panel de administración consume estas rutas para gestionar usuarios, roles, estado y créditos.

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

### 4. Archivos (`/files`)

Maneja subida y administración de archivos del usuario (por ejemplo documentos para los agentes).  
Usa **Multer** y **AWS S3**.

### 5. Chat (`/chat`)

Endpoints para conversar con un agente de IA, apoyados en OpenAI:

- `POST /chat` → envía mensaje a un agente y devuelve la respuesta.

Además, se usa **Socket.IO** (`src/index.ts`) para el chat de soporte en tiempo real entre usuarios y administradores.

### 6. Mailer (`/mailer`)

Rutas para envío de correos (bienvenida, recuperación de contraseña, etc.) usando `nodemailer` y SMTP.

### 7. Pagos (`/payments`)

Integración con **Stripe** (modo test):

- `POST /payments/create-checkout-session` → crea sesión de checkout para Stripe.
- `POST /payments/verify-success` → verifica el resultado de un pago.

> Nota: para webhooks de Stripe necesitarás exponer una ruta HTTPS pública (por ejemplo usando `stripe-cli` o `ngrok`) o el proxy HTTPS local que ya se está usando.

---

## Dependencias más importantes

- **Express** – servidor HTTP principal
- **TypeScript** – tipado del proyecto
- **Mongoose** – modelo de datos en MongoDB
- **jsonwebtoken** – autenticación vía JWT
- **bcryptjs** – hash de contraseñas
- **socket.io** – chat de soporte en tiempo real
- **multer / multer-s3 / aws-sdk** – subida de archivos a S3
- **nodemailer** – envío de correos
- **openai** – integración con modelos de IA
- **stripe** (módulo `payments`) – pagos y checkout
- **local-ssl-proxy** – soporte HTTPS en entorno local

---

## Pruebas rápidas

1. **Levantar MongoDB** (local o Atlas) y asegurarte de que `MONGO_URL` apunta a una base válida.
2. Configurar `.env` con al menos:
   - `PORT`, `MONGO_URL`, `SECRET_KEY`, `JWT_KEY`, `FRONTEND_URL`
3. Instalar dependencias y arrancar el servidor:
   ```bash
   npm install
   npm run dev
   ```
4. Abrir Swagger en `http://localhost:3001/swagger` y probar:
   - `POST /auth/signup`
   - `POST /auth/login` → copiar el token
   - Agregar el token como `Bearer <token>` en el botón **Authorize** de Swagger.
   - Probar rutas protegidas (`/agents`, `/users`, `/payments`, etc.).

Con esto tienes una guía básica para levantar el backend, ver la documentación y probar los endpoints más importantes del proyecto. 

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
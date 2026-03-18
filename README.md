# PROYECTO TECNOLOGÍAS SERVER-CLIENTE: MARKET AI

## 🚀 Descripcion

**Market AI** es un marketplace de Agentes de Inteligencia Artificial desarrollado como un proyecto full-stack. La aplicación permite a los usuarios rentar agentes de IA por tiempo limitado utilizando un sistema de créditos, integra pagos reales mediante Stripe, y ofrece una experiencia de usuario fluida con una arquitectura de Componentes Standalone de Angular.

### ✨ Requerimientos

* **Autenticación Completa:** Login local, Registro y autenticación mediante Google (OAuth).
* **Gestión de Roles:** Diferenciación entre usuarios (`user`) y administradores (`admin`).
* **Marketplace de Agentes:** CRUD completo para administradores.
* **Sistema de Renta:** Renta de agentes por hora, con cálculo y consumo de créditos.
* **Sistema de Pagos:** Recarga de créditos mediante Stripe Checkout.
* **Chat de Soporte:** Comunicación en tiempo real (Socket.IO) para asistencia.
* **SSR (Server-Side Rendering):** Configuración inicial para un mejor SEO.

---

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
| **Pruebas** | Jest y Eslint | Framework de pruebas unitarias y análisis estático de código. |


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

# Guia de Contribucion

## Requisitos previos

- Tener Git instalado
- Tener acceso al repositorio
- Node.js instalado (para correr el proyecto localmente)

---

## Flujo de trabajo

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd PROYECTO_TECNOLOGIAS_SERVER-CLIENTE
```

### 2. Crear una rama nueva

Nunca trabajes directamente en `main`. Crea una rama con un nombre descriptivo:

```bash
git checkout -b nombre-de-tu-rama
```

Ejemplos de nombres de ramas:
- `feature/login-google`
- `fix/error-en-pagos`
- `refactor/modulo-usuarios`

### 3. Hacer tus cambios

Trabaja en tu rama normalmente. Una vez listos los cambios, agrega y haz commit:

```bash
git add .
git commit -m "tipo/descripcion-breve"
```

Usa **Conventional Commits** para los mensajes. El formato es:

```
tipo/descripcion-breve-en-minusculas
```

| Tipo       | Cuando usarlo                                      |
|------------|----------------------------------------------------|
| `feature`  | Nueva funcionalidad                                |
| `fix`      | Correccion de un bug                               |
| `refactor` | Cambio de codigo que no agrega ni corrige nada     |
| `test`     | Agregar o modificar pruebas                        |
| `docs`     | Cambios en documentacion                           |
| `chore`    | Tareas de mantenimiento (dependencias, configs)    |

Ejemplos:
- `git commit -m "feature/validacion-email-en-registro"`
- `git commit -m "fix/error-en-endpoint-de-agentes"`
- `git commit -m "refactor/modulo-usuarios"`
- `git commit -m "test/pruebas-unitarias-auth"`
- `git commit -m "docs/actualizar-readme"`

### 4. Subir tu rama al repositorio remoto

```bash
git push origin nombre-de-tu-rama
```

### 5. Crear un Pull Request (PR)

1. Ve al repositorio en GitHub
2. Haz clic en **"Compare & pull request"** (aparece automaticamente al subir una rama)
3. Asegurate de que el PR apunte de tu rama hacia `main`
4. Escribe un titulo claro y una descripcion de los cambios
5. Haz clic en **"Create pull request"**

### 6. Revision y merge

- Espera a que alguien revise tu PR
- Si hay comentarios, haz los cambios en tu rama local, haz commit y push; el PR se actualiza automaticamente
- Una vez aprobado, se hace merge a `main`

---

## Estructura

```
PROYECTO_TECNOLOGIAS_SERVER-CLIENTE/
│
├── .gitignore
├── README.md
├── estructure.md
│
├── Backend/                              # Servidor Node.js + Express + TypeScript
│   ├── .gitignore
│   ├── package.json                      # Dependencias: Express, TypeScript, Jest
│   ├── jest.config.ts                    # Configuracion de pruebas Jest
│   ├── tsconfig.json                     # Configuracion de TypeScript
│   │
│   └── src/
│       ├── index.ts                      # Punto de entrada del servidor
│       ├── index.html                    # HTML para documentacion Swagger
│       ├── swagger.config.ts             # Configuracion de documentacion API
│       │
│       ├── database/
│       │   └── index.ts                  # Conexion a la base de datos
│       │
│       └── app/
│           ├── routes.ts                 # Configuracion central de rutas
│           │
│           ├── agents/                   # Modulo de agentes IA
│           │   ├── controller.ts         # Logica de negocio de agentes
│           │   ├── model.ts              # Modelo de datos del agente
│           │   └── routes.ts             # Endpoints de agentes
│           │
│           ├── auth/                     # Modulo de autenticacion
│           │   ├── controller.ts         # Logica de autenticacion
│           │   ├── routes.ts             # Endpoints de auth
│           │   └── google.ts             # Integracion OAuth con Google
│           │
│           ├── chat/                     # Modulo de chat en tiempo real
│           │   ├── controller.ts
│           │   └── routes.ts
│           │
│           ├── documents/                # Modulo de gestion de documentos
│           │   ├── controller.ts
│           │   ├── model.ts
│           │   └── routes.ts
│           │
│           ├── users/                    # Modulo de usuarios
│           │   ├── controller.ts
│           │   ├── model.ts
│           │   └── routes.ts
│           │
│           ├── mailer/                   # Servicio de correo electronico
│           │   ├── controller.ts
│           │   ├── model.ts
│           │   └── routes.ts
│           │
│           ├── payments/                 # Modulo de pagos
│           │   ├── controller.ts
│           │   └── routes.ts
│           │
│           ├── storage/                  # Almacenamiento en la nube
│           │   └── s3.ts                 # Integracion con AWS S3
│           │
│           ├── middlewares/              # Middlewares de Express
│           │   └── auth.ts               # Middleware de autenticacion
│           │
│           ├── interfaces/               # Definiciones de tipos TypeScript
│           │   ├── agent.ts
│           │   ├── user.ts
│           │   └── support.ts
│           │
│           └── test/                     # Pruebas unitarias (Jest)
│               ├── agents.test.ts
│               └── users.test.ts
│
└── Frontend/                             # Aplicacion Angular
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    │
    └── Market-AI/                        # Proyecto Angular principal
        ├── .editorconfig
        ├── .gitignore
        ├── angular.json                  # Configuracion del workspace Angular
        ├── package.json
        ├── tsconfig.json
        ├── tsconfig.app.json
        ├── tsconfig.spec.json
        ├── cypress.config.ts             # Configuracion de pruebas E2E
        │
        ├── .vscode/                      # Configuracion de VS Code
        │   ├── extensions.json
        │   ├── launch.json
        │   └── tasks.json
        │
        ├── public/                       # Recursos estaticos publicos
        │   ├── favicon.ico
        │   └── assets/
        │       └── logo.jpeg
        │
        ├── src/
        │   ├── index.html                # HTML principal
        │   ├── main.ts                   # Bootstrap del cliente
        │   ├── main.server.ts            # Bootstrap del servidor (SSR)
        │   ├── server.ts                 # Configuracion del servidor SSR
        │   ├── styles.scss               # Estilos globales
        │   │
        │   ├── assets/                   # Recursos de la aplicacion
        │   │   ├── get-pip.py
        │   │   └── google-logo.svg
        │   │
        │   └── app/                      # Modulo raiz de Angular
        │       ├── app.html              # Plantilla del layout principal
        │       ├── app.scss              # Estilos del componente raiz
        │       ├── app.ts                # Componente principal
        │       ├── app.spec.ts           # Prueba del componente principal
        │       ├── app.config.ts         # Configuracion Angular (cliente)
        │       ├── app.config.server.ts  # Configuracion Angular (servidor)
        │       ├── app.routes.ts         # Rutas del cliente
        │       ├── app.routes.server.ts  # Rutas del servidor
        │       │
        │       ├── layouts/              # Componentes de layout
        │       │   ├── header/
        │       │   │   ├── header.ts
        │       │   │   ├── header.html
        │       │   │   ├── header.scss
        │       │   │   └── header.spec.ts
        │       │   └── footer/
        │       │       ├── footer.ts
        │       │       ├── footer.html
        │       │       ├── footer.scss
        │       │       └── footer.spec.ts
        │       │
        │       ├── pages/                # Paginas / vistas principales
        │       │   ├── landing-page/     # Pagina publica de inicio
        │       │   ├── login/            # Inicio de sesion
        │       │   ├── register/         # Registro de usuario
        │       │   ├── login-success/    # Confirmacion de login exitoso
        │       │   ├── reset-password/   # Restablecimiento de contrasena
        │       │   ├── home-page/        # Dashboard principal
        │       │   ├── payment-success/  # Confirmacion de pago exitoso
        │       │   │
        │       │   ├── mis-agentes/      # Lista de agentes del usuario
        │       │   │   ├── mis-agentes.ts
        │       │   │   ├── mis-agentes.html
        │       │   │   ├── mis-agentes.scss
        │       │   │   ├── mis-agentes.spec.ts
        │       │   │   └── cuadro-de-confirmacion.ts  # Dialogo de confirmacion
        │       │   │
        │       │   ├── create-agent-dialog/  # Dialogo: crear nuevo agente
        │       │   ├── rent-dialog/          # Dialogo: rentar un agente
        │       │   ├── add-credits-dialog/   # Dialogo: agregar creditos
        │       │   │
        │       │   ├── mi-perfil/            # Perfil del usuario
        │       │   ├── admin-agents/         # Admin: gestion de agentes
        │       │   ├── admin-users/          # Admin: gestion de usuarios
        │       │   │   ├── admin-users-dialog.ts
        │       │   │   ├── confirm-delete-user-dialog.ts
        │       │   │   └── edit-credits-dialog.ts
        │       │   ├── admin-support/        # Admin: tickets de soporte
        │       │   └── support-widget/       # Widget de soporte al usuario
        │       │
        │       └── shared/               # Utilidades compartidas
        │           ├── config.ts         # Configuracion global
        │           ├── guards/
        │           │   └── auth-guard-guard.ts  # Guard de autenticacion
        │           ├── services/
        │           │   ├── auth.ts       # Servicio de autenticacion
        │           │   ├── user.ts       # Servicio de usuario
        │           │   └── socket.ts     # Servicio WebSocket (Socket.io)
        │           └── types/
        │               └── user.ts       # Tipos TypeScript del usuario
        │
        └── cypress/                      # Pruebas E2E (Cypress)
            ├── e2e/
            │   └── auth.cy.ts            # Pruebas de autenticacion
            ├── fixtures/
            │   └── example.json
            ├── support/
            │   ├── commands.ts
            │   └── e2e.ts
            └── tsconfig.json
```

## Pruebas unitarias

Antes de abrir un PR, **debes escribir pruebas unitarias para el codigo que agregaste o modificaste**.

### Backend (Jest)

Los archivos de prueba van en `Backend/src/test/` con el nombre `<modulo>.test.ts`.

```bash
cd Backend
npm test
```

### Frontend (Cypress)

Las pruebas E2E van en `Frontend/Market-AI/cypress/e2e/`.

```bash
cd Frontend/Market-AI
npx cypress run
```

### Reglas

- Todo nuevo endpoint o funcionalidad debe tener al menos una prueba.
- Las pruebas deben pasar al 100% antes de hacer push.
- No se aceptaran PRs con pruebas fallando.

---

## Buenas practicas

- **Una rama = una funcionalidad o fix.** No mezcles cambios no relacionados en la misma rama.
- **Sincroniza tu rama con main** antes de abrir un PR para evitar conflictos:
  ```bash
  git fetch origin
  git rebase origin/main
  ```
- **No hagas push directo a `main`.**
- Corre las pruebas antes de subir tus cambios:
  ```bash
  # Backend
  cd Backend && npm test

  # Frontend E2E
  cd Frontend/Market-AI && npx cypress run
  ```


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

## Mockups de la aplicación

https://docs.google.com/document/d/1Mhebb97YuDDc18YMeti8nJtNwfwt7NyUcVa0UZodXKA/edit?usp=sharing


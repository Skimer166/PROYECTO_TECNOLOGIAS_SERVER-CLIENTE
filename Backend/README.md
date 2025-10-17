# AI Market — Proyecto Web Cliente/Servidor

### Descripción

Proyecto académico del curso **Tecnologías del Cliente/Servidor**. Consiste en un **AI Market**, donde los usuarios podrán comprar y usar agentes de inteligencia artificial.
El backend está desarrollado en **Node.js + TypeScript + Express**, con documentación **Swagger**, y el frontend se implementará en **Angular**.

---

### Swagger (Documentación API)

Swagger permite visualizar y probar todos los endpoints desde el navegador.

* **Ruta:** `http://localhost:3000/swagger`
* **Archivo de configuración:** `swagger.config.ts`
* **Integración:**

```ts
import swaggerJsDoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/swagger', serve, setup(swaggerDocs));
```

---

### Scripts de Ejecución

```bash
npm install      # Instala dependencias
npm run dev      # Ejecuta en modo desarrollo
```

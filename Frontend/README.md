# Unit Testing Report — Lilia Padilla

# Módulo: Login

Archivo:
`src/app/pages/login/login.spec.ts`

## Casos probados

| ID | Caso de prueba | Resultado esperado |
|---|---|---|
| LG-01 | Creación del componente | El componente se crea correctamente |
| LG-02 | Login exitoso | Se llama al servicio login |
| LG-03 | Credenciales incorrectas | Se ejecuta openDialog |
| LG-04 | Usuario no encontrado | Se ejecuta openDialog |
| LG-05 | Email inválido | El control email es inválido |
| LG-06 | Existencia del control password | El control existe |
| LG-07 | Formulario vacío | El formulario es inválido |
| LG-08 | Estado inicial del formulario | El formulario inicia inválido |
| LG-09 | Cancelación de login | Se ejecuta location.back() |
| LG-10 | Link de registro | Existe al menos un link |
| LG-11 | Renderizado de botones | Existen botones en pantalla |
| LG-12 | Renderizado de título | Se muestra “Inicia sesión” |
| LG-13 | Formulario válido | El formulario es válido con datos correctos |
| LG-14 | Navegación tras login exitoso | Navega a home-page |
| LG-15 | openDialog en login exitoso | Se ejecuta openDialog |
| LG-16 | Email vacío | Formulario inválido |
| LG-17 | Password vacía | Formulario inválido |
| LG-18 | Existencia del control email | El control existe |
| LG-19 | openDialog manual | No genera excepción |

---

# Módulo: Register

Archivo:
`src/app/pages/register/register.spec.ts`

## Casos probados

| ID | Caso de prueba | Resultado esperado |
|---|---|---|
| RG-01 | Creación del componente | El componente se crea |
| RG-02 | Formulario válido | El formulario es válido |
| RG-03 | Renderizado correcto | El componente renderiza |
| RG-04 | Nombre corto inválido | El control es inválido |
| RG-05 | Email inválido | Error de email |
| RG-06 | Password corta inválida | Error de validación |
| RG-07 | Passwords diferentes | Error mismatch |
| RG-08 | Terms requerido | Formulario inválido |
| RG-09 | Formulario vacío | Formulario inválido |
| RG-10 | Renderizado de botones | Existen botones |
| RG-11 | Formulario inicial | Inicia inválido |
| RG-12 | Link login | Existe un link |
| RG-13 | Renderizado del título | Muestra “Crea tu cuenta” |
| RG-14 | Renderizado del formulario | Existe form |
| RG-15 | Control Nombre | Existe |
| RG-16 | Control Correo | Existe |
| RG-17 | Control Contraseña | Existe |
| RG-18 | Control Confirmar contraseña | Existe |
| RG-19 | Control Terms | Existe |
| RG-20 | Nombre vacío | Formulario inválido |
| RG-21 | Correo vacío | Formulario inválido |
| RG-22 | Password vacía | Formulario inválido |
| RG-23 | Terms en false | Formulario inválido |
| RG-24 | Passwords iguales | No existe mismatch |
| RG-25 | Datos correctos | Formulario válido |

---

# Módulo: Reset Password

Archivo:
`src/app/pages/reset-password/reset-password.spec.ts`

## Casos probados

| ID | Caso de prueba | Resultado esperado |
|---|---|---|
| RP-01 | Token válido | Se carga correctamente |
| RP-02 | Token ausente | hasToken = false |
| RP-03 | Reset exitoso | Navega a login |
| RP-04 | Token inválido | Abre dialog error |
| RP-05 | Password corta | Error minlength |
| RP-06 | Passwords diferentes | Error mismatch |
| RP-07 | Cancelar operación | Ejecuta location.back() |
| RP-08 | Formulario vacío | Formulario inválido |
| RP-09 | Password vacía | Formulario inválido |
| RP-10 | Passwords iguales | Formulario válido |

---

# Módulo: Login Success

Archivo:
`src/app/pages/login-success/login-success.spec.ts`

## Casos probados

| ID | Caso de prueba | Resultado esperado |
|---|---|---|
| LS-01 | OAuth con token válido | Guarda token y navega |
| LS-02 | OAuth sin token | Redirige a login |
| LS-03 | Dialog de éxito | Se abre dialog success |

---

# Módulo: Popup Login / Notification Dialog

Archivo:
`src/app/pages/login/popup-login.spec.ts`

## Casos probados

| ID | Caso de prueba | Resultado esperado |
|---|---|---|
| ND-01 | Renderizado de mensaje | Se muestra mensaje |
| ND-02 | Botón cerrar | Ejecuta dialogRef.close() |
| ND-03 | Renderizado botón cerrar | Existe botón |


# Total de Test

60

---

# Selenium

# Módulo: Login

Archivo:
`selenium/tests/login.test.ts`

## Casos probados

| ID          | Caso de prueba                                     |
| ----------- | -------------------------------------------------- |
| LG-01       | Renderizado correcto de login                      |
| LG-02       | Login exitoso con credenciales válidas             |
| LG-03       | Credenciales incorrectas permanecen en login       |
| LG-04       | Usuario inexistente permanece en login             |
| LG-05       | Validación de email inválido                       |
| LG-06       | Validación de contraseña vacía                     |
| LG-07       | Formulario vacío inválido                          |
| LG-08       | Botón Enviar deshabilitado con formulario inválido |
| LG-09       | Navegación hacia Register                          |
| LG-10       | Navegación mediante botón Cancelar                 |
| LG-11       | Recuperación de contraseña                         |
| LG-12       | Renderizado del botón Google                       |
| LG-13       | Redirección OAuth Google                           |
| LG-14       | Usuario autenticado redirigido fuera de Login      |
| LG-15       | Estado loading durante submit                      |
| LG-extra-01 | Usuario autenticado evita acceso a login           |
| LG-extra-02 | Validación de OAuth Provider                       |

---

# Módulo: Register

Archivo:
`selenium/tests/register.test.ts`

## Casos probados

| ID          | Caso de prueba                            |
| ----------- | ----------------------------------------- |
| RG-01       | Renderizado correcto del formulario       |
| RG-02       | Registro válido procesa submit            |
| RG-03       | Email ya registrado                       |
| RG-04       | Validación de email inválido              |
| RG-05       | Contraseña corta inválida                 |
| RG-06       | Passwords diferentes                      |
| RG-07       | Checkbox Terms requerido                  |
| RG-08       | Formulario vacío inválido                 |
| RG-09       | Navegación hacia Login                    |
| RG-10       | Botón Enviar renderizado                  |
| RG-11       | OAuth Google                              |
| RG-12       | Renderizado de campos                     |
| RG-13       | Validación visual de errores              |
| RG-14       | Renderizado general correcto              |
| RG-extra-01 | Botón Cancelar navega fuera de /register  |
| RG-extra-02 | Checkbox Terms habilita/deshabilita botón |

---


# Módulo: Reset Password

Archivo:
`selenium/tests/reset-password.test.ts`

## Casos probados

| ID          | Caso de prueba                           |
| ----------- | ---------------------------------------- |
| RP-01       | Renderizado correcto de Reset Password   |
| RP-02       | Token ausente                            |
| RP-03       | Cambio exitoso de contraseña             |
| RP-04       | Token inválido                           |
| RP-05       | Password corta inválida                  |
| RP-06       | Passwords diferentes                     |
| RP-07       | Botón Cancelar funcional                 |
| RP-08       | Formulario vacío inválido                |
| RP-extra-01 | Botón Guardar deshabilitado con mismatch |
| RP-extra-02 | Navegación al cancelar                   |

---

# Módulo: Login-Success

Archivo:
`selenium/tests/login-success.test.ts`

## Casos probados

| ID    | Caso de prueba                 |
| ----- | ------------------------------ |
| LS-01 | OAuth con token válido         |
| LS-02 | OAuth sin token                |
| LS-03 | Renderizado de mensaje exitoso |


# Módulo: Notification-dialog

Archivo:
`selenium/tests/notification-dialog.test.ts`

## Casos probados

| ID    | Caso de prueba                     |
| ----- | ---------------------------------- |
| ND-01 | Renderizado correcto del dialog    |
| ND-02 | Aplicación estable tras carga      |
| ND-03 | Renderizado de botones y elementos |

---

# Total de Test

49

---
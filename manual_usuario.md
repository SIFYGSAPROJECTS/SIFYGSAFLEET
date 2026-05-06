# 📘 Manual de Usuario — SIFYGSA Fleet v2.0
### Plataforma Integral de Gestión Vehicular Corporativa

> **Versión:** 2.0 | **Empresa:** SIFYGSA S.A. de C.V. | **Producción:** [fleet.sifygsa.com](https://fleet.sifygsa.com)

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Acceso al Sistema (Login)](#2-acceso-al-sistema-login)
3. [Panel Principal (Dashboard)](#3-panel-principal-dashboard)
4. [Módulo: Inventario de Flota](#4-módulo-inventario-de-flota--solo-admin)
5. [Módulo: Empleados](#5-módulo-empleados--solo-admin)
6. [Módulo: Tickets de Servicio](#6-módulo-tickets-de-servicio)
7. [Módulo: Servicios (Bitácora)](#7-módulo-servicios-bitácora--solo-admin)
8. [Módulo: Checklists](#8-módulo-checklists)
9. [Módulo: Seguimiento](#9-módulo-seguimiento--solo-admin)
10. [Módulo: Historial de Cambios](#10-módulo-historial-de-cambios--solo-admin)
11. [Módulo: Seguridad y Usuarios](#11-módulo-seguridad-y-usuarios--solo-admin)
12. [Módulo: Perfil de Usuario](#12-módulo-perfil-de-usuario)
13. [SIFY Copilot — Asistente de IA](#13-sify-copilot--asistente-de-ia)
14. [Seguridad de la Sesión](#14-seguridad-de-la-sesión)
15. [Preguntas Frecuentes](#15-preguntas-frecuentes)

---

## 1. Introducción

**SIFYGSA Fleet** es la plataforma digital corporativa diseñada para centralizar la gestión de la flota vehicular de SIFYGSA S.A. de C.V. Permite monitorear unidades, registrar mantenimientos, gestionar personal y generar reportes ejecutivos mediante un asistente de inteligencia artificial integrado.

### Roles del Sistema

| Rol | Descripción |
|---|---|
| **ADMIN** | Acceso completo. Puede administrar inventario, empleados, tickets, servicios, checklists, seguimiento, historial, seguridad y usuarios. |
| **USER** | Acceso limitado. Puede ver sus tickets, sus checklists asignados, su perfil y consultar el Copilot. |

> [!IMPORTANT]
> Todos los accesos son con correo corporativo (`@sifygsa.com` o el asignado por el administrador). El sistema cierra la sesión automáticamente por inactividad.

---

## 2. Acceso al Sistema (Login)

### 2.1 Iniciar Sesión

1. Abre el navegador y ve a **[fleet.sifygsa.com](https://fleet.sifygsa.com)**
2. Ingresa tu **Correo Corporativo** en el primer campo.
3. Ingresa tu **Contraseña** en el segundo campo.
   - Usa el ícono 👁️ para mostrar/ocultar la contraseña.
4. Haz clic en **"Iniciar Sesión"**.
5. Si las credenciales son correctas, el botón cambia a verde ✅ *"Autenticado"* y serás redirigido al Dashboard.

### 2.2 Recuperar Contraseña

Si olvidaste tu contraseña:

1. En la pantalla de login, haz clic en **"¿Olvidaste tu contraseña?"** (debajo del campo de contraseña).
2. Ingresa tu **correo corporativo** en el formulario de recuperación.
3. Haz clic en **"Recuperar Clave"**.
4. Recibirás un **acceso temporal** por correo electrónico.
5. Usa ese PIN temporal para ingresar y luego cambia tu contraseña desde tu Perfil.

> [!NOTE]
> El PIN temporal tiene una fecha de expiración. Si no lo usas a tiempo, deberás solicitar uno nuevo.

### 2.3 Errores Comunes en el Login

| Error | Solución |
|---|---|
| "Credenciales incorrectas" | Verifica que el correo y contraseña sean exactos. Revisa mayúsculas. |
| "Usuario inactivo" | Contacta al administrador del sistema para reactivar tu cuenta. |
| Página no carga | Verifica tu conexión a internet. Prueba con otro navegador. |

---

## 3. Panel Principal (Dashboard)

Al ingresar al sistema verás el **Panel Principal**. Este panel muestra diferentes elementos según tu rol.

### 3.1 Vista del Administrador (ADMIN)

El panel ADMIN muestra en la parte superior **3 indicadores KPI** animados:

| KPI | Descripción | Acción al hacer clic |
|---|---|---|
| 🚗 **Flota Total** | Número total de vehículos registrados | Ir a Inventario |
| 👥 **Personal Activo** | Total de empleados activos en el sistema | Ir a Directorio de Usuarios |
| 🔧 **Servicios Pendientes** | Tickets en estatus PENDIENTE | Ir a Servicios |

Debajo de los KPIs, verás un **menú de pestañas** con acceso rápido a los módulos principales:
- **Servicios** → Bitácora de mantenimientos
- **Flota** → Inventario de vehículos
- **Usuarios** → Gestión de personal
- **Checklists** → Inspecciones digitales

### 3.2 Vista del Usuario (USER)

El usuario estándar ve un panel simplificado con acceso a:
- Sus tickets propios
- Sus checklists asignados
- Su perfil personal
- El asistente SIFY Copilot

---

## 4. Módulo: Inventario de Flota *(Solo ADMIN)*

**Ruta:** `/dashboard/inventario`

Este módulo centraliza el registro completo de todas las unidades vehiculares de la corporación.

### 4.1 Información por Unidad

Cada vehículo registrado contiene los siguientes campos:

| Campo | Descripción |
|---|---|
| **Consecutivo** | ID único interno de la unidad (ej. `VSI-001`) |
| **Placa** | Número de placa oficial del vehículo |
| **Marca / Modelo / Color** | Especificaciones físicas del vehículo |
| **Línea** | Tipo de vehículo (Pick-Up, Sedán, Van, Camión, etc.) |
| **N.º de Serie** | Número de serie o VIN del vehículo |
| **Póliza de Seguro** | Número de póliza del seguro vigente |
| **Departamento** | Área corporativa a la que pertenece la unidad |
| **Contrato** | Número de contrato asociado |
| **Ubicación** | Base o sede donde opera el vehículo |
| **Encargado** | Email del empleado responsable de la unidad |
| **Estatus Operativo** | Estado actual: *Activo en flota, En mantenimiento, Baja temporal, etc.* |

### 4.2 Agregar una Unidad

1. En la vista de Inventario, haz clic en el botón **"+ Agregar Unidad"** o similar.
2. Completa todos los campos del formulario.
3. El campo **Consecutivo** es el identificador único — asegúrate de que no se repita.
4. Asigna un **Encargado** ingresando su correo corporativo.
5. Guarda los cambios. El registro quedará disponible inmediatamente.

### 4.3 Editar una Unidad

1. Localiza la unidad en la lista.
2. Haz clic en el ícono de edición ✏️.
3. Modifica los campos necesarios.
4. Guarda. El sistema registrará automáticamente el cambio en el **Historial**.

### 4.4 Estatus Operativo

Los estatus disponibles para una unidad son:

| Estatus | Significado |
|---|---|
| ✅ Activo en flota | El vehículo opera normalmente |
| 🔧 En mantenimiento | El vehículo está en servicio/taller |
| ⏸️ Baja temporal | El vehículo está fuera de operación temporalmente |
| ❌ Dado de baja | El vehículo fue retirado definitivamente de la flota |

### 4.5 Exportar Reporte de Inventario

El módulo permite exportar la lista completa de inventario en formato **Excel (.xlsx)** con formato corporativo (encabezados oscuros, auto-filtros, datos organizados). Haz clic en el botón de exportación 📊.

---

## 5. Módulo: Empleados *(Solo ADMIN)*

**Ruta:** `/dashboard/empleados`

Directorio corporativo con los perfiles detallados de todo el personal.

### 5.1 Información por Empleado

| Campo | Descripción |
|---|---|
| **Email** | Identificador único y correo de acceso al sistema |
| **Nombre / Apellidos** | Nombre completo del empleado |
| **Cargo** | Puesto o función en la empresa |
| **Departamento** | Área a la que pertenece |
| **Teléfonos** | Números de contacto asociados |
| **Rol** | `ADMIN` o `USER` — define los permisos en el sistema |
| **Estatus de Acceso** | `Activo` o `Inactivo` — controla si puede iniciar sesión |

### 5.2 Agregar un Empleado

1. Haz clic en **"+ Nuevo Empleado"**.
2. Completa el formulario con los datos del empleado.
3. Asigna el **Rol** correspondiente:
   - `ADMIN`: acceso total al sistema
   - `USER`: acceso restringido a sus módulos propios
4. El sistema enviará automáticamente las credenciales de acceso al correo del empleado.

### 5.3 Historial de Trayectoria

Cada empleado tiene un **historial de trayectoria** que registra automáticamente los cambios en:
- Cargo
- Departamento

Esto permite rastrear la evolución profesional del personal dentro de la organización.

---

## 6. Módulo: Tickets de Servicio

**Ruta ADMIN:** `/dashboard/tickets`
**Ruta USER:** `/dashboard/tickets` (solo los propios)

Sistema de solicitudes de mantenimiento vehicular con seguimiento en tiempo real.

### 6.1 Flujo de un Ticket

```
PENDIENTE → EN PROCESO → LISTO
```

| Estado | Descripción |
|---|---|
| 🟡 **PENDIENTE** | Solicitud creada, esperando atención |
| 🔵 **EN PROCESO** | El servicio está en ejecución |
| 🟢 **LISTO** | El servicio fue completado |

### 6.2 Crear un Ticket

1. Navega a **Servicios → Tickets** o **Mis Tickets**.
2. Haz clic en **"+ Nueva Solicitud"**.
3. Completa el formulario:
   - **Unidad (Consecutivo):** Selecciona el vehículo a intervenir.
   - **Tipo de Servicio:** Preventivo, Correctivo, Emergencia, etc.
   - **Descripción:** Detalla el problema o servicio requerido.
   - **Kilometraje actual** del vehículo.
   - **Lugar de la Cita:** Dirección del taller o concesionario.
   - **Asesor:** Nombre del asesor en el taller.
   - **Fecha y Hora de la Cita.**
   - **Teléfono del Asesor** (opcional).
   - **Link del Taller** (opcional).
4. Adjunta **evidencia fotográfica** si es necesario.
5. Envía la solicitud.

> [!TIP]
> El sistema puede enviar una notificación por correo con un archivo `.ics` para agregar la cita automáticamente al calendario (Outlook, Google Calendar).

### 6.3 Ver y Gestionar Tickets (ADMIN)

Los administradores pueden:
- Ver **todos** los tickets del sistema.
- Cambiar el **estatus** de un ticket (Pendiente → En Proceso → Listo).
- Ver las **evidencias** adjuntas.
- Agregar **notas de proceso** en el módulo de Seguimiento.
- Exportar la lista de tickets a **Excel**.

---

## 7. Módulo: Servicios (Bitácora) *(Solo ADMIN)*

**Ruta:** `/dashboard/servicios`

Registro histórico de todos los servicios realizados a cada unidad vehicular.

### 7.1 ¿Qué registra la Bitácora?

Cada entrada en la bitácora contiene:

| Campo | Descripción |
|---|---|
| **Unidad** | Consecutivo y placa del vehículo |
| **Kilometraje** | Lectura del odómetro al momento del servicio |
| **Descripción** | Detalle del trabajo realizado |
| **Fecha de Registro** | Cuándo se registró la entrada |
| **Estado** | Si el vehículo estaba operativo o no durante el servicio |

### 7.2 Agregar una Entrada a la Bitácora

1. Desde el módulo **Servicios**, selecciona la unidad.
2. Haz clic en **"+ Registrar Servicio"**.
3. Ingresa el kilometraje actual, descripción del servicio y estado del vehículo.
4. Guarda el registro.

### 7.3 Exportar Bitácora

El módulo permite exportar el historial completo de servicios a **Excel (.xlsx)** con formato corporativo.

---

## 8. Módulo: Checklists

**Ruta ADMIN:** `/dashboard/checklists`
**Ruta USER:** `/dashboard/mis-checklists`

Sistema de inspecciones digitales vinculadas al historial de cada unidad.

### 8.1 ¿Qué es un Checklist?

Un checklist es un **certificado de inspección en PDF** que se sube al sistema y queda vinculado permanentemente al historial de la unidad vehicular. Es el equivalente digital de las revisiones físicas de vehículos.

### 8.2 Subir un Checklist (ADMIN)

1. Navega a **Checklists** desde el menú.
2. Selecciona la unidad a la que pertenece la inspección.
3. Haz clic en **"+ Subir Checklist"**.
4. Asigna un **Título** descriptivo (ej. "Revisión preventiva Mayo 2026").
5. Adjunta el archivo **PDF** del checklist.
6. El sistema lo almacena en el servidor de archivos seguro (MinIO) y lo vincula al vehículo.

### 8.3 Ver Mis Checklists (USER)

Los usuarios con unidades asignadas pueden:
1. Navegar a **Mis Checklists**.
2. Ver la lista de inspecciones vinculadas a su unidad.
3. Descargar o visualizar los PDFs directamente desde el navegador.

---

## 9. Módulo: Seguimiento *(Solo ADMIN)*

**Ruta:** `/dashboard/seguimiento`

Panel de monitoreo de procesos operativos asociados a los tickets de servicio.

### 9.1 ¿Qué permite este módulo?

- Ver el **avance detallado** de cada ticket en ejecución.
- Agregar **notas de proceso** a un ticket (bitácora de gestión interna).
- Asignar o registrar qué **encargado** gestionó cada paso.
- Mantener un historial completo de la **cadena de responsabilidad**.

### 9.2 Agregar una Nota de Proceso

1. Abre el ticket desde el módulo de Seguimiento.
2. Haz clic en **"+ Agregar Proceso"**.
3. Ingresa el detalle de la acción realizada.
4. El sistema registra automáticamente la **fecha, hora y usuario** que hizo la anotación.

---

## 10. Módulo: Historial de Cambios *(Solo ADMIN)*

**Ruta:** `/dashboard/historial`

Registro de auditoría completo de todos los cambios realizados en el inventario vehicular.

### 10.1 ¿Qué registra el Historial?

Cada vez que un administrador modifica un vehículo en el inventario, el sistema registra automáticamente:

| Dato | Descripción |
|---|---|
| **Consecutivo** | Unidad modificada |
| **Campo cambiado** | Qué dato fue modificado (Placa, Marca, Modelo, Color, etc.) |
| **Usuario** | Quién realizó el cambio (email del administrador) |
| **Fecha y Hora** | Cuándo ocurrió el cambio |

> [!NOTE]
> Este módulo es de **solo lectura**. No es posible borrar el historial — es el registro de auditoría del sistema.

---

## 11. Módulo: Seguridad y Usuarios *(Solo ADMIN)*

**Ruta:** `/dashboard/seguridad` y `/dashboard/usuarios`

### 11.1 Gestión de Usuarios

Desde `/dashboard/usuarios` el administrador puede:

- **Ver** todos los empleados registrados en el sistema.
- **Crear** nuevas cuentas de acceso.
- **Editar** datos de perfil y rol.
- **Activar / Desactivar** cuentas (estatus de acceso).
- **Cambiar contraseñas** o generar PINs temporales.

### 11.2 Cambiar el Rol de un Usuario

1. Localiza al usuario en la lista.
2. Haz clic en **Editar**.
3. Cambia el campo **Rol** entre `ADMIN` y `USER`.
4. Guarda los cambios.

> [!WARNING]
> El cambio de rol es **instantáneo**. Si un usuario tiene sesión activa, el sistema lo detectará en tiempo real (cada 5 segundos) y lo expulsará automáticamente si su rol cambia.

### 11.3 Panel de Seguridad

Desde `/dashboard/seguridad` el administrador puede:

- Ver el **log de auditoría** de sesiones y accesos.
- Monitorear actividad sospechosa.
- Revisar el historial de inicios de sesión.

---

## 12. Módulo: Perfil de Usuario

**Ruta:** `/dashboard/perfil`

Disponible para **todos los roles**.

### 12.1 ¿Qué puedo ver en mi Perfil?

- Nombre completo y apellidos
- Correo corporativo
- Cargo y Departamento
- Teléfonos de contacto
- Historial de trayectoria (cambios de cargo/departamento)

### 12.2 Cambiar mi Contraseña

1. Ve a tu **Perfil**.
2. Busca la opción **"Cambiar Contraseña"**.
3. Ingresa tu contraseña actual.
4. Ingresa y confirma la nueva contraseña.
5. Guarda los cambios.

> [!TIP]
> Se recomienda cambiar la contraseña inmediatamente después de usar un PIN temporal de recuperación.

---

## 13. SIFY Copilot — Asistente de IA

El **SIFY Copilot** es el asistente de inteligencia artificial integrado en la plataforma. Aparece como un **botón flotante** en el dashboard (generalmente en la esquina inferior derecha).

### 13.1 ¿Cómo abrirlo?

Haz clic en el ícono del bot/chat flotante 🤖 en cualquier pantalla del dashboard. Se abrirá un panel de conversación.

### 13.2 ¿Qué puede hacer el Copilot?

| Capacidad | Ejemplo de consulta |
|---|---|
| **Búsqueda de unidades** | *"¿Dónde está la unidad VSI-011?"* |
| **Estado de la flota** | *"¿Cuántos vehículos están en mantenimiento?"* |
| **Resumen de tickets** | *"¿Cuántos tickets están pendientes esta semana?"* |
| **Filtros por área** | *"Lista las unidades del departamento de Logística"* |
| **Datos de empleados** | *"¿Quién es el encargado de la placa ABC-123?"* |
| **Generación de reportes Excel** | *"Genera un reporte Excel de toda la flota activa"* |
| **Descarga de documentos** | *"Descarga el checklist más reciente del VSI-005"* |

### 13.3 Cómo usar el Copilot paso a paso

1. Haz clic en el botón flotante del Copilot.
2. Escribe tu pregunta en lenguaje natural en español.
3. Presiona **Enter** o el botón de enviar.
4. El Copilot procesará la consulta y responderá en segundos.
5. Si el resultado incluye un **reporte Excel**, aparecerá un botón de descarga automáticamente.

### 13.4 Ejemplos de Consultas Útiles

```
"Dame un resumen del estado general de la flota"
"¿Cuántos vehículos tiene asignados el departamento de Ventas?"
"Genera un Excel con los tickets pendientes de este mes"
"Busca la unidad con placa XYZ-456"
"¿Cuál es el historial de servicios del consecutivo VSI-020?"
```

> [!NOTE]
> El Copilot trabaja directamente con la base de datos en tiempo real. Toda la información que entrega es la misma que está registrada en el sistema al momento de la consulta.

---

## 14. Seguridad de la Sesión

### 14.1 Cierre Automático por Inactividad

El sistema cuenta con un temporizador de inactividad. Si no realizas ninguna acción durante un período definido, la sesión se cerrará automáticamente y serás redirigido al login.

**Recomendación:** Si vas a dejar tu equipo sin atención, cierra sesión manualmente usando el botón de **Logout** en el menú lateral.

### 14.2 Verificación de Rol en Tiempo Real

Cada **5 segundos**, el sistema verifica que tu rol no haya cambiado. Si un administrador modifica tu rol o desactiva tu cuenta mientras tienes sesión activa:

1. Aparecerá una **pantalla de notificación animada** sobre la interfaz.
2. Serás redirigido automáticamente al login.
3. Necesitarás contactar al administrador para recuperar el acceso.

### 14.3 Cómo Cerrar Sesión

1. Busca el botón **"Cerrar Sesión"** o **"Logout"** en el menú lateral o superior.
2. Haz clic en él.
3. La sesión se destruye del servidor y serás enviado al login.

> [!CAUTION]
> Nunca compartas tu contraseña. Cada sesión está vinculada a tu usuario y todas las acciones quedan registradas con tu nombre en el historial de auditoría.

---

## 15. Preguntas Frecuentes

### ¿Por qué no puedo ver el módulo de Inventario?
Tu cuenta tiene rol **USER**. El inventario es exclusivo del rol **ADMIN**. Contacta a tu administrador si crees que necesitas acceso.

### ¿Cómo sé a qué unidad estoy asignado?
Ve a **Mis Checklists** — ahí verás los vehículos vinculados a tu perfil. También puedes preguntarle al **SIFY Copilot**: *"¿Qué unidad tengo asignada?"*

### El Copilot no responde, ¿qué hago?
1. Verifica tu conexión a internet.
2. Recarga la página (F5).
3. Si el problema persiste, contacta al administrador — puede haber un problema temporal con el servicio de IA.

### ¿Cómo descargo un reporte de la flota completa?
Desde el módulo de **Inventario**, usa el botón de exportación. Alternativamente, pregúntale al **Copilot**: *"Genera un Excel con todo el inventario de flota activa"*.

### ¿Puedo acceder desde mi celular?
Sí. La plataforma es **responsive** y funciona desde cualquier navegador moderno en dispositivos móviles. Se recomienda Chrome o Safari actualizados.

### ¿Qué hago si olvidé mi correo corporativo?
Contacta directamente al administrador del sistema para que verifique tu cuenta registrada.

### ¿Mis cambios se guardan automáticamente?
No. La mayoría de los formularios requieren que hagas clic en **"Guardar"** o **"Confirmar"** explícitamente. Los cambios no guardados se perderán si navegas a otra sección.

---

## Contacto y Soporte

Para soporte técnico o dudas sobre el sistema:

| Canal | Información |
|---|---|
| **Administrador del Sistema** | Contacta al responsable de TI de tu área |
| **Plataforma en producción** | [fleet.sifygsa.com](https://fleet.sifygsa.com) |
| **Empresa** | SIFYGSA S.A. de C.V. |

---

*© 2026 SIFYGSA S.A. de C.V. — SIFYGSA Fleet Control de Flotas v2.0. Todos los derechos reservados.*

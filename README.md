# SIFYGSA Fleet — Control de Flotas v2.0

![SIFYGSA Logo](public/logo.png)

### **Plataforma Integral de Gestión Vehicular con Inteligencia Artificial**

**SIFYGSA Fleet** es una solución empresarial de alto nivel diseñada para centralizar, optimizar y monitorear operativamente las unidades vehiculares de SIFYGSA S.A. de C.V. La plataforma proporciona una experiencia de *"Control Room"*, integrando reportes automáticos, un robusto motor de seguridad y un Asistente de IA (Copilot) que opera directamente sobre la base de datos de la empresa.

> **Producción:** [cloud.sifygsa.com](https://cloud.sifygsa.com)

---

## 🏗 Arquitectura y Stack Tecnológico Expandido

La plataforma fue diseñada bajo una arquitectura moderna híbrida (SSR / CSR) garantizando la máxima seguridad, rendimiento y escalabilidad corporativa.

### Core & Framework
*   **Next.js 16 (App Router):** Framework principal. Utiliza *Server Components* para reducir el bundle JS del lado del cliente y *Client Components* para interactividad dinámica.
*   **React 19:** Aprovechamiento de transiciones de estado concurrentes y nuevos hooks.
*   **TypeScript:** Modo estricto habilitado en todo el proyecto para seguridad de tipado end-to-end.

### Base de Datos & ORM
*   **PostgreSQL 15:** Motor de base de datos relacional principal.
*   **Prisma ORM:** Cliente tipado para interactuar con la base de datos.
    *   **Modelo de Datos:** 10 entidades principales gestionando Empleados, Inventario Vehicular (F&G, VSI, AVH, etc.), Tickets de Servicio, Costos de Mantenimiento, Historiales (Log de auditoría) y Checklists.

### Inteligencia Artificial (SIFY Copilot)
*   **Groq API (Llama 3.3 70B Versatile):** Motor LLM principal elegido por su extrema latencia baja y alto rendimiento.
*   **Tool Calling (Function Calling):** El Copilot interactúa de forma determinista con la base de datos a través de *tools* (Ej. `get_fleet_report`, `get_unit_details`).
*   **Generación de Documentos Dinámica:** Transformación transparente de respuestas JSON del LLM hacia archivos `.xlsx` usando **ExcelJS**, aplicando aplanamiento de datos y diseño corporativo en tiempo real.

### Seguridad Perimetral y Autenticación
*   **CSP & Middleware:** Inyección dinámica de un **Nonce Criptográfico** (`crypto.randomUUID()`) en cada petición para bloquear scripts no autorizados y prevenir ataques XSS.
*   **RoleGuard Activo:** *Polling* automático en segundo plano (`RoleGuard.tsx`) que revoca el acceso y destruye la sesión instantáneamente si se detecta un cambio de rol administrativo en vivo.
*   **Control de Inactividad:** Cierre automático de sesión tras 15 minutos (`IdleTimer.tsx`).
*   **Criptografía:** `bcryptjs` (factor 12) para contraseñas. Implementación de una "doble cerradura" de seguridad mediante PIN temporal de un solo uso para recuperaciones de cuenta.

### Almacenamiento Distribuido (Archivos)
*   **MinIO (S3 Compatible):** Servidor de almacenamiento de objetos independiente que gestiona todos los archivos pesados (evidencias fotográficas y archivos PDF de checklists), reduciendo la carga del backend de Node.js.

### UI / UX y Diseño
*   **Tailwind CSS v4:** Manejo de diseño a través de variables CSS globales, logrando dos temas corporativos:
    *   **Tema Midnight (Login):** Fondos `slate-900`, blobs animados de colores y estilo "Glassmorphism" con desenfoques.
    *   **Tema Cream (Dashboard):** Entorno de trabajo profesional (`#FDFBF7`) de alta legibilidad.
*   **Iconografía y Visuales:** **Lucide React** y efectos cinemáticos de carga (`animate-entrance-overlay`).
*   **PDFs:** Integración de `@react-pdf/renderer` y `html2canvas` para generación de documentos.

---

## 🧩 Módulos del Sistema

La plataforma adapta su interfaz en base al nivel de autorización (`ADMIN` / `USER`):

| Módulo | Descripción |
|---|---|
| **📦 Inventario de Flota** | Altas, bajas, y edición de parque vehicular. Incluye rastreo de número de serie, pólizas y estatus operativo. |
| **👥 Configuración y Usuarios** | Directorio corporativo, asignaciones de vehículos a empleados e historial de trayectoria de personal. |
| **🎫 Central de Servicios** | Programación de citas a taller, seguimiento de fallas y actualización de estatus (`PENDIENTE`, `EN PROCESO`, `LISTO`). |
| **💵 Control de Costos** | (Admin) Auditoría financiera de mantenimientos, desglosando Mano de Obra, Refacciones y Proveedores. |
| **📋 Checklists PDF** | Expedientes digitales. Se adjuntan archivos PDF al historial específico de cada unidad. |
| **🤖 SIFY Copilot** | Asistente de IA residente en el dashboard capaz de analizar el estado operativo global y exportar reportes. |

---

## 🚀 Despliegue e Instalación (Docker)

El proyecto está dockerizado para asegurar su correcta ejecución en cualquier entorno de producción.

### Requisitos Previos
- Docker y Docker Compose
- Node.js 24 (si se ejecuta en desarrollo local sin Docker)

### Instalación Rápida

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-org/sifygsa-fleet.git
   cd sifygsa-fleet
   ```

2. **Configurar el entorno:**
   Crea tu archivo `.env` basado en el `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Asegúrate de llenar credenciales para PostgreSQL, Groq API, MinIO y Nodemailer.*

3. **Despliegue con Docker Compose:**
   ```bash
   docker-compose up --build -d
   ```
   *El contenedor `sifygsa_web` se encargará automáticamente de ejecutar `prisma generate` y `prisma db push` antes de iniciar el servidor.*

4. **Acceso:**
   La aplicación estará disponible en `http://localhost:3000`.

---

## 📜 Scripts de Desarrollo Local

Si prefieres correr el proyecto fuera de Docker (para desarrollo):

| Comando | Acción |
|---|---|
| `npm install` | Instala todas las dependencias. |
| `npx prisma generate` | Genera los tipos de datos del ORM. |
| `npx prisma db push` | Sincroniza el esquema de BD sin generar migraciones. |
| `npx prisma db seed` | (Opcional) Prueba la base de datos inicial. |
| `npm run dev` | Levanta el servidor de Next.js en modo desarrollo. |
| `npm run build` | Construye el empaquetado para producción. |

---

## 🔒 Licencia

© 2026 **SIFYGSA S.A. de C.V.** — Todos los derechos reservados.
Desarrollo orientado a la gestión de flotas y mantenimiento preventivo corporativo.

## Diseñando E implementado por:
**Mike Mendez Carmona**
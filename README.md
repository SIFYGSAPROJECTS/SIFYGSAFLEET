# SIFYGSA Fleet — Control de Flotas v2.0

![SIFYGSA Logo](public/logo.png)

### **Plataforma Integral de Gestión Vehicular con Inteligencia Artificial**

**SIFYGSA Fleet** es una solución empresarial diseñada para centralizar, optimizar y monitorear operativamente las unidades vehiculares de la corporación SIFYGSA S.A. de C.V. La plataforma ofrece una experiencia de *"Control Room"* de alto nivel con un asistente de IA integrado, generación de reportes automatizada, y un sistema de seguridad robusto en tiempo real.

> **Producción:** [fleet.sifygsa.com](https://fleet.sifygsa.com)

---

## Módulos del Sistema

La plataforma opera a través de módulos estratégicos diferenciados por rol (`ADMIN` / `USER`):

### Panel Administrativo (ADMIN)

| Módulo | Descripción |
|---|---|
| **📦 Inventario** | Gestión completa de unidades: Consecutivo, Placa, Marca, Modelo, Color, Línea, N.º de Serie, Póliza de Seguro, Ubicación, Departamento y Contrato. |
| **👥 Empleados** | Directorio corporativo con perfiles detallados, historial de trayectoria y asignación de responsabilidades. |
| **🎫 Tickets** | Sistema de solicitudes de mantenimiento con estados en tiempo real (Pendiente → En Proceso → Listo). |
| **🔧 Servicios** | Bitácora de servicios con seguimiento de kilometraje y descripción detallada por unidad. |
| **📋 Checklists** | Inspecciones digitales con almacenamiento de certificados PDF (vía MinIO) vinculados al historial del vehículo. |
| **📊 Seguimiento** | Monitoreo de procesos operativos con detalle de avances y asignación de encargados por ticket. |
| **📜 Historial** | Registro de cambios en el inventario con trazabilidad completa (quién, cuándo, qué cambió). |
| **🔒 Seguridad** | Gestión de usuarios, control de acceso y auditoría de sesiones activas. |
| **🤖 SIFY Copilot** | Asistente de IA para consultas de flota, análisis de datos y generación de reportes Excel bajo demanda. |

### Panel de Usuario (USER)

| Módulo | Descripción |
|---|---|
| **🎫 Mis Tickets** | Creación y seguimiento de solicitudes de mantenimiento propias. |
| **📋 Mis Checklists** | Visualización de inspecciones asignadas a las unidades del usuario. |
| **👤 Perfil** | Consulta de información personal y datos de contacto. |
| **🤖 SIFY Copilot** | Acceso al asistente de IA para consultas rápidas sobre la flota. |

---

## SIFY Copilot — Asistente de IA

El sistema integra un asistente conversacional inteligente accesible desde un botón flotante en el dashboard:

- **Modelo:** Llama 3.1 8B (vía [Groq](https://groq.com/) API) con soporte para *Tool Calling*.
- **Capacidades:**
  - Consultas en lenguaje natural sobre inventario, empleados, tickets y servicios.
  - Búsqueda de unidades por placa o consecutivo.
  - Resúmenes de estado de flota con conteos por estatus operativo.
  - Filtrado dinámico por empresa, departamento, ubicación y estado de asignación.
  - Generación automática de **reportes Excel (.xlsx)** con formato profesional (cabeceras Midnight Blue, auto-filtros, datos aplanados).
  - Descarga de documentos (PDFs de checklists, evidencias de tickets).
- **Arquitectura:** Server Action → Groq Tool Calling → Prisma Queries → ExcelJS → Base64 al cliente.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI** | [React 19](https://react.dev/) + [Lucide React](https://lucide.dev/) |
| **Estilos** | [Tailwind CSS 4](https://tailwindcss.com/) — Tema *"Cream"* con variables CSS personalizadas |
| **Tipografía** | [Inter](https://fonts.google.com/specimen/Inter) (sans) + [Newsreader](https://fonts.google.com/specimen/Newsreader) (serif) + Geist Mono |
| **ORM** | [Prisma](https://www.prisma.io/) (PostgreSQL) |
| **Base de Datos** | [PostgreSQL 15](https://www.postgresql.org/) (Easypanel) |
| **IA** | [Groq](https://groq.com/) API — Llama 3.1 8B Instant (Tool Calling) |
| **Reportes** | [ExcelJS](https://www.npmjs.com/package/exceljs) — Generación de `.xlsx` con formato corporativo |
| **Almacenamiento** | [MinIO](https://min.io/) (SSL) — Checklists PDF y evidencias |
| **Auth** | Cookies + [BCrypt.js](https://www.npmjs.com/package/bcryptjs) + JWT Middleware |
| **Email** | [Nodemailer](https://www.npmjs.com/package/nodemailer) — Notificaciones de citas y taller |
| **PDFs** | [@react-pdf/renderer](https://react-pdf.org/) — Generación de reportes visuales |
| **Infraestructura** | [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) |

---

## Seguridad

La plataforma implementa un modelo de seguridad multicapa:

| Mecanismo | Implementación |
|---|---|
| **Content Security Policy** | Nonce dinámico por request (CSP estricta con `strict-dynamic`) |
| **CORS** | Validación de origen contra whitelist (`fleet.sifygsa.com`, `localhost:3000`) |
| **Autenticación** | Cookies HTTP-Only con verificación en middleware |
| **RoleGuard** | Componente en tiempo real que verifica el rol cada 5s y expulsa al usuario si cambia (con overlay animado) |
| **IdleTimer** | Cierre automático de sesión por inactividad |
| **Encriptación** | BCrypt.js para passwords + PIN temporal con expiración |
| **Headers HTTP** | `X-Frame-Options: DENY`, `HSTS`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `CORP` |

---

## Estructura del Proyecto

```
sifygsa-fleet/
├── app/
│   ├── api/
│   │   ├── ai/chat/           # API del Copilot (Groq + Tool Calling)
│   │   ├── auth/              # Login, check-role, cambio de contraseña
│   │   ├── checklists/        # CRUD de inspecciones
│   │   ├── empleados/         # CRUD de empleados
│   │   ├── evidencia/         # Subida de evidencias (MinIO)
│   │   ├── tickets/           # CRUD de solicitudes
│   │   ├── vehiculos/         # CRUD de inventario
│   │   ├── seguridad/         # Logs de auditoría
│   │   └── logout/            # Destrucción de sesión
│   ├── dashboard/
│   │   ├── inventario/        # Módulo de inventario
│   │   ├── empleados/         # Módulo de empleados
│   │   ├── servicios/         # Bitácora de servicios
│   │   ├── tickets/           # Sistema de tickets
│   │   ├── checklists/        # Inspecciones (Admin)
│   │   ├── mis-checklists/    # Inspecciones (User)
│   │   ├── seguimiento/       # Seguimiento de procesos
│   │   ├── historial/         # Historial de cambios
│   │   ├── seguridad/         # Panel de seguridad
│   │   ├── perfil/            # Perfil de usuario
│   │   └── usuarios/          # Gestión de usuarios
│   ├── page.tsx               # Login (Tema Midnight)
│   └── globals.css            # Design tokens Cream + animaciones
├── components/
│   ├── ai/
│   │   └── CopilotChat.tsx    # Widget flotante del asistente IA
│   ├── security/
│   │   ├── RoleGuard.tsx      # Verificación de rol en tiempo real
│   │   └── IdleTimer.tsx      # Cierre por inactividad
│   └── ui/
│       ├── SystemModal.tsx    # Modal reutilizable del sistema
│       ├── PremiumSelect.tsx  # Select estilizado premium
│       └── DarkModeToggle.tsx # Toggle de modo oscuro
├── lib/
│   ├── ai/
│   │   ├── ai-actions.ts      # 18 funciones de consulta a BD para el Copilot
│   │   └── excel-generator.ts # Generación de Excel con ExcelJS
│   ├── db.ts                  # Cliente Prisma singleton
│   └── minio.ts               # Cliente MinIO
├── prisma/
│   ├── schema.prisma          # 9 modelos de datos
│   └── seed.ts                # Datos iniciales de prueba
├── middleware.ts               # CSP, CORS, auth guard
├── docker-compose.yml          # PostgreSQL + Next.js
├── Dockerfile                  # Node 24 + Prisma
└── next.config.ts              # Headers de seguridad + dominios permitidos
```

---

## Base de Datos

- **Motor:** PostgreSQL 15
- **ORM:** Prisma con 9 modelos relacionales
- **Alcance:** Gestión de personal, inventario vehicular, bitácora de servicios, tickets de mantenimiento, inspecciones digitales, seguimiento de procesos y auditoría de cambios.
- **Esquema:** Documentado internamente en `/prisma/schema.prisma`

---

## Instalación y Configuración

### Opción 1: Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/sifygsa-fleet.git
cd sifygsa-fleet

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL, Groq, MinIO, etc.

# 3. Levantar el entorno completo
docker-compose up --build
```

> La aplicación estará disponible en `http://localhost:3000`

### Opción 2: Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma y sincronizar esquema
npx prisma generate
npx prisma db push

# 3. (Opcional) Poblar datos de prueba
npx prisma db seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno Requeridas

| Variable | Descripción |
|---|---|
| `POSTGRES_PRISMA_URL` | URL de conexión a PostgreSQL (pooling) |
| `POSTGRES_URL_NON_POOLING` | URL de conexión directa (migraciones) |
| `GROQ_API_KEY` | API Key de Groq para el Copilot IA |
| `MINIO_ENDPOINT` | Endpoint del servidor MinIO |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Credenciales de MinIO |
| `EMAIL_USER` / `EMAIL_PASSWORD` | Credenciales SMTP para notificaciones |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase (almacenamiento complementario) |

---

## Tema Visual

La plataforma utiliza un sistema de diseño dual:

- **Login:** Tema *Midnight* — fondo oscuro `#0f172a`, acentos dorados `#fcd34d`.
- **Dashboard:** Tema *Cream* — fondo cálido `#FDFBF7`, superficies flotantes `#EAE4D9`, hover `#DCD3C1`.
- **Animación de Entrada:** Efecto *"Crystallization"* — transición cinemática de 2s con blur, brightness y saturación progresiva.
- **Tipografía:** Inter (interfaz) + Newsreader (títulos serif) + Geist Mono (datos técnicos).

---

## Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Next.js 16) |
| `npm run build` | Build de producción (`prisma generate` + `next build`) |
| `npm run start` | Servidor de producción (`0.0.0.0:3000`) |
| `npm run lint` | Linting con ESLint |

---

## Licencia

© 2026 SIFYGSA S.A. de C.V. — Todos los derechos reservados.

Propiedad intelectual orientada a la gestión de flotas corporativas.

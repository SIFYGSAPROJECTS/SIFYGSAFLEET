# SIFYGSA Control de Flotas v2.0

![SIFYGSA Logo](public/logo.png)

### **Plataforma Integral de Gestión Vehicular y Diagnóstico Predictivo**

**SIFYGSA Control de Flotas** es una solución empresarial avanzada diseñada para centralizar, optimizar y monitorear operativamente las unidades vehiculares de la corporación. Desde el control de inventarios hasta el mantenimiento predictivo, la plataforma ofrece una experiencia de "Control Room" de alto nivel.

---

## Características Principales

La plataforma está dividida en módulos estratégicos para garantizar una gestión 360°:

*   **Gestión de Inventario:** Control detallado de cada unidad (Placa, Marca, Modelo, Color, Línea, Número de Serie y Póliza).
*   **Mantenimiento Predictivo:** Bitácora de servicios automatizada con seguimiento de kilometraje para recomendaciones preventivas.
*   **Inspecciones Digitales (Checklists):** Generación y almacenamiento de certificados de inspección en formato PDF integrados con el historial del vehículo.
*   **Sistema de Tickets:** Gestión de solicitudes de soporte y mantenimiento con estados en tiempo real (Pendiente, En Proceso, Finalizado).
*   **Seguimiento en Tiempo Real:** Monitoreo detallado de procesos operativos y asignación de encargados por unidad.
*   **Seguridad Avanzada:** Control de acceso basado en roles (Admin/User), verificación de sesiones en tiempo real y encriptación de credenciales.
*   **Gestión de Empleados:** Directorio corporativo con perfiles detallados y asignación de responsabilidades.

---

## Stack Tecnológico

Desarrollado con las tecnologías más modernas para garantizar escalabilidad, velocidad y una experiencia de usuario premium:

*   **Frontend:** [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
*   **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Base de Datos:** [PostgreSQL](https://www.postgresql.org/)
*   **Infraestructura:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
*   **Almacenamiento:** [MinIO](https://min.io/) / Sistema de archivos local para reportes
*   **Utilidades:** Nodemailer (Notificaciones), BCrypt.js (Seguridad), React-PDF (Generación de Reportes)

---

## Instalación y Configuración

### Opción 1: Docker (Recomendado)

La forma más rápida de levantar el entorno completo (App + DB):

1.  Copia el archivo `.env.example` a `.env` y configura tus variables.
2.  Ejecuta el siguiente comando:
    ```bash
    docker-compose up --build
    ```
    *La aplicación estará disponible en `http://localhost:3000`.*

### Opción 2: Desarrollo Local

Si prefieres ejecutarlo sin Docker:

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Configurar Base de Datos:**
    Asegúrate de tener PostgreSQL corriendo y configura el `DATABASE_URL` en tu `.env`. Luego sincroniza el esquema:
    ```bash
    npx prisma generate
    npx prisma db push
    ```
3.  **Iniciar Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```

---

## Estructura del Proyecto

*   `/app`: Rutas principales y lógica del Dashboard.
*   `/components`: Componentes de UI reutilizables y lógica de visualización.
*   `/prisma`: Esquema de la base de datos y migraciones.
*   `/public`: Recursos estáticos (Logos, imágenes, SVG dinámicos).
*   `/lib`: Utilidades, controladores de base de datos y lógica de servidor.
*   `/api`: Endpoints para autenticación y gestión de datos.

---

## Seguridad y Privacidad

El sistema implementa:
- **Middleware de Autenticación:** Verificación constante de JWT y roles.
- **CSP (Content Security Policy):** Protección contra ataques XSS.
- **Rate Limiting:** Prevención de ataques de fuerza bruta en el login.
- **Validación de Roles:** Los usuarios solo acceden a los módulos permitidos según su cargo.

---

## Licencia

© 2026 SIFYGSA. Todos los derechos reservados.
Propiedad intelectual orientada a la gestión de flotas corporativas.

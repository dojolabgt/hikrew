<div align="center">
  <img src="./assets/HiKrewLogo.png" alt="Krew Logo" width="200" height="auto" />
  <h1>HI KREW 🚀</h1>
  <p>
    <b>The All-in-One Operating System for Freelancers & Agencies</b>
  </p>
  <p>
    Hi Krew es una plataforma SaaS diseñada para revolucionar cómo los creativos y profesionales independientes gestionan sus negocios. Desde la prospección de clientes y envío de cotizaciones, hasta la facturación y colaboración B2B en proyectos compartidos.
  </p>
</div>

---

## 🛠 Tech Stack

El proyecto está construido sobre una arquitectura moderna, escalable y robusta, separando el cliente y la API para garantizar un alto rendimiento.

<div align="center">
  
  ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  
  ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
  ![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

  ![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
  ![Shadcn/UI](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
  
</div>

---

## ✨ Módulos Principales (Core Features)

La arquitectura de Krew está dividida en módulos de dominio altamente cohesionados para reflejar el ciclo de vida real de un proyecto freelance:

### 🏢 Workspaces (Multitenancy)
El corazón de la plataforma. Cada usuario opera dentro de un `Workspace` aislado que maneja su propia configuración regional:
- Formatos de moneda y zonas horarias personalizadas.
- Gestión de impuestos (tax inclusive/exclusive pricing).
- Suscripciones (Integración nativa con **Recurrente** para planes Krew Pro/Premium).

### 💼 Deals Pipeline
Un flujo de ventas completo y profesional para cerrar más clientes:
- **Briefs:** Plantillas personalizables para levantar requerimientos.
- **Quotations:** Creación de cotizaciones dinámicas con opciones A/B para el cliente.
- **Payment Plans:** Definición de hitos de pago (Milestones) una vez que se aprueba la propuesta.
- **Enlaces Públicos:** URLs seguras (vía public tokens) para que los clientes revisen y aprueben las propuestas sin necesidad de crear una cuenta.

### 🚀 Projects
Conversión automática de un `Deal` ganado a un proyecto activo.
- Gestión de entregables y seguimiento de estado.
- Sincronización con el plan de pagos previamente aprobado.

### 🤝 B2B Connections (La Red Freelance)
Krew no es solo un CRM, es una red profesional:
- Los Workspaces en planes Pro pueden generar enlaces de invitación o enviar correos a otros profesionales.
- Al aceptar una conexión, los Workspaces pueden colaborar e invitarse mutuamente a sus `Projects` (subcontratación o trabajo en equipo).

---

## 🏛 Arquitectura del Monorepo

El repositorio está estructurado para mantener una separación limpia de responsabilidades:

```bash
KREW/
├── backend/                # API RESTful en NestJS
│   ├── src/
│   │   ├── auth/           # Autenticación JWT y Guards
│   │   ├── billing/        # Webhooks e integración con Recurrente
│   │   ├── connections/    # Lógica de invitaciones B2B
│   │   ├── deals/          # Pipeline de ventas y propuestas
│   │   ├── projects/       # Gestión de proyectos y colaboradores
│   │   └── workspaces/     # Multitenancy y configuraciones
│   └── ...
├── frontend-app/           # Aplicación principal SaaS (Dashboard) en Next.js
│   ├── src/app/
│   │   ├── (freelancer)/   # Vistas protegidas del usuario
│   │   ├── (client)/       # Vistas públicas de propuestas para clientes
│   └── ...
└── frontend-public/        # Landing page y web promocional

----

<center>Diseñado y construido con ❤️ por Eklista</center>

----
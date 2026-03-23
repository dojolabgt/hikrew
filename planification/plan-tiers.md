# HiKrew — Estrategia de Planes: Free · Pro · Premium

> **Fecha:** 2026-03-23
> **Versión:** 2.0

---

## Filosofía de diseño

### FREE — "Funcional con fricción inteligente"
- Es el plan por defecto de **todos los usuarios al registrarse**. Gratis para siempre.
- No es un trial ni un plan especial de admin. Es el plan real.
- Tiene suficiente poder para hacer trabajo real, pero con fricciones que hacen que el upgrade valga la pena.
- **Ganchos orgánicos deliberados:**
  - Puede **recibir** conexiones de otros workspaces (no enviar). Esto alimenta el crecimiento orgánico de la plataforma.
  - Al recibir una conexión puede **invitar a esa persona a proyectos** — el core colaborativo funciona.
  - Tiene **2 brief templates** para hacer el flujo completo de deals, pero debe editarlos manualmente en cada proyecto. La fricción de editar cada vez es el gancho para PRO.

### PRO — "El freelancer que creció"
- Para freelancers activos que ya tienen cartera y quieren flujos profesionales sin fricciones.
- Límites generosos pero finitos. Todo lo esencial.
- Puede **enviar** conexiones activamente (networking activo).

### PREMIUM — "El estudio / agencia"
- Para quienes manejan equipos, múltiples proyectos simultáneos, reportes financieros.
- Sin límites operativos. Features avanzados de equipo y finanzas.

---

## Tabla comparativa general

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Precio** | Gratis (siempre) | Pago mensual/anual | Pago mensual/anual |
| **Asignación** | Auto (registro) | Self-service | Self-service |

---

## 1. MÓDULO: DEALS

El módulo central. Los límites aquí son el driver principal de upgrade.

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Deals activos simultáneos** | 5 | 25 | ∞ |
| **Opciones de cotización por deal (A/B)** | 1 | 3 | ∞ |
| **Ítems por cotización** | 15 | 100 | ∞ |
| **Brief Templates propios** | **2** (módulo completo) | 15 | ∞ |
| **Password en link público del deal** | ✗ | ✓ | ✓ |
| **Fecha de validez de propuesta** | ✗ | ✓ | ✓ |
| **Términos de propuesta personalizados** | ✗ | ✓ | ✓ |
| **Plan de pagos con milestones** | 1 milestone | 8 milestones | ∞ |
| **Milestone Splits (distribución a colaboradores)** | ✗ | ✗ | ✓ |
| **Generación de PDF de cotización** | 5 / mes | 60 / mes | ∞ |

### Lógica del hook de brief templates en FREE

El usuario FREE **puede crear y editar sus propios templates** — ve el módulo completo y real. El límite es solo numérico: **máximo 2 templates**.

- Puede crear 2 templates completamente personalizados.
- Al intentar crear el tercero → upgrade prompt.
- El gancho: ve el valor real del módulo, lo usa, lo personaliza, y cuando quiere escalar (múltiples proyectos, múltiples tipos de cliente) necesita más templates → PRO.
- No se usan templates del sistema predefinidos — eso ocultaría el módulo real y generaría fricción falsa.

### Reglas de negocio

```
- POST deal: verificar deals activos <= límite del plan
- POST quotation option: verificar opciones <= límite | bloquear A/B si FREE
- POST brief-templates: verificar count < 2; si >= 2 → 403 PLAN_LIMIT_REACHED
- PATCH brief-templates: permitir siempre (solo editar los existentes)
- password + validUntil + proposalTerms: limpiar/ignorar al guardar si plan = FREE
- POST PDF: incrementar contador mensual; rechazar si excede límite
- POST milestone: verificar count <= límite del plan
```

---

## 2. MÓDULO: CONNECTIONS (el gancho orgánico)

Este es el módulo de mayor impacto en la estrategia de crecimiento. El FREE puede **ser descubierto y conectado** pero no puede hacer outreach activo.

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Recibir invitaciones de conexión** | ✓ | ✓ | ✓ |
| **Aceptar conexión entrante** | ✓ | ✓ | ✓ |
| **Enviar invitaciones de conexión** | ✗ | ✓ | ✓ |
| **Invitar una conexión aceptada a un proyecto** | ✓ | ✓ | ✓ |
| **Conexiones activas máximas** | 5 (solo recibidas) | 30 | ∞ |
| **Ver perfil de workspaces conectados** | ✓ | ✓ | ✓ |

### Por qué funciona este modelo

- Un usuario PRO o PREMIUM envía una conexión a un freelancer FREE → el FREE puede aceptar y colaborar.
- El freelancer FREE queda expuesto al valor de la red y colaboración.
- Cuando quiere hacer outreach propio (buscar colaboradores, subcontratar) → necesita PRO.
- El límite de 5 conexiones recibidas evita abuso sin bloquear el flujo orgánico normal.

### Reglas de negocio

```
- POST /connections/invite: bloquear si plan = FREE (no puede enviar)
- POST /connections/link: bloquear si plan = FREE
- POST /connections/public/:token/accept: permitir siempre (puede recibir)
- Al aceptar: si plan = FREE, verificar conexiones aceptadas <= 5
- POST /projects/:id/collaborators (workspace externo): permitir si existe conexión aceptada
```

---

## 3. MÓDULO: PROJECTS

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Proyectos activos simultáneos** | 3 | 15 | ∞ |
| **Colaboradores por proyecto (workspaces conectados)** | 2 | 8 | ∞ |
| **Project Briefs por proyecto** | 2 | 10 | ∞ |
| **Client uploads (portal del cliente)** | ✗ | ✓ | ✓ |
| **Google Drive por proyecto** | ✗ | ✓ | ✓ |
| **Generación de PDFs de proyecto** | 3 / mes | 30 / mes | ∞ |

### Reglas de negocio

```
- POST /projects: verificar proyectos ACTIVE <= límite del plan
- POST /projects/:id/collaborators: verificar count <= límite
- POST /projects/:id/briefs: verificar count <= límite
- clientUploadsEnabled = true: bloquear si plan = FREE
- Creación de carpeta Drive en proyecto: omitir si plan = FREE
```

---

## 4. MÓDULO: CLIENTS

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Clientes en base de datos** | 15 | 200 | ∞ |
| **Invitación al portal de cliente** | ✗ | ✓ | ✓ |
| **Notes por cliente** | ✓ | ✓ | ✓ |
| **Campos de identificación fiscal** | Básico (1 campo) | Completo | Completo |

### Reglas de negocio

```
- POST /clients: verificar total <= límite del plan
- POST /clients/:id/invite: bloquear si plan = FREE
```

---

## 5. MÓDULO: SERVICES (Catálogo)

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Servicios en catálogo** | 10 | 75 | ∞ |
| **Imagen por servicio** | ✗ | ✓ | ✓ |
| **Términos específicos por servicio** | ✗ | ✓ | ✓ |
| **Costo interno / margen** | ✗ | ✓ | ✓ |
| **SKU** | ✗ | ✓ | ✓ |

### Reglas de negocio

```
- POST /services: verificar total activos <= límite
- imageUrl upload: bloquear si plan = FREE
- specificTerms + internalCost + sku: limpiar al guardar si plan = FREE
```

---

## 6. MÓDULO: WORKSPACES

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Miembros internos del workspace** | 1 (solo owner) | 4 miembros | ∞ |
| **Monedas configuradas** | 1 | 5 | ∞ |
| **Impuestos configurados** | 1 | 8 | ∞ |
| **Logo del workspace** | ✗ | ✓ | ✓ |
| **Color de marca (brandColor)** | ✗ | ✓ | ✓ |
| **Términos de propuesta por defecto** | ✗ | ✓ | ✓ |
| **Precio inclusivo de impuesto** | ✗ | ✓ | ✓ |
| **Tax Reporting mensual** | ✗ | ✗ | ✓ |
| **Integración Recurrente (cobros propios)** | ✗ | ✓ | ✓ |

### Reglas de negocio

```
- POST /workspaces/current/logo: bloquear si plan = FREE
- PATCH /workspaces/current (brandColor): ignorar si plan = FREE
- GET|POST /workspaces/current/recurrente: bloquear si plan = FREE
- POST /workspace-members: verificar count <= límite del plan
- Al agregar moneda: verificar count <= límite
- Al agregar tax: verificar count <= límite
```

---

## 7. MÓDULO: GOOGLE DRIVE

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Conectar Google Drive** | ✗ | ✓ | ✓ |
| **Carpeta automática por proyecto** | ✗ | ✓ | ✓ |
| **Upload / gestión de archivos** | ✗ | ✓ | ✓ |

### Reglas de negocio

```
- Todos los endpoints /google-drive: bloquear con 403 si plan = FREE
```

---

## 8. MÓDULO: PORTAL (Cliente)

| Feature | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Portal activo (cliente puede ver deal)** | ✓ | ✓ | ✓ |
| **Client uploads desde portal** | ✗ | ✓ | ✓ |
| **Password en link del deal** | ✗ | ✓ | ✓ |

---

## 9. BILLING

| Aspecto | FREE | PRO | PREMIUM |
|---|:---:|:---:|:---:|
| **Asignación** | Automática al registrarse | Self-service pago | Self-service pago |
| **Aparece como opción en pricing** | Sí (plan base siempre visible) | Sí | Sí |
| **Cancelar PRO/PREMIUM** | N/A | Vuelve a FREE | Vuelve a FREE |

---

## 10. RESUMEN DE LÍMITES — Constantes para código

```typescript
// src/billing/plan-limits.constants.ts

export const PLAN_LIMITS = {
  FREE: {
    // Deals
    activeDeals: 5,
    quotationOptions: 1,
    quotationItems: 15,
    briefTemplates: 2,           // propios, módulo completo visible
    canCreateOwnTemplates: true,
    pdfsPerMonth: 5,
    milestoneItems: 1,
    // Projects
    activeProjects: 3,
    collaboratorsPerProject: 2,
    projectBriefs: 2,
    // Clients & Services
    clients: 15,
    services: 10,
    // Workspace
    workspaceMembers: 1,
    currencies: 1,
    taxes: 1,
    // Connections
    connections: 5,              // solo recibidas
    canSendConnections: false,
    // Feature flags
    googleDrive: false,
    recurrente: false,
    clientUploads: false,
    passwordProtectedDeals: false,
    brandCustomization: false,
    milestoneSplits: false,
    taxReporting: false,
    proposalTerms: false,
    internalCost: false,
    abQuotations: false,
    clientPortalInvite: false,
    serviceImages: false,
  },

  PRO: {
    // Deals
    activeDeals: 25,
    quotationOptions: 3,
    quotationItems: 100,
    briefTemplates: 15,
    canCreateOwnTemplates: true,
    pdfsPerMonth: 60,
    milestoneItems: 8,
    // Projects
    activeProjects: 15,
    collaboratorsPerProject: 8,
    projectBriefs: 10,
    // Clients & Services
    clients: 200,
    services: 75,
    // Workspace
    workspaceMembers: 4,
    currencies: 5,
    taxes: 8,
    // Connections
    connections: 30,
    canSendConnections: true,
    // Feature flags
    googleDrive: true,
    recurrente: true,
    clientUploads: true,
    passwordProtectedDeals: true,
    brandCustomization: true,
    milestoneSplits: false,
    taxReporting: false,
    proposalTerms: true,
    internalCost: true,
    abQuotations: true,
    clientPortalInvite: true,
    serviceImages: true,
  },

  PREMIUM: {
    // Deals
    activeDeals: Infinity,
    quotationOptions: Infinity,
    quotationItems: Infinity,
    briefTemplates: Infinity,
    canCreateOwnTemplates: true,
    pdfsPerMonth: Infinity,
    milestoneItems: Infinity,
    // Projects
    activeProjects: Infinity,
    collaboratorsPerProject: Infinity,
    projectBriefs: Infinity,
    // Clients & Services
    clients: Infinity,
    services: Infinity,
    // Workspace
    workspaceMembers: Infinity,
    currencies: Infinity,
    taxes: Infinity,
    // Connections
    connections: Infinity,
    canSendConnections: true,
    // Feature flags
    googleDrive: true,
    recurrente: true,
    clientUploads: true,
    passwordProtectedDeals: true,
    brandCustomization: true,
    milestoneSplits: true,
    taxReporting: true,
    proposalTerms: true,
    internalCost: true,
    abQuotations: true,
    clientPortalInvite: true,
    serviceImages: true,
  },
} as const;
```

---

## 11. IMPLEMENTACIÓN TÉCNICA — Fases

### Fase 1 — Infraestructura base (no rompe nada)

- [ ] Crear `PlanLimitService` en `src/billing/plan-limits.service.ts`
  - Inyectar en servicios que necesiten validar límites
  - Métodos: `getLimit(plan, feature)`, `assertLimit(workspaceId, feature)`, `hasFeature(plan, feature)`
- [ ] Crear constante `PLAN_LIMITS` (ver sección 10)
- [ ] Crear guard `@RequiresFeature('googleDrive')` para bloqueos de features booleanas
- [ ] Definir tipo de error estándar `PlanLimitException` con campos: `code`, `feature`, `current`, `limit`, `currentPlan`, `requiredPlan`

### Fase 2 — Bloqueos críticos (impacto directo en negocio)

- [ ] **Deals:** límite activos + A/B options + brief templates (crear/guardar)
- [ ] **Connections:** bloquear envío en FREE (`POST /connections/invite`, `POST /connections/link`)
- [ ] **Projects:** límite activos + Google Drive
- [ ] **Recurrente:** bloquear setup en FREE

### Fase 3 — Bloqueos secundarios

- [ ] **Services:** límite catálogo + imagen + internalCost
- [ ] **Clients:** límite + portal invite
- [ ] **Workspaces:** logo + brandColor + workspace members + monedas + taxes
- [ ] **Google Drive:** todos los endpoints

### Fase 4 — Features exclusivas PREMIUM

- [ ] **Milestone Splits:** verificar plan = PREMIUM antes de crear splits
- [ ] **Tax Reporting:** endpoint de reporte mensual detrás de plan = PREMIUM

### Fase 5 — Downgrade graceful (al cancelar PRO → FREE)

- Deals activos > 5: marcar excedentes como `DRAFT` (sin borrar)
- Proyectos activos > 3: marcar excedentes como `SUSPENDED` (sin borrar)
- Conexiones enviadas > 5: mantener existentes, bloquear nuevas
- Templates propios > 2: los existentes se mantienen visibles (no borrar), bloquear creación de nuevos
- Google Drive: desconectar tokens, carpetas externas intactas

---

## 12. MENSAJES DE ERROR ESTÁNDAR

```typescript
// Feature bloqueada por plan
{
  "statusCode": 403,
  "code": "FEATURE_NOT_AVAILABLE",
  "feature": "connections.send",
  "currentPlan": "FREE",
  "requiredPlan": "PRO",
  "message": "Enviar conexiones está disponible desde el plan Pro."
}

// Límite numérico alcanzado
{
  "statusCode": 403,
  "code": "PLAN_LIMIT_REACHED",
  "feature": "activeDeals",
  "current": 5,
  "limit": 5,
  "currentPlan": "FREE",
  "requiredPlan": "PRO",
  "message": "Alcanzaste el límite de 5 deals activos. Actualiza a Pro para hasta 25 deals activos."
}

// Límite de brief templates en FREE
{
  "statusCode": 403,
  "code": "PLAN_LIMIT_REACHED",
  "feature": "briefTemplates",
  "current": 2,
  "limit": 2,
  "currentPlan": "FREE",
  "requiredPlan": "PRO",
  "message": "Alcanzaste el límite de 2 brief templates. Actualiza a Pro para crear hasta 15."
}
```

---

---

## 13. TABLA COMPARATIVA COMPLETA

| | **FREE** | **PRO** | **PREMIUM** |
|---|:---:|:---:|:---:|
| **Precio** | Gratis | Pago mensual/anual | Pago mensual/anual |
| | | | |
| **DEALS** | | | |
| Deals activos simultáneos | 5 | 25 | ∞ |
| Opciones de cotización por deal (A/B) | 1 | 3 | ∞ |
| Ítems por cotización | 15 | 100 | ∞ |
| Brief Templates propios | 2 | 15 | ∞ |
| Password en link público del deal | ✗ | ✓ | ✓ |
| Fecha de validez de propuesta | ✗ | ✓ | ✓ |
| Términos de propuesta personalizados | ✗ | ✓ | ✓ |
| Milestones por plan de pago | 1 | 8 | ∞ |
| Milestone Splits (distribución a equipo) | ✗ | ✗ | ✓ |
| PDFs de cotización / mes | 5 | 60 | ∞ |
| | | | |
| **PROJECTS** | | | |
| Proyectos activos simultáneos | 3 | 15 | ∞ |
| Colaboradores por proyecto | 2 | 8 | ∞ |
| Project Briefs por proyecto | 2 | 10 | ∞ |
| Client uploads desde portal | ✗ | ✓ | ✓ |
| Google Drive por proyecto | ✗ | ✓ | ✓ |
| PDFs de proyecto / mes | 3 | 30 | ∞ |
| | | | |
| **CONNECTIONS** | | | |
| Recibir conexiones entrantes | ✓ | ✓ | ✓ |
| Enviar invitaciones de conexión | ✗ | ✓ | ✓ |
| Invitar conexión a proyectos | ✓ | ✓ | ✓ |
| Conexiones activas máximas | 5 | 30 | ∞ |
| | | | |
| **CLIENTS** | | | |
| Clientes en base de datos | 15 | 200 | ∞ |
| Invitación al portal de cliente | ✗ | ✓ | ✓ |
| Notes por cliente | ✓ | ✓ | ✓ |
| Campos de identificación fiscal | Básico | Completo | Completo |
| | | | |
| **SERVICES** | | | |
| Servicios en catálogo | 10 | 75 | ∞ |
| Imagen por servicio | ✗ | ✓ | ✓ |
| Términos específicos por servicio | ✗ | ✓ | ✓ |
| Costo interno / margen | ✗ | ✓ | ✓ |
| SKU | ✗ | ✓ | ✓ |
| | | | |
| **WORKSPACE** | | | |
| Miembros internos del workspace | 1 | 4 | ∞ |
| Monedas configuradas | 1 | 5 | ∞ |
| Impuestos configurados | 1 | 8 | ∞ |
| Logo del workspace | ✗ | ✓ | ✓ |
| Color de marca | ✗ | ✓ | ✓ |
| Términos de propuesta por defecto | ✗ | ✓ | ✓ |
| Precio inclusivo de impuesto | ✗ | ✓ | ✓ |
| Tax Reporting mensual | ✗ | ✗ | ✓ |
| Integración Recurrente (cobros propios) | ✗ | ✓ | ✓ |
| | | | |
| **GOOGLE DRIVE** | | | |
| Conectar Google Drive | ✗ | ✓ | ✓ |
| Carpeta automática por proyecto | ✗ | ✓ | ✓ |
| Upload y gestión de archivos | ✗ | ✓ | ✓ |
| | | | |
| **PORTAL (cliente)** | | | |
| Portal activo (cliente ve el deal) | ✓ | ✓ | ✓ |
| Client uploads desde portal | ✗ | ✓ | ✓ |
| Password en link del deal | ✗ | ✓ | ✓ |

---

*HiKrew Platform — Plan Tiers v2 — Marzo 2026*

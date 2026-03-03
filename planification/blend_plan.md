# Blend — Implementation Plan

> **Plataforma de cobros, cotizaciones y servicios para agencias y freelancers en Centroamérica**
>
> Stack: NestJS + PostgreSQL + TypeORM + Recurrente

---

## El negocio en una línea

Blend cobra suscripción a los espacios de trabajo (Workspaces). Los usuarios cobran a sus clientes usando su propia cuenta Recurrente conectada a su Workspace en Blend. Los profesionales pueden invitar a colaboradores a sus espacios para trabajar juntos y repartir ganancias.

---
## COMPLETADO
## Roles y Permisos

### Roles de Aplicación (Globales) 

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Dueño del SaaS — acceso total |
| `SUPPORT` | Soporte — acceso limitado a workspaces y estados |
| `USER` | Usuario principal (Freelancer/Agencia) |
| `CLIENT` | Cliente final — dashboard read-only |

### Roles de Workspace (Locales)

| Rol | Descripción |
|-----|-------------|
| `OWNER` | Dueño del Workspace (El que paga y administra claves) |
| `COLLABORATOR` | Miembro del equipo (Ej. diseñador junior de la agencia) |
| `GUEST` | Colaborador externo invitado por Magic Token a un proyecto/cobro |

---

## COMPLETADO
## Fase 0 — Fundación: Arquitectura Multi-Tenant

> ⚠️ No construyas ningún feature hasta que esto esté resuelto.

### Infraestructura base

- Configuración de roles globales y locales
- Migrations configuradas correctamente, sin `synchronize: true`
- Interceptor global de errores con formato consistente
- Logger estructurado (no `console.log`)
- Swagger habilitado desde el inicio
- `.env.example` completo y actualizado

### Utilidades core

- `EncryptionService` — AES-256-GCM. Usado para API keys de Recurrente
- `TokenService` — generar y validar tokens con expiración (invitaciones, public tokens)
- `PaginationDto` — estandarizar paginación en todos los listados
- `ApiResponseInterceptor` — formato de respuesta consistente

### Workspaces (El Tenant Principal)

```
Workspace
  - id
  - businessName, logo, brandColor
  - recurrentePublicKey  (encriptado)
  - recurrentePrivateKey (encriptado)
  - plan: free | pro | premium
  - planExpiresAt
  - quotesThisMonth, quotesMonthReset
  - isActive
  - createdAt, updatedAt

WorkspaceMember
  - id
  - userId
  - workspaceId
  - role: owner | collaborator | guest
```

- `register()` crea el User, genera un Workspace por defecto y crea el WorkspaceMember con rol `OWNER`.
- **Regla de Negocio:** Un usuario solo puede ser `OWNER` de 1 Workspace (su negocio principal), pero puede ser `COLLABORATOR` o `GUEST` en múltiples Workspaces de terceros.

**Endpoints:**
- `GET /workspaces` — Devuelve los workspaces a los que pertenece el usuario.
- `PATCH /workspaces/:id` — Actualiza branding (Solo OWNER).
- `PATCH /workspaces/:id/recurrente-keys` — Guarda keys encriptadas.
- **Guard/Interceptor `x-workspace-id`:** Inyecta el tenant en todas las peticiones para aislar datos.

---

## COMPLETADO
## Fase 1 — Servicios y Clientes

### Services

```
Service
  - id, workspaceId
  - name, description
  - defaultPrice, currency (GTQ | USD)
  - category, isActive
  - createdAt, updatedAt
```

- CRUD estándar protegido por el `WorkspaceGuard`. Filtrado automático por `workspaceId`.
- `DELETE /services/:id` — soft delete si tiene quotes asociadas.

### Clients

```
Client
  - id, workspaceId
  - linkedUserId (nullable, por si el cliente crea cuenta)
  - name, email, whatsapp, notes
  - inviteToken (nullable), inviteExpiresAt
  - inviteStatus: pending | accepted | null
  - createdAt, updatedAt
```

- `GET /clients/:id/history` — cotizaciones + pagos del cliente en ese workspace.
- `POST /clients/:id/invite` — genera token, envía email con link de registro.

### LimitsGuard (Por Workspace)

| Plan | Límites |
|------|---------|
| `free` | 5 clientes, 10 cotizaciones/mes |
| `pro` | Clientes ilimitados, 500 cotizaciones/mes |
| `premium` | Ilimitado + módulos extra + colaboradores |

- Cron job mensual para reset de `quotesThisMonth` en la tabla Workspaces.

---

## Fase 2 — Cotizaciones y PDF

### Quotes

```
Quote
  - id, workspaceId, clientId
  - status: draft | sent | accepted | rejected | expired
  - validUntil, notes, internalNotes, currency
  - subtotal, taxPercent, taxAmount, total
  - publicToken (uso único, para aceptar sin login)
  - sentAt, acceptedAt, rejectedAt

QuoteItem
  - id, quoteId, serviceId (nullable)
  - description, quantity, unitPrice, total, order
```

- CRUD de Quotes asociado al `workspaceId`.
- `POST /quotes/:id/send` — genera `publicToken`, envía email al cliente.
- `POST /public/quotes/:token/accept` — cliente acepta sin login vía link.
- `GET /quotes/:id/pdf` — Genera PDF con logo y `brandColor` del Workspace.

---

## Fase 3 — Pagos con Recurrente

### RecurrenteModule (wrapper interno)

- Recibe `workspaceId`, busca el Workspace y desencripta keys en memoria.
- Incluye metadata: `{ workspaceId, paymentId, context: blend_payment }` en los checkouts.

### Payments

```
Payment
  - id, workspaceId, clientId, quoteId (nullable)
  - recurrenteCheckoutId, recurrenteCheckoutUrl
  - amount, currency
  - status: pending | paid | failed | refunded
  - dueDate, paidAt, reminderSentAt
```

- `POST /payments` — crea Payment local + genera checkout en Recurrente.
- `POST /payments/:id/remind` — reenvía recordatorio (solo pro/premium).

### Webhook

- `POST /webhooks/recurrente` — Endpoint público para Recurrente.
  - Verificar firma con `RECURRENTE_WEBHOOK_SECRET`.
  - Leer `metadata.context` y `metadata.workspaceId`.
  - Actualizar `Payment.status`.

---

## Fase 4 — Colaboración y Equipos (El Magic Token)

### Invitaciones a Workspaces

- `POST /workspaces/:id/invites` — (Solo Premium/Pro). Invita a un correo. Crea token.
- `POST /invites/accept/:token` — El usuario (nuevo o existente) acepta y se inserta en `WorkspaceMember` como `COLLABORATOR` o `GUEST`.

### CollaborationSplit (Reparto de ganancias)

```
CollaborationSplit
  - id, workspaceId, paymentId
  - collaboratorUserId
  - revenuePercent
  - ownerAmount, collaboratorAmount (calculados al pagar)
  - status: assigned | completed
```

- `POST /payments/:id/assign-split` — El Owner asigna una parte del pago a un Guest/Collaborator.
- El cobro principal va al Recurrente del Owner. Blend solo lleva el tracking financiero de quién le debe a quién.
  > _Ejemplo: De Q1,000 → Agencia recibe Q700, Freelancer Externo Q300_

---

## Fase 5 — Billing (Blend cobra al SaaS)

> Blend usa sus propias keys maestras de Recurrente, no las del usuario.

### BillingSubscription

```
BillingSubscription
  - id, workspaceId
  - recurrenteCheckoutId, recurrenteSubscriptionId
  - plan: pro | premium
  - status, currentPeriodStart, currentPeriodEnd
```

- `POST /billing/subscribe` — Genera checkout de suscripción de Blend.
- `POST /webhooks/recurrente/billing` — Escucha pagos de suscripción y actualiza el plan del Workspace.

---

## Fase 6 — Dashboard del Workspace

**`GET /workspaces/:id/summary`**

```json
{
  "pendingPayments": { "count": 0, "total": 0 },
  "paidThisMonth": { "count": 0, "total": 0 },
  "pendingQuotes": { "count": 0 },
  "topClients": [{ "name": "", "totalPaid": 0 }],
  "teamSummary": [{ "name": "", "role": "", "assignedAmount": 0 }],
  "planStatus": { "plan": "", "quotesThisMonth": 0, "renewsAt": "" }
}
```

---

## Fase 7 — Dashboard del Cliente

- Vista Read-Only de Quotes y Payments donde el email del cliente coincida.
- Acceso a botones directos de pago de Recurrente.

---

## Fase 8 — Admin Panel (SuperAdmin)

### Métricas SaaS

- MRR, ARR, Workspaces Activos (Por plan: Free, Pro, Premium)
- Churn Rate, Volumen procesado global

### Gestión

- `GET /admin/workspaces` — Ver todos los negocios registrados.
- `PATCH /admin/workspaces/:id/plan` — Upgrade/Downgrade manual.
- `PATCH /admin/users/:id/suspend` — Banear usuarios problemáticos.

---
## COMPLETADO
## Fase 0.5: Refactor Multi-Tenant ✅

### Backend
- [x] Eliminar `FreelancerProfile`.
- [x] Crear `Workspace` y tabla pivote `WorkspaceMember`.
- [x] Actualizar Auth (`register`) para que cree el Usuario y su Workspace nativo en 1 transacción.
- [x] Crear Guard/Interceptor `x-workspace-id`.

### Frontend
- [x] `AuthContext` ahora maneja `activeWorkspaceId`.
- [x] Cliente API inyecta header `x-workspace-id` automáticamente.
- [x] UI limpia: Ocultar selector de Workspaces si el usuario solo pertenece a 1 (su propio negocio).

---

## Fase 9 — Notificaciones y Automatizaciones

### Emails transaccionales

- Invitaciones a colaborar en un Workspace
- Cotización enviada / Link de pago generado
- Comprobante de pago (Recibo interno de Blend)

### Automatizaciones (Pro/Premium)

- Módulo n8n / Zapier vía Webhooks expuestos por Blend
- Recordatorios de pago a los 3 y 7 días de vencimiento

---

## Orden de Ejecución Recomendado

| # | Fase | Descripción |
|---|------|-------------|
| 0 | Fundación | Refactor Multi-tenant, Auth, Workspaces, Guardias *(En progreso)* |
| 1 | Servicios | CRUD |
| 2 | Cotizaciones | Quotes + PDF + flujo de aprobación dual |
| 3 | Pagos | RecurrenteModule + Payments + webhooks |
| 4 | Colaboración | Invitaciones + CollaborationSplit |
| 5 | Billing | Blend cobra suscripción al Workspace |
| 6 | Dashboard FR | Resumen del Workspace |
| 7 | Dashboard Client | Vista del cliente |
| 8 | Admin Panel | Métricas + gestión |
| 9 | Automatizaciones | Emails + n8n webhooks + recordatorios |
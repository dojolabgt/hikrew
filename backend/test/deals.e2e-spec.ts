/* eslint-disable */
/**
 * Deals Module — E2E Test Suite
 *
 * Tests the full lifecycle of a deal:
 *   1. Setup  (user, workspace, client, service — seeded directly via repositories)
 *   2. Brief Templates CRUD
 *   3. Deals CRUD
 *   4. Quotations CRUD
 *   5. Quotation Items (manual + service snapshot + immutability)
 *   6. Payment Plan + Milestones CRUD
 *   7. Status transitions (WON)
 *   8. Quotation deletion
 *   9. Deal deletion
 *  10. Authorization isolation
 *  11. Cleanup (afterAll)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { WorkspacesService } from '../src/workspaces/workspaces.service';
import { UserRole } from '../src/auth/constants/roles';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../src/clients/client.entity';
import { Service } from '../src/services/service.entity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractAuthCookie(res: any): string {
    const cookies = res.headers['set-cookie'] as unknown as string[];
    if (!cookies) throw new Error('No cookies returned from login');
    const auth = cookies.find((c: string) => c.startsWith('Authentication='));
    if (!auth) throw new Error('No Authentication cookie found');
    return auth.split(';')[0];
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Deals Module (e2e)', () => {
    let app: INestApplication;

    // Services
    let usersService: UsersService;
    let workspacesService: WorkspacesService;
    let clientsRepo: Repository<Client>;
    let servicesRepo: Repository<Service>;

    // Auth
    let authCookie: string;
    let anotherAuthCookie: string;

    // IDs to clean up after suite
    let userId: string;
    let anotherUserId: string;
    let workspaceId: string;
    let clientId: string;
    let serviceId: string;

    // Resource IDs accumulated across tests
    let dealId: string;
    let dealToDeleteId: string;
    let templateId: string;
    let quotationId: string;
    let quotationId2: string;
    let itemId: string;
    let itemIdFromService: string;
    let milestoneId: string;

    // ── App Setup ──────────────────────────────────────────────────────────────

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
        );
        await app.init();

        usersService = app.get(UsersService);
        workspacesService = app.get(WorkspacesService);
        clientsRepo = app.get(getRepositoryToken(Client));
        servicesRepo = app.get(getRepositoryToken(Service));

        const ts = Date.now();

        // ── Main user ──
        const user = await usersService.create({
            email: `deals_owner_${ts}@test.com`,
            password: 'TestDeals123!',
            firstName: 'Deals',
            lastName: 'Owner',
            role: UserRole.FREELANCER,
        } as any);
        userId = user.id;

        const workspace = await workspacesService.createDefaultWorkspace(userId);
        workspaceId = workspace.id;

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: `deals_owner_${ts}@test.com`, password: 'TestDeals123!' })
            .expect(200);
        authCookie = extractAuthCookie(loginRes);

        // ── Second user (isolation tests) ──
        const user2 = await usersService.create({
            email: `deals_other_${ts}@test.com`,
            password: 'TestDeals123!',
            firstName: 'Other',
            lastName: 'User',
            role: UserRole.FREELANCER,
        } as any);
        anotherUserId = user2.id;
        await workspacesService.createDefaultWorkspace(anotherUserId);

        const loginRes2 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: `deals_other_${ts}@test.com`, password: 'TestDeals123!' })
            .expect(200);
        anotherAuthCookie = extractAuthCookie(loginRes2);

        // ── Seed Client ──
        const client = clientsRepo.create({
            name: 'Acme Corp',
            email: `acme_${ts}@test.com`,
            workspace: { id: workspaceId } as any,
        });
        const savedClient = await clientsRepo.save(client);
        clientId = savedClient.id;

        // ── Seed Service ──
        const service = servicesRepo.create({
            workspaceId,
            name: 'Diseño UI/UX',
            description: 'Servicio de diseño de interfaces',
            basePrice: { USD: 1500.00, GTQ: 11000.00 },
            chargeType: 'ONE_TIME' as any,
            unitType: 'PROJECT' as any,
            isTaxable: true,
            internalCost: 600.00,
        } as any);
        const savedService = await servicesRepo.save(service) as any;
        serviceId = savedService.id;

        // ── Pre-create a deal for deletion tests (to avoid shared state contamination) ──
        const dealRes = await request(app.getHttpServer())
            .post(`/workspaces/${workspaceId}/deals`)
            .set('Cookie', [authCookie])
            .send({ title: 'Deal temporal para eliminar', clientId })
            .expect(201);
        dealToDeleteId = dealRes.body.id;
    });

    // ── Teardown ───────────────────────────────────────────────────────────────

    afterAll(async () => {
        if (userId) await usersService.remove(userId).catch(() => { });
        if (anotherUserId) await usersService.remove(anotherUserId).catch(() => { });
        await app.close();
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 1: BRIEF TEMPLATES
    // ══════════════════════════════════════════════════════════════════════════

    describe('Brief Templates', () => {
        it('POST /brief-templates — creates a template', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/brief-templates`)
                .set('Cookie', [authCookie])
                .send({
                    name: 'Plantilla Branding',
                    description: 'Cuestionario para proyectos de branding',
                    schema: [
                        { id: 'q1', type: 'text', label: '¿Cuál es tu visión de marca?' },
                        { id: 'q2', type: 'text', label: '¿Quién es tu público objetivo?' },
                    ],
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Plantilla Branding');
            expect(res.body.schema).toHaveLength(2);
            templateId = res.body.id;
        });

        it('GET /brief-templates — lists workspace templates', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/brief-templates`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            const found = res.body.find((t: any) => t.id === templateId);
            expect(found).toBeDefined();
        });

        it('GET /brief-templates/:id — returns single template', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/brief-templates/${templateId}`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(res.body.id).toBe(templateId);
        });

        it('PATCH /brief-templates/:id — updates template name', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/brief-templates/${templateId}`)
                .set('Cookie', [authCookie])
                .send({ name: 'Plantilla Branding (v2)' })
                .expect(200);

            expect(res.body.name).toBe('Plantilla Branding (v2)');
        });

        it('PATCH /brief-templates/:id — 404 for non-existent template', () => {
            return request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/brief-templates/00000000-0000-0000-0000-000000000000`)
                .set('Cookie', [authCookie])
                .send({ name: 'Ghost' })
                .expect(404);
        });

        it('GET /brief-templates — 200 (empty) for wrong/non-existent workspace', () => {
            return request(app.getHttpServer())
                .get(`/workspaces/00000000-0000-0000-0000-000000000000/deals/brief-templates`)
                .set('Cookie', [authCookie])
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual([]);
                });
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 2: DEALS CRUD
    // ══════════════════════════════════════════════════════════════════════════

    describe('Deals CRUD', () => {
        it('POST /deals — 401 without auth', () => {
            return request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals`)
                .send({ title: 'Unauthorized Deal', clientId })
                .expect(401);
        });

        it('POST /deals — creates a deal', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals`)
                .set('Cookie', [authCookie])
                .send({
                    title: 'Campaña 360 para Acme',
                    clientId,
                    notes: 'Notas internas del freelancer',
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Campaña 360 para Acme');
            expect(res.body.status).toBe('DRAFT');
            expect(res.body.currentStep).toBe('brief');
            expect(res.body.notes).toBe('Notas internas del freelancer');
            dealId = res.body.id;
        });

        it('POST /deals — 400 when title missing', () => {
            return request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals`)
                .set('Cookie', [authCookie])
                .send({ clientId })
                .expect(400);
        });

        it('POST /deals — 400 when clientId missing', () => {
            return request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals`)
                .set('Cookie', [authCookie])
                .send({ title: 'Sin cliente' })
                .expect(400);
        });

        it('POST /deals — 404 when client not in workspace', () => {
            return request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals`)
                .set('Cookie', [authCookie])
                .send({ title: 'Bad Client', clientId: '00000000-0000-0000-0000-000000000000' })
                .expect(404);
        });

        it('GET /deals — lists deals for workspace', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            const found = res.body.find((d: any) => d.id === dealId);
            expect(found).toBeDefined();
            expect(found.client).toBeDefined();
        });

        it('GET /deals/:id — returns full deal with relations', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(res.body.id).toBe(dealId);
            expect(res.body.client).toHaveProperty('id', clientId);
            expect(res.body.quotations).toEqual(expect.any(Array));
        });

        it('GET /deals/:id — 404 for non-existent deal', () => {
            return request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/00000000-0000-0000-0000-000000000000`)
                .set('Cookie', [authCookie])
                .expect(404);
        });

        it('GET /deals/:id — deals list scoped to owning workspace', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals`)
                .set('Cookie', [authCookie])
                .expect(200);
            // All returned deals belong to our workspace
            res.body.forEach((d: any) => {
                expect(d.workspaceId).toBe(workspaceId);
            });
        });

        it('PATCH /deals/:id — updates name, notes, and currentStep', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}`)
                .set('Cookie', [authCookie])
                .send({
                    name: 'Campaña 360 — Versión Final',
                    notes: 'Actualización de notas internas',
                    currentStep: 'quotation',
                })
                .expect(200);

            expect(res.body.name).toBe('Campaña 360 — Versión Final');
            expect(res.body.notes).toBe('Actualización de notas internas');
            expect(res.body.currentStep).toBe('quotation');
        });

        it('PATCH /deals/:id — sets status to SENT and records sentAt', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}`)
                .set('Cookie', [authCookie])
                .send({ status: 'SENT' })
                .expect(200);

            expect(res.body.status).toBe('SENT');
            expect(res.body.sentAt).not.toBeNull();
        });

        it('PATCH /deals/:id — 400 for invalid status value', () => {
            return request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}`)
                .set('Cookie', [authCookie])
                .send({ status: 'invalid_status' })
                .expect(400);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 3: QUOTATIONS
    // ══════════════════════════════════════════════════════════════════════════

    describe('Quotations', () => {
        it('POST /quotations — creates Opción Básica', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .send({ optionName: 'Opción Básica' })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.optionName).toBe('Opción Básica');
            expect(res.body.isApproved).toBe(false);
            expect(Number(res.body.total)).toBe(0);
            quotationId = res.body.id;
        });

        it('POST /quotations — creates second quotation (auto-named)', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .send({})
                .expect(201);

            expect(res.body.optionName).toMatch(/Opción/);
            quotationId2 = res.body.id;
        });

        it('GET /quotations — lists all quotations for the deal', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(2);
        });

        it('PATCH /quotations/:qId — updates description', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}`)
                .set('Cookie', [authCookie])
                .send({ description: 'Paquete básico para branding' })
                .expect(200);

            expect(res.body.description).toBe('Paquete básico para branding');
        });

        it('PATCH /quotations/:qId — approves first quotation', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}`)
                .set('Cookie', [authCookie])
                .send({ isApproved: true })
                .expect(200);

            expect(res.body.isApproved).toBe(true);
        });

        it('PATCH — approving q2 un-approves q1 (only one approved at a time)', async () => {
            await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId2}`)
                .set('Cookie', [authCookie])
                .send({ isApproved: true })
                .expect(200);

            const list = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .expect(200);

            const q1 = list.body.find((q: any) => q.id === quotationId);
            expect(q1.isApproved).toBe(false);

            // Re-approve first quotation for remaining tests
            await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}`)
                .set('Cookie', [authCookie])
                .send({ isApproved: true });
        });

        it('GET /quotations — each quotation includes items array', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .expect(200);
            res.body.forEach((q: any) => {
                expect(Array.isArray(q.items)).toBe(true);
            });
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 4: QUOTATION ITEMS
    // ══════════════════════════════════════════════════════════════════════════

    describe('Quotation Items', () => {
        it('POST /items — adds a manual item', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}/items`)
                .set('Cookie', [authCookie])
                .send({
                    name: 'Estrategia Digital',
                    description: 'Plan estratégico completo',
                    price: 800,
                    quantity: 2,
                    chargeType: 'ONE_TIME',
                    isTaxable: true,
                    discount: 0,
                })
                .expect(201);

            // Returns the updated quotation with recalculated totals
            expect(res.body).toHaveProperty('items');
            expect(res.body.items.length).toBeGreaterThan(0);
            expect(Number(res.body.subtotal)).toBeGreaterThan(0);
            // subtotal = 800 * 2 = 1600
            expect(Number(res.body.subtotal)).toBe(1600);

            const addedItem = res.body.items.find((i: any) => i.name === 'Estrategia Digital');
            expect(addedItem).toBeDefined();
            itemId = addedItem.id;
        });

        it('POST /items — adds item from service catalog (snapshot)', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}/items`)
                .set('Cookie', [authCookie])
                .send({ serviceId })
                .expect(201);

            const items: any[] = res.body.items;
            const snapshotItem = items.find((i: any) => i.serviceId === serviceId);

            expect(snapshotItem).toBeDefined();
            expect(snapshotItem.name).toBe('Diseño UI/UX');
            expect(Number(snapshotItem.price)).toBe(1500);
            expect(snapshotItem.chargeType).toBe('ONE_TIME');
            expect(snapshotItem.unitType).toBe('PROJECT');
            expect(Number(snapshotItem.internalCost)).toBe(600);
            expect(snapshotItem.isTaxable).toBe(true);

            itemIdFromService = snapshotItem.id;
        });

        it('snapshot: service price change does NOT affect existing item', async () => {
            // Simulate a service price update
            await servicesRepo.update(serviceId, { basePrice: 9999 } as any);

            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .expect(200);

            const quotation = res.body.find((q: any) => q.id === quotationId);
            const snapshotItem = quotation.items.find((i: any) => i.id === itemIdFromService);

            // Must still show 1500, not 9999
            expect(Number(snapshotItem.price)).toBe(1500);
        });

        it('POST /items — 404 for non-existent serviceId', () => {
            return request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}/items`)
                .set('Cookie', [authCookie])
                .send({ serviceId: '00000000-0000-0000-0000-000000000000' })
                .expect(404);
        });

        it('PATCH /items/:id — updates item price and quantity, recalculates totals', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}/items/${itemId}`)
                .set('Cookie', [authCookie])
                .send({ price: 1000, quantity: 3 })
                .expect(200);

            const updated = res.body.items.find((i: any) => i.id === itemId);
            expect(Number(updated.price)).toBe(1000);
            expect(Number(updated.quantity)).toBe(3);
            // Subtotal must include updated value: 1000*3 + 1500 = 4500
            expect(Number(res.body.subtotal)).toBe(4500);
        });

        it('PATCH /items/:id — 404 for non-existent item', () => {
            return request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}/items/00000000-0000-0000-0000-000000000000`)
                .set('Cookie', [authCookie])
                .send({ price: 100 })
                .expect(404);
        });

        it('DELETE /items/:id — removes item and recalculates totals', async () => {
            // Before: subtotal = 4500 (manual item = 3000, snapshot = 1500)
            const res = await request(app.getHttpServer())
                .delete(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId}/items/${itemId}`)
                .set('Cookie', [authCookie])
                .expect(204);

            // After: only snapshot item left → subtotal = 1500
            const getRes = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .expect(200);

            const quotation = getRes.body.find((q: any) => q.id === quotationId);
            expect(Number(quotation.subtotal)).toBe(1500);
            expect(Number(quotation.total)).toBe(1500);
        });

        it('quotation totals reflect only the remaining snapshot item', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .expect(200);

            const quotation = res.body.find((q: any) => q.id === quotationId);
            expect(Number(quotation.subtotal)).toBe(1500);
            expect(Number(quotation.total)).toBe(1500);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 5: PAYMENT PLAN + MILESTONES
    // ══════════════════════════════════════════════════════════════════════════

    describe('Payment Plan & Milestones', () => {
        it('GET /payment-plan — 404 when no plan exists yet', () => {
            return request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan`)
                .set('Cookie', [authCookie])
                .expect(404);
        });

        it('POST /payment-plan — creates plan with multiple milestones', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan`)
                .set('Cookie', [authCookie])
                .send({
                    quotationId,
                    milestones: [
                        { name: 'Anticipo 50%', percentage: 50, amount: 750, dueDate: '2026-04-01' },
                        { name: 'Contra entrega', percentage: 50, amount: 750, dueDate: '2026-05-01' },
                    ],
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.quotationId).toBe(quotationId);
            expect(Number(res.body.totalAmount)).toBe(1500);
            expect(res.body.milestones).toHaveLength(2);
            expect(res.body.milestones[0].status).toBe('PENDING');

            milestoneId = res.body.milestones[0].id;
        });

        it('GET /payment-plan — returns the plan with milestones', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(res.body.milestones).toHaveLength(2);
            expect(res.body.quotationId).toBe(quotationId);
        });

        it('POST /payment-plan — replaces existing plan (idempotent)', async () => {
            const res = await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan`)
                .set('Cookie', [authCookie])
                .send({
                    milestones: [{ name: 'Pago único', amount: 1500 }],
                })
                .expect(201);

            expect(res.body.milestones).toHaveLength(1);
            expect(res.body.milestones[0].name).toBe('Pago único');
            milestoneId = res.body.milestones[0].id;
        });

        it('POST /payment-plan/milestones — adds a milestone to existing plan', async () => {
            await request(app.getHttpServer())
                .post(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan/milestones`)
                .set('Cookie', [authCookie])
                .send({ name: 'Revisión intermedia', amount: 200, dueDate: '2026-04-15' })
                .expect(201);

            // Verify via GET which always loads milestones relation
            const planRes = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(planRes.body.milestones).toHaveLength(2);
            expect(Number(planRes.body.totalAmount)).toBe(1700); // 1500 + 200
        });

        it('PATCH /payment-plan/milestones/:id — updates milestone name', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan/milestones/${milestoneId}`)
                .set('Cookie', [authCookie])
                .send({ name: 'Pago único — Actualizado', amount: 1600 })
                .expect(200);

            expect(res.body.name).toBe('Pago único — Actualizado');
            expect(Number(res.body.amount)).toBe(1600);
        });

        it('PATCH /milestones/:id — 404 for non-existent milestone', () => {
            return request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan/milestones/00000000-0000-0000-0000-000000000000`)
                .set('Cookie', [authCookie])
                .send({ name: 'Ghost' })
                .expect(404);
        });

        it('DELETE /milestones/:id — deletes a milestone and updates count', async () => {
            await request(app.getHttpServer())
                .delete(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan/milestones/${milestoneId}`)
                .set('Cookie', [authCookie])
                .expect(204);

            const planRes = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan`)
                .set('Cookie', [authCookie])
                .expect(200);

            // One milestone deleted: "Revisión intermedia" remains
            expect(planRes.body.milestones).toHaveLength(1);
            expect(planRes.body.milestones[0].name).toBe('Revisión intermedia');
        });

        it('GET /payment-plan — milestone statuses default to PENDING', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/payment-plan`)
                .set('Cookie', [authCookie])
                .expect(200);
            res.body.milestones.forEach((m: any) => {
                expect(m.status).toBe('PENDING');
            });
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 6: STATUS TRANSITIONS
    // ══════════════════════════════════════════════════════════════════════════

    describe('Status Transitions', () => {
        it('PATCH — transitions deal to NEGOTIATING', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}`)
                .set('Cookie', [authCookie])
                .send({ status: 'NEGOTIATING' })
                .expect(200);

            expect(res.body.status).toBe('NEGOTIATING');
        });

        it('PATCH — transitions deal to WON and records wonAt', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/workspaces/${workspaceId}/deals/${dealId}`)
                .set('Cookie', [authCookie])
                .send({ status: 'WON' })
                .expect(200);

            expect(res.body.status).toBe('WON');
            expect(res.body.wonAt).not.toBeNull();
        });

        it('GET /deals/:id — WON deal returns full snapshot data', async () => {
            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(res.body.status).toBe('WON');
            expect(res.body.quotations).toEqual(expect.any(Array));
            expect(res.body.paymentPlan).toBeDefined();
            expect(res.body.paymentPlan.milestones).toHaveLength(1);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 7: QUOTATION DELETION
    // ══════════════════════════════════════════════════════════════════════════

    describe('Quotation Deletion', () => {
        it('DELETE /quotations/:qId — deletes second quotation', async () => {
            await request(app.getHttpServer())
                .delete(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId2}`)
                .set('Cookie', [authCookie])
                .expect(204);

            const res = await request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealId}/quotations`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(res.body.find((q: any) => q.id === quotationId2)).toBeUndefined();
        });

        it('DELETE /quotations/:qId — 404 for already-deleted quotation', () => {
            return request(app.getHttpServer())
                .delete(`/workspaces/${workspaceId}/deals/${dealId}/quotations/${quotationId2}`)
                .set('Cookie', [authCookie])
                .expect(404);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  BLOCK 8: DEAL DELETION
    // ══════════════════════════════════════════════════════════════════════════

    describe('Deal Deletion', () => {
        it('DELETE /deals/:id — 401 without auth', () => {
            return request(app.getHttpServer())
                .delete(`/workspaces/${workspaceId}/deals/${dealToDeleteId}`)
                .expect(401);
        });

        it('DELETE /deals/:id — owner can delete their deal (cascades all relations)', async () => {
            await request(app.getHttpServer())
                .delete(`/workspaces/${workspaceId}/deals/${dealToDeleteId}`)
                .set('Cookie', [authCookie])
                .expect(204);
        });

        it('GET /deals/:id — 404 after deletion', () => {
            return request(app.getHttpServer())
                .get(`/workspaces/${workspaceId}/deals/${dealToDeleteId}`)
                .set('Cookie', [authCookie])
                .expect(404);
        });

        it('DELETE /deals/:id — 404 for already-deleted deal', () => {
            return request(app.getHttpServer())
                .delete(`/workspaces/${workspaceId}/deals/${dealToDeleteId}`)
                .set('Cookie', [authCookie])
                .expect(404);
        });
    });
});

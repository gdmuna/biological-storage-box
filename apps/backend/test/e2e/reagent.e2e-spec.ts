import { AppModule } from '@/app.module.js';
import { DatabaseService } from '@/infra/database/database.service.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('Reagent (E2E)', () => {
    let app: INestApplication;
    let accessToken: string;
    let orgId: string;
    let nodeId: string;
    let reagentId: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.init();

        const suffix = Date.now().toString();
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `reagent_e2e_${suffix}`,
                email: `reagent_e2e_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                account: `reagent_e2e_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;

        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Reagent E2E Org' })
            .expect(201);

        orgId = orgRes.body.data.id;

        // Create a BOX-type node to place reagents in
        const nodeRes = await request(app.getHttpServer())
            .post('/node/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId, name: 'E2E Box', type: 'BOX' })
            .expect(201);

        nodeId = nodeRes.body.data.id;
    });

    afterAll(async () => {
        const db = app.get(DatabaseService);
        if (orgId) {
            await db.reagent.deleteMany({ where: { orgId } });
            await db.node.deleteMany({ where: { orgId } });
            await request(app.getHttpServer())
                .delete('/org/del')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ orgId });
        }
        await app.close();
    });

    it('POST /reagent/add — should create reagent with P0 fields', async () => {
        const res = await request(app.getHttpServer())
            .post('/reagent/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                nodeId,
                position: '1-1',
                name: '青霉素钠',
                description: 'E2E 测试试剂',
                quantity: 100,
                unit: 'mg',
                expiryDate: '2027-12-31T00:00:00.000Z',
                manufactureDate: '2025-01-01T00:00:00.000Z',
                batchNo: 'BATCH_E2E_001',
                catalogNo: 'CAT-001',
                manufacturer: 'Sigma-Aldrich',
                casNumber: '69-57-8',
                hazardLevel: 'GHS07',
                minStockThreshold: 10,
            })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('青霉素钠');
        expect(res.body.data.quantity).toBe(100);
        expect(res.body.data.unit).toBe('mg');
        expect(res.body.data.batchNo).toBe('BATCH_E2E_001');
        expect(res.body.data.catalogNo).toBe('CAT-001');
        expect(res.body.data.manufacturer).toBe('Sigma-Aldrich');
        expect(res.body.data.casNumber).toBe('69-57-8');
        expect(res.body.data.hazardLevel).toBe('GHS07');
        expect(res.body.data.minStockThreshold).toBe(10);
        reagentId = res.body.data.id;
    });

    it('GET /reagent/one — should return reagent with P0 fields', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ id: reagentId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(reagentId);
        expect(res.body.data.quantity).toBe(100);
        expect(res.body.data.casNumber).toBe('69-57-8');
        expect(res.body.data.expiryDate).toBeTruthy();
    });

    it('GET /reagent/list — should list reagents with P0 fields', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ nodeId })
            .expect(200);

        expect(res.body.success).toBe(true);
        const found = res.body.data.find((r: { id: string }) => r.id === reagentId);
        expect(found).toBeDefined();
        expect(found.quantity).toBe(100);
        expect(found.hazardLevel).toBe('GHS07');
    });

    it('PUT /reagent/update — should update P0 fields', async () => {
        const res = await request(app.getHttpServer())
            .put('/reagent/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                id: reagentId,
                quantity: 75.5,
                unit: 'mL',
                minStockThreshold: 5,
                hazardLevel: 'GHS06',
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.quantity).toBe(75.5);
        expect(res.body.data.unit).toBe('mL');
        expect(res.body.data.minStockThreshold).toBe(5);
        expect(res.body.data.hazardLevel).toBe('GHS06');
    });

    it('PUT /reagent/update — should clear expiryDate when null is passed', async () => {
        const res = await request(app.getHttpServer())
            .put('/reagent/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: reagentId, expiryDate: null })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.expiryDate).toBeNull();
    });

    it('DELETE /reagent/del — should delete reagent', async () => {
        const res = await request(app.getHttpServer())
            .delete('/reagent/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: reagentId })
            .expect(200);

        expect(res.body.success).toBe(true);
    });
});

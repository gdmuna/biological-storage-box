import { AppModule } from '@/app.module.js';
import { DatabaseService } from '@/infra/database/database.service.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('Node (BOX) + Reagent (e2e)', () => {
    let app: INestApplication;
    let db: DatabaseService;
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

        db = app.get(DatabaseService);

        const suffix = Date.now().toString();
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `box_test_${suffix}`,
                email: `box_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                account: `box_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;

        // create org
        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Node BOX E2E Org' })
            .expect(201);

        orgId = orgRes.body.data.id;

        // create a BOX node
        const nodeRes = await request(app.getHttpServer())
            .post('/node/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId, name: 'E2E Box Node', type: 'BOX' })
            .expect(201);

        nodeId = nodeRes.body.data.id;

        // seed a reagent directly
        const seedReagent = await db.reagent.create({
            data: { nodeId, orgId, position: '1-1', name: 'Seed Reagent' },
        });
        reagentId = seedReagent.id;
    });

    afterAll(async () => {
        // cleanup org (cascades to nodes, reagents)
        if (orgId) {
            await request(app.getHttpServer())
                .delete('/org/del')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ orgId });
        }
        await app.close();
    });

    it('GET /node/one should return node detail', async () => {
        const res = await request(app.getHttpServer())
            .get('/node/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ id: nodeId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(nodeId);
        expect(res.body.data.type).toBe('BOX');
    });

    it('GET /reagent/list should return reagents for the node', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ nodeId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].id).toBe(reagentId);
    });

    it('GET /reagent/one should return reagent detail', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ id: reagentId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(reagentId);
        expect(res.body.data.name).toBe('Seed Reagent');
    });

    it('PUT /reagent/update should update a reagent', async () => {
        const res = await request(app.getHttpServer())
            .put('/reagent/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: reagentId, name: 'Sample Alpha', description: 'Test reagent' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Sample Alpha');
    });

    it('DELETE /node/del should delete the node', async () => {
        await request(app.getHttpServer())
            .delete('/node/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: nodeId })
            .expect(200);

        nodeId = ''; // prevent afterAll from double-deleting
    });
});

import { AppModule } from '@/app.module.js';
import { DatabaseService } from '@/infra/database/database.service.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('Box + Reagent (e2e)', () => {
    let app: INestApplication;
    let db: DatabaseService;
    let accessToken: string;
    let orgId: string;
    let boxId: string;
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
            .send({ name: 'Box E2E Org' })
            .expect(201);

        orgId = orgRes.body.data.id;

        // create box
        const boxRes = await request(app.getHttpServer())
            .post('/box/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId, name: 'E2E Box', rows: 2, cols: 3 })
            .expect(201);

        boxId = boxRes.body.data.id;

        // seed a reagent directly (no POST endpoint exists)
        const seedReagent = await db.reagent.create({
            data: { boxId, orgId, position: 'A1', name: 'Seed Reagent' },
        });
        reagentId = seedReagent.id;
    });

    afterAll(async () => {
        // cleanup org (cascades to box, reagent)
        if (orgId) {
            await request(app.getHttpServer())
                .delete('/org/del')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ orgId });
        }
        await app.close();
    });

    it('GET /box/one should return box detail with reagent count', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ id: boxId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(boxId);
        expect(res.body.data._count.reagents).toBe(1); // seeded 1 reagent
    });

    it('GET /reagent/list should return reagents for the box', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxId })
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

    it('DELETE /box/del should delete the box', async () => {
        await request(app.getHttpServer())
            .delete('/box/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: boxId })
            .expect(200);

        boxId = ''; // prevent afterAll from double-deleting
    });
});

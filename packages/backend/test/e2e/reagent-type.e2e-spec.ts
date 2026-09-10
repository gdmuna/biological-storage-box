import { AppModule } from '@/bootstrap/app.module.js';

import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import request from 'supertest';

describe('ReagentType (E2E)', () => {
    let app: NestFastifyApplication;
    let accessToken: string;
    let orgId: string;
    let reagentTypeId: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.register(fastifyCookie);
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        const suffix = Date.now().toString();
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `rt_test_${suffix}`,
                email: `rt_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                account: `rt_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;

        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'ReagentType E2E Org' })
            .expect(201);

        orgId = orgRes.body.data.id;
    });

    afterAll(async () => {
        if (orgId) {
            await request(app.getHttpServer())
                .delete('/org/del')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ orgId });
        }
        await app.close();
    });

    it('POST /reagent-type/add — should create reagent type', async () => {
        const res = await request(app.getHttpServer())
            .post('/reagent-type/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId, name: '青霉素', colorHex: '#2a9d99', unit: 'mL' })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('青霉素');
        reagentTypeId = res.body.data.id;
    });

    it('GET /reagent-type/list — should list reagent types', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent-type/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('PUT /reagent-type/update — should update reagent type', async () => {
        const res = await request(app.getHttpServer())
            .put('/reagent-type/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: reagentTypeId, colorHex: '#0075de' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.colorHex).toBe('#0075de');
    });

    it('DELETE /reagent-type/del — should delete reagent type', async () => {
        await request(app.getHttpServer())
            .delete('/reagent-type/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: reagentTypeId })
            .expect(200);
    });
});

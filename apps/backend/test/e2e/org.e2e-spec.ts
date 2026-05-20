import { AppModule } from '@/app.module.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('Org (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let createdOrgId: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.init();

        // register + login to get access token
        const suffix = Date.now().toString();
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `org_test_${suffix}`,
                email: `org_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                account: `org_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /org/create should create an org', async () => {
        const res = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'E2E Test Org', description: 'Created in e2e test' })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('E2E Test Org');
        createdOrgId = res.body.data.id;
    });

    it('GET /org/list should include the created org', async () => {
        const res = await request(app.getHttpServer())
            .get('/org/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(res.body.success).toBe(true);
        const orgIds = res.body.data.map((o: any) => o.id);
        expect(orgIds).toContain(createdOrgId);
    });

    it('PUT /org/update should update the org name', async () => {
        const res = await request(app.getHttpServer())
            .put('/org/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId: createdOrgId, name: 'Updated E2E Org' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Updated E2E Org');
    });

    it('DELETE /org/del should delete the org', async () => {
        await request(app.getHttpServer())
            .delete('/org/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId: createdOrgId })
            .expect(200);
    });
});

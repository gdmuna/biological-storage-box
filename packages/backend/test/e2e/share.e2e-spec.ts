import { AppModule } from '@/bootstrap/app.module.js';
import { DatabaseService } from '@/infra/database/database.service.js';

import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import request from 'supertest';

describe('Share (E2E)', () => {
    let app: NestFastifyApplication;
    let accessToken: string;
    let ownerOrgId: string;
    let granteeOrgId: string;
    let nodeId: string;
    let shareId: string;

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
                username: `share_test_${suffix}`,
                email: `share_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                account: `share_test_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;

        // Create owner org
        const ownerOrgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Share Owner Org' })
            .expect(201);
        ownerOrgId = ownerOrgRes.body.data.id;

        // Create grantee org
        const granteeOrgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Share Grantee Org' })
            .expect(201);
        granteeOrgId = granteeOrgRes.body.data.id;

        // Create a node to share
        const nodeRes = await request(app.getHttpServer())
            .post('/node/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId: ownerOrgId, name: 'Shared Node', type: 'CONTAINER' })
            .expect(201);
        nodeId = nodeRes.body.data.id;
    });

    afterAll(async () => {
        // Clean up share records first to avoid FK constraint violations
        const db = app.get(DatabaseService);
        await db.resourceShare.deleteMany({
            where: { OR: [{ ownerOrgId }, { granteeOrgId }] },
        });

        if (ownerOrgId) {
            await request(app.getHttpServer())
                .delete('/org/del')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ orgId: ownerOrgId });
        }
        if (granteeOrgId) {
            await request(app.getHttpServer())
                .delete('/org/del')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ orgId: granteeOrgId });
        }
        await app.close();
    });

    it('POST /share/grant — should grant share to grantee org', async () => {
        const res = await request(app.getHttpServer())
            .post('/share/grant')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                resourceType: 'NODE',
                resourceId: nodeId,
                ownerOrgId,
                granteeOrgId,
                permission: 'READ',
            })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('ACTIVE');
        shareId = res.body.data.id;
    });

    it('POST /share/grant — duplicate should return 409', async () => {
        await request(app.getHttpServer())
            .post('/share/grant')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                resourceType: 'NODE',
                resourceId: nodeId,
                ownerOrgId,
                granteeOrgId,
                permission: 'READ',
            })
            .expect(409);
    });

    it('GET /share/outbound — should list outbound shares', async () => {
        const res = await request(app.getHttpServer())
            .get('/share/outbound')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgId: ownerOrgId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /share/inbound — should list inbound shares', async () => {
        const res = await request(app.getHttpServer())
            .get('/share/inbound')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgId: granteeOrgId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('DELETE /share/revoke — should revoke the share', async () => {
        await request(app.getHttpServer())
            .delete('/share/revoke')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ shareId })
            .expect(200);
    });
});

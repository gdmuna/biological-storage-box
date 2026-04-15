import { AppModule } from '@/app.module.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('Node Extensions (E2E)', () => {
    let app: INestApplication;
    let accessToken: string;
    let orgId: string;
    let nodeId: string;

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
                username: `node_ext_${suffix}`,
                email: `node_ext_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                account: `node_ext_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;

        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Node Ext E2E Org' })
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

    it('POST /node/add — should create node with type ROOM', async () => {
        const res = await request(app.getHttpServer())
            .post('/node/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId, name: 'Test Room', type: 'ROOM' })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.type).toBe('ROOM');
        nodeId = res.body.data.id;
    });

    it('POST /node/grid/set — should set gridConfig', async () => {
        const res = await request(app.getHttpServer())
            .post('/node/grid/set')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ nodeId, rows: 9, cols: 9 })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.rows).toBe(9);
        expect(res.body.data.cols).toBe(9);
    });

    it('GET /node/filter — should filter by type', async () => {
        const res = await request(app.getHttpServer())
            .get('/node/filter')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgId, type: 'ROOM' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].type).toBe('ROOM');
    });

    it('GET /node/filter — should filter by hasGrid=true', async () => {
        const res = await request(app.getHttpServer())
            .get('/node/filter')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgId, hasGrid: 'true' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.every((n: any) => n.gridConfig !== null)).toBe(true);
    });

    it('DELETE /node/grid/remove — should remove gridConfig', async () => {
        await request(app.getHttpServer())
            .delete('/node/grid/remove')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ nodeId })
            .expect(200);
    });
});

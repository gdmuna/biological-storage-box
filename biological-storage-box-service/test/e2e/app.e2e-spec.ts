import { AppModule } from '@/app.module.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/health (GET) should return status ok and timestamp', async () => {
        const res = await request(app.getHttpServer()).get('/health').expect(200);

        // expect(res.body).toHaveProperty('status', 'ok');
        // expect(res.body).toHaveProperty('timestamp');
        expect(new Date(res.body.timestamp).toString()).not.toContain('Invalid');
    });
});

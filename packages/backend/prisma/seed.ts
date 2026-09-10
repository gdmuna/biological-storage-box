import { PrismaClient } from './generated/client.js';

// import { DATABASE_URL } from '@/constants/index.js';
import { generatePasswordHash } from '@/common/utils/index.js';

import { parseArgs } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 12,
    min: 2, // 最小保持 2 个连接
    idleTimeoutMillis: 30000, // 30秒空闲超时
    connectionTimeoutMillis: 2000, // 2秒连接超时
});

const prisma = new PrismaClient({ adapter });

const options = {
    environment: { type: 'string' },
} as const;

// 生成开发环境的测试数据
async function _seedForDevelopment() {
    const passwordHashes = await generatePasswordHash(10, {
        password: 'password',
        salt: 10,
    });
    const tasks: Promise<any>[] = [];
    for (let i = 0; i < 10; i++) {
        tasks.push(
            prisma.user
                .create({
                    data: {
                        username: `user${i}`,
                        email: `user${i}@example.com`,
                        passwordHash: passwordHashes[i].hash,
                    },
                })
                .then((user) => {
                    const info = {
                        username: user.username,
                        email: user.email,
                        password: passwordHashes[i].password,
                    };
                    console.log(`创建用户：`, JSON.stringify(info, null, 2));
                })
        );
    }
    await Promise.all(tasks);
}

// 主函数，根据环境变量执行不同的数据填充逻辑
async function main() {
    const {
        values: { environment = 'development' },
    } = parseArgs({ options });

    switch (environment) {
        case 'development':
            await _seedForDevelopment();
            break;
        case 'test':
            break;
        default:
            console.warn(`未知环境：${environment}\n跳过数据填充操作`);
            break;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

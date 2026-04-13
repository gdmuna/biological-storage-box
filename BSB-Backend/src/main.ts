import { APP_VERSION, APP_AUTHOR } from '@/constants/index.js';

import '@/common/exceptions/index.js'; // 全局注册异常

import { AppModule } from './app.module.js';

import { Logger } from '@/common/services/index.js';

import { NestFactory } from '@nestjs/core';
import figlet from 'figlet';
import { atlas } from 'gradient-string';
import { Logger as pinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import {
    wrapSuccessResponses,
    enrichErrorResponses,
    enrichTagDescriptions,
} from '@/common/utils/openapi-envelope.js';
import cookieParser from 'cookie-parser';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(pinoLogger));
    const logger = new Logger('Bootstrap');

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    baseUri: ["'self'"],
                    fontSrc: ["'self'", 'https://fonts.scalar.com', 'data:'],
                    formAction: ["'self'"],
                    frameAncestors: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    objectSrc: ["'none'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
                    scriptSrcAttr: ["'none'"],
                    styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
                    upgradeInsecureRequests: [],
                    connectSrc: ["'self'"],
                },
            },
        })
    );

    app.use(cookieParser());

    const apiDescription = `
NestJS 后端基线模板 API，提供认证系统、健康检查和错误目录等基础能力。

## 认证

需要认证的端点使用 **Bearer Token**（JWT，EC 算法签发）：

1. 通过 \`POST /auth/login\` 或 \`POST /auth/register\` 获取 \`accessToken\`
2. 在请求头中携带：\`Authorization: Bearer <accessToken>\`

刷新令牌（\`refresh_token\`）以 **HttpOnly Cookie** 形式存储，通过 \`POST /auth/refresh-token\` 静默轮转，无需手动传递。

## 响应结构

**成功响应**均被包裹为统一包络格式：
\`\`\`json
{
  "success": true,
  "data": { },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "context": { "requestId": "01JXXX...", "time": 1700000000000, "version": "0.6.2" }
}
\`\`\`

**错误响应**遵循统一结构，\`code\` 字段可在「错误码参考」查阅完整对照表：
\`\`\`json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "人类可读描述",
  "type": "http://localhost:3000/errors/ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "context": { "requestId": "..." },
  "details": null
}
\`\`\`
`.trim();

    const docConfig = new DocumentBuilder()
        .setTitle('NestJS Scaffold API')
        .setDescription(apiDescription)
        .setVersion(APP_VERSION)
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'accessToken')
        .build();
    const documentFactory = SwaggerModule.createDocument(app, docConfig);
    const processedDoc = enrichTagDescriptions(
        enrichErrorResponses(wrapSuccessResponses(cleanupOpenApiDoc(documentFactory)))
    );
    SwaggerModule.setup('api-doc', app, processedDoc);

    app.use(
        '/reference',
        apiReference({
            url: '/api-doc-json',
            theme: 'elysiajs',
            darkMode: true,
            defaultOpenAllTags: true,
            defaultHttpClient: {
                targetKey: 'js',
                clientKey: 'axios',
            },
            expandAllModelSections: true,
            showDeveloperTools: 'never',
            showOperationId: true,
        })
    );

    const port = parseInt(process.env.PORT ?? '3000');
    await app.listen(port).catch(async (err) => {
        if (err.code === 'EADDRINUSE') {
            logger.fatal(
                `❌ 启动失败：端口 ${port} 已被占用。
\x1b[33m请尝试以下方案：
1. 使用其他端口：更改环境变量 PORT 的值
2. 查找占用端口的进程：
    - （Windows）：netstat -ano | findstr :${port}
    - （Linux/Mac）：lsof -i :${port}
3. 杀死占用端口的进程：
    - （Windows）：taskkill /PID <PID> /F （例：taskkill /PID 36396 /F）
    - （Linux/Mac）：kill -9 <PID> （例：kill -9 36396）\x1b[0m`
            );
        } else if (err.code === 'EACCES') {
            logger.fatal(
                `❌ 启动失败：没有权限绑定到端口 ${port}。
\x1b[33m请尝试以下方案：
1. 以管理员身份运行应用程序
    - （Windows）：以管理员权限运行 PowerShell，然后执行 pnpm start:dev
2. 使用更高端口号（1024 以上）：修改 .env 文件设置 PORT=8000
3. 检查防火墙或安全软件是否阻止\x1b[0m`
            );
        }
        app.flushLogs(); // 打印缓冲日志并分离缓冲区
        await app.close();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 确保日志写出
        process.exit(1);
    });
    logger.log(`✅ 服务已启动于: http://localhost:${port}`);
}

bootstrap()
    .then(async () => {
        // 等待 pino-pretty Worker 线程完成日志输出
        await new Promise((resolve) => setTimeout(resolve, 200));

        const startupBanner = await figlet.text('NestJS-Scaffold', {
            font: 'Slant',
            horizontalLayout: 'fitted',
        });

        const infoArray = [];

        infoArray.push(`Version: ${APP_VERSION}`);

        infoArray.push(`Environment: ${process.env.NODE_ENV || 'N/A'}`);

        let info = infoArray.join(' | ');

        const signature = `By ${APP_AUTHOR}`;

        const bannerWidth = Math.max(...startupBanner.split('\n').map((line) => line.length));
        const MIN_GAP = 4;
        const lineWidth = Math.max(bannerWidth, info.length + signature.length + MIN_GAP);
        const padspace = lineWidth - info.length;

        if (lineWidth > bannerWidth) {
            info = infoArray.join('\n') + `\n${signature}`;
        } else {
            info = info + signature.padStart(padspace);
        }

        process.stdout.write(atlas.multiline(startupBanner + `\n${info}\n\n`));
    })
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Bootstrap failed:', err);
        process.exit(1);
    });

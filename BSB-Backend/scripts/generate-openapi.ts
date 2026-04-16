/**
 * OpenAPI JSON 生成脚本
 *
 * 从正在运行的后端实例获取 OpenAPI schema，保存到
 * website/api-reference/openapi.json，供本地文档构建和 Docker 镜像构建使用。
 *
 * 用法：
 *   pnpm docs:gen-openapi                           # 使用默认地址 http://localhost:3000
 *   BACKEND_URL=http://localhost:3001 pnpm docs:gen-openapi  # 自定义后端地址
 *
 * 前提条件：后端服务必须已启动（pnpm start:dev）
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../website/api-reference/openapi.json');
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '3000'}`;

async function main() {
    const url = `${BACKEND_URL}/api-doc-json`;
    console.log(`📡 Fetching OpenAPI schema from ${url}...`);

    let response: Response;
    try {
        response = await fetch(url);
    } catch (err) {
        throw new Error(
            `Cannot connect to backend at ${BACKEND_URL}.\n   Make sure the backend is running (pnpm start:dev).`
        );
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
    }

    const json: unknown = await response.json();

    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(json, null, 2));

    const bytes = Buffer.byteLength(JSON.stringify(json));
    console.log(`✅ OpenAPI JSON saved to website/api-reference/openapi.json (${bytes} bytes)`);
}

main().catch((err: Error) => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
});

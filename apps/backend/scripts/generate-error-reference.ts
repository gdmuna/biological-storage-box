/**
 * 错误码参考文档生成脚本
 *
 * 用法：
 *   pnpm docs:gen-reference
 *   # 或直接调用
 *   pnpm tsx scripts/generate-error-reference.ts
 *
 * 原理：
 *   导入所有异常模块，触发 @RegisterException 装饰器完成注册，
 *   再从 ErrorRegistry 读取全量元数据，生成 docs/04-appendix/error-reference.md。
 *
 * 该文件是**生成产物**，修改后会被下次执行覆盖。
 * 若需要自定义内容，请在对应的异常类上补充 hint / causes 字段。
 */

// reflect-metadata 必须在任何使用 Reflect.* 的模块之前导入
import 'reflect-metadata';

// 一次 import 触发所有域的 @RegisterException 装饰器
// index.ts 内部已链式导入 database / auth / exception-catalog 等模块
import '@/common/exceptions/index.js';

import { ErrorRegistry, type StaticMeta } from '@/common/exceptions/exception-registry.js';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../docs/04-appendix/error-reference.md');

// ─── HTTP 状态码段标题 ────────────────────────────────────────────────────────

const STATUS_SECTION: Record<number, string> = {
    400: '400 — 参数验证 / 请求格式错误',
    401: '401 — 认证失败',
    403: '403 — 权限不足',
    404: '404 — 资源不存在',
    409: '409 — 资源冲突',
    422: '422 — 业务逻辑错误',
    429: '429 — 请求频率限制',
    500: '500 — 服务器内部错误',
};

// ─── 单条错误码渲染 ───────────────────────────────────────────────────────────

function renderErrorEntry(meta: StaticMeta): string {
    const retryLabel = meta.retryable ? '✅ 可重试' : '不可重试';
    let md = '';

    // ### `ERROR_CODE` — VitePress 会为此标题生成锚点 #error_code
    md += `### \`${meta.code}\`\n\n`;
    md += `**HTTP ${meta.statusCode}** · ${retryLabel}\n\n`;
    md += `**${meta.message}**\n\n`;
    md += `${meta.description}\n\n`;

    if (meta.causes && meta.causes.length > 0) {
        md += `**常见触发原因**\n\n`;
        md += meta.causes.map((c) => `- ${c}`).join('\n') + '\n\n';
    }

    if (meta.hint) {
        md += `**排查建议**\n\n${meta.hint}\n\n`;
    }

    if (meta.docsPath) {
        md += `[📄 完整文档](${meta.docsPath})\n\n`;
    }

    return md;
}

// ─── 主逻辑 ──────────────────────────────────────────────────────────────────

function generate(): void {
    const all = [...ErrorRegistry.getAll().values()];

    if (all.length === 0) {
        console.error(
            '[generate-error-reference] ❌ ErrorRegistry 为空，请检查异常模块是否正确导入'
        );
        process.exit(1);
    }

    // 按 HTTP 状态码分组，组内按 code 字母排序
    const grouped = new Map<number, StaticMeta[]>();
    for (const meta of all) {
        const list = grouped.get(meta.statusCode) ?? [];
        list.push(meta);
        grouped.set(meta.statusCode, list);
    }
    const sortedGroups = [...grouped.entries()].sort(([a], [b]) => a - b);

    const frontmatter = [
        '---',
        'title: 错误码参考',
        '# 此文件由 scripts/generate-error-reference.ts 自动生成，请勿手动修改',
        '# 重新生成：pnpm docs:gen-reference',
        '---',
        '',
    ].join('\n');

    const intro = [
        '# 错误码参考',
        '',
        '所有错误响应均包含 `code` 字段，可在本页按错误码查阅完整说明。',
        '',
        '每个错误码标题均可作为锚点直接访问，例如 [`AUTH_TOKEN_INVALID`](#auth-token-invalid)。',
        '',
        '`retryable: true` 表示该错误由临时性故障引起，客户端可在等待后重试。',
        '',
        '',
    ].join('\n');

    let body = '';
    for (const [statusCode, metas] of sortedGroups) {
        const sectionTitle = STATUS_SECTION[statusCode] ?? `${statusCode}`;
        body += `## ${sectionTitle}\n\n`;
        const sorted = [...metas].sort((a, b) => a.code.localeCompare(b.code));
        for (const meta of sorted) {
            body += renderErrorEntry(meta);
        }
    }

    const output = frontmatter + intro + body.trimEnd() + '\n';
    writeFileSync(OUTPUT_PATH, output, 'utf-8');

    console.log(
        `[generate-error-reference] ✅ 已生成 docs/04-appendix/error-reference.md（共 ${all.length} 个错误码）`
    );
}

generate();

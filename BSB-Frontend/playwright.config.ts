import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './test/e2e',
    use: {
        baseURL: 'http://localhost:8081',
        headless: true,
    },
    webServer: {
        command: 'pnpm dev',
        port: 8081,
        reuseExistingServer: true,
        timeout: 30_000,
    },
});

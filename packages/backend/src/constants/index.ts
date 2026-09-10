import { appConfig, AppConfig } from './app.constant.js';
import { authConfig, AuthConfig } from './auth.constant.js';
import { databaseConfig, DatabaseConfig } from './database.constant.js';
import { httpConfig, HttpConfig } from './http.constant.js';
import { mailConfig, MailConfig } from './mail.constant.js';
import { observabilityConfig, ObservabilityConfig } from './observability.constant.js';
import { storageConfig, StorageConfig } from './storage.constant.js';

// 导出所有配置

export type AllConfig = {
    app: AppConfig;
    auth: AuthConfig;
    database: DatabaseConfig;
    http: HttpConfig;
    mail: MailConfig;
    observability: ObservabilityConfig;
    storage: StorageConfig;
};

export const allConfig = {
    appConfig,
    authConfig,
    databaseConfig,
    httpConfig,
    mailConfig,
    observabilityConfig,
    storageConfig,
};

export default [...Object.values(allConfig)];

export * from './app.constant.js';
export * from './auth.constant.js';
export * from './database.constant.js';
export * from './http.constant.js';
export * from './mail.constant.js';
export * from './observability.constant.js';
export * from './storage.constant.js';

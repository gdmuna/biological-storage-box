export * from './exception-registry.js';
export * from './app.exception.js';
export { default as CLIENT_EXCEPTION } from './client.exception.js';
export * from './client.exception.js';
export { default as SYS_EXCEPTION } from './system.exception.js';
export * from './system.exception.js';

import '@/infra/database/database.exception.js';

import '@/modules/auth/auth.exception.js';
import '@/modules/exception-catalog/exception-catalog.exception.js';

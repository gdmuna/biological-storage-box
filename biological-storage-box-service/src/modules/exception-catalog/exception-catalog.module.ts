import { ExceptionCatalogController } from './exception-catalog.controller.js';
import { ExceptionCatalogService } from './exception-catalog.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [ExceptionCatalogController],
    providers: [ExceptionCatalogService],
    exports: [ExceptionCatalogService],
})
export class ExceptionCatalogModule {}

import { ExceptionCatalogController } from './exception-catalog.controller.js';
import { ExceptionCatalogService } from './internal/exception-catalog.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [ExceptionCatalogController],
    providers: [ExceptionCatalogService],
})
export class ExceptionCatalogModule {}

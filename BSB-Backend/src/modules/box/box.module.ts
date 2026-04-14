import { BoxController } from './box.controller.js';
import { BoxAliasController } from './box-alias.controller.js';
import { BoxImageController } from './box-image.controller.js';
import { BoxService } from './box.service.js';
import { BoxRepository } from './box.repository.js';

import { OrgModule } from '@/modules/org/org.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [BoxController, BoxAliasController, BoxImageController],
    providers: [BoxService, BoxRepository],
    exports: [BoxService, BoxRepository],
})
export class BoxModule {}

import { NodeController } from './node.controller.js';
import { NodeService } from './node.service.js';
import { NodeRepository } from './node.repository.js';

import { OrgModule } from '@/modules/org/org.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [NodeController],
    providers: [NodeService, NodeRepository],
    exports: [NodeService, NodeRepository],
})
export class NodeModule {}

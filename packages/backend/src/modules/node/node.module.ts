import { NodeController } from './node.controller.js';
import { NodeService } from './internal/node.service.js';
import { NodeRepository } from './internal/node.repository.js';

import { OrgModule } from '@/modules/org/org.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [NodeController],
    providers: [NodeService, NodeRepository],
})
export class NodeModule {}

import { AccessKernel } from './access.kernel.js';

import { Module } from '@nestjs/common';

@Module({
    providers: [AccessKernel],
    exports: [AccessKernel],
})
export class AccessKernelModule {}

import { ResourceKernel } from './resource.kernel.js';

import { Module } from '@nestjs/common';

@Module({
    providers: [ResourceKernel],
    exports: [ResourceKernel],
})
export class ResourceKernelModule {}

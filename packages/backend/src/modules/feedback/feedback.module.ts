import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { FeedbackRepository } from './feedback.repository.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [FeedbackController],
    providers: [FeedbackService, FeedbackRepository],
    exports: [FeedbackService],
})
export class FeedbackModule {}

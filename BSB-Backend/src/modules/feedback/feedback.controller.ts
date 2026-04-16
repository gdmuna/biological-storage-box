import { BoxLogListDto, BoxLogReagentListDto, CreateFeedbackDto } from './feedback.dto.js';
import { FeedbackService } from './feedback.service.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('日志与反馈模块')
@Controller()
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) {}

    @Get('box/log/list')
    @ApiRoute({
        auth: 'required',
        summary: '获取储存盒操作日志',
    })
    async listBoxLogs(@Query() query: BoxLogListDto) {
        return this.feedbackService.listBoxLogs(query.boxId, query.limit, query.offset);
    }

    @Get('box/log/reagent/list')
    @ApiRoute({
        auth: 'required',
        summary: '获取试剂操作日志',
    })
    async listReagentLogs(@Query() query: BoxLogReagentListDto) {
        return this.feedbackService.listReagentLogs(query.reagentId, query.limit, query.offset);
    }

    @Post('feedback/add')
    @ApiRoute({
        auth: 'required',
        summary: '提交反馈',
    })
    async createFeedback(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateFeedbackDto) {
        return this.feedbackService.createFeedback(user.sub, body.content);
    }
}

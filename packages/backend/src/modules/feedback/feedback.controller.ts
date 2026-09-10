import {
    BoxLogListDto,
    BoxLogReagentListDto,
    CreateFeedbackDto,
    BoxLogPaginatedVo,
    ReagentLogPaginatedVo,
    FeedbackVo,
} from './feedback.dto.js';
import { FeedbackService } from './internal/feedback.service.js';

import { ApiRoute, CurrentUser } from '@/platform/http/decorators/index.js';
import type { AccessTokenClaim } from '@/core/identity/index.js';

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
        responseType: BoxLogPaginatedVo,
    })
    async listBoxLogs(@Query() query: BoxLogListDto) {
        return this.feedbackService.listBoxLogs(query.boxId, query.limit, query.offset);
    }

    @Get('box/log/reagent/list')
    @ApiRoute({
        auth: 'required',
        summary: '获取试剂操作日志',
        responseType: ReagentLogPaginatedVo,
    })
    async listReagentLogs(@Query() query: BoxLogReagentListDto) {
        return this.feedbackService.listReagentLogs(query.reagentId, query.limit, query.offset);
    }

    @Post('feedback/add')
    @ApiRoute({
        auth: 'required',
        summary: '提交反馈',
        responseType: FeedbackVo,
    })
    async createFeedback(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateFeedbackDto) {
        return this.feedbackService.createFeedback(user.sub, body.content);
    }
}

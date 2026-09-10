import {
    UpdateReagentDto,
    ReagentIdDto,
    ReagentListDto,
    CreateReagentDto,
    ReagentVo,
    DeleteReagentResultVo,
} from './reagent.dto.js';
import { ReagentService } from './internal/reagent.service.js';
import REAGENT_EXCEPTION from './reagent.exception.js';

import { ApiRoute } from '@/platform/http/decorators/index.js';

import { Controller, Get, Put, Post, Body, Query, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('试剂模块')
@Controller('reagent')
export class ReagentController {
    constructor(private readonly reagentService: ReagentService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '在储存盒指定槽位新增试剂',
        responseType: ReagentVo,
        errors: [REAGENT_EXCEPTION.ReagentNotFoundException.code],
    })
    async create(@Body() body: CreateReagentDto) {
        return this.reagentService.create(body);
    }

    @Get('one')
    @ApiRoute({
        auth: 'required',
        summary: '获取试剂详情',
        responseType: ReagentVo,
        errors: [REAGENT_EXCEPTION.ReagentNotFoundException.code],
    })
    async getOne(@Query() query: ReagentIdDto) {
        return this.reagentService.getOne(query.id);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取储存盒内的试剂列表',
        responseType: [ReagentVo],
    })
    async list(@Query() query: ReagentListDto) {
        return this.reagentService.list(query.orgId, query.nodeId);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新试剂信息',
        responseType: ReagentVo,
        errors: [REAGENT_EXCEPTION.ReagentNotFoundException.code],
    })
    async update(@Body() body: UpdateReagentDto) {
        return this.reagentService.update(body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除试剂',
        responseType: DeleteReagentResultVo,
    })
    async delete(@Body('id') id: string | string[]) {
        if (!Array.isArray(id)) id = [id];
        return this.reagentService.delete(id);
    }
}

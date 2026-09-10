import {
    CreateReagentTypeDto,
    UpdateReagentTypeDto,
    ReagentTypeIdDto,
    ListReagentTypeDto,
    ReagentTypeVo,
} from './reagent-type.dto.js';
import { ReagentTypeService } from './internal/reagent-type.service.js';
import REAGENT_TYPE_EXCEPTION from './reagent-type.exception.js';

import { ApiRoute, CurrentUser } from '@/platform/http/decorators/index.js';
import type { AccessTokenClaim } from '@/core/identity/index.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('试剂类型模块')
@Controller('reagent-type')
export class ReagentTypeController {
    constructor(private readonly reagentTypeService: ReagentTypeService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建试剂类型预设',
        responseType: ReagentTypeVo,
        errors: [REAGENT_TYPE_EXCEPTION.ReagentTypeNotAdminException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateReagentTypeDto) {
        return this.reagentTypeService.create(user.sub, body);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织内所有试剂类型',
        responseType: [ReagentTypeVo],
    })
    async list(@Query() query: ListReagentTypeDto) {
        return this.reagentTypeService.list(query.orgId);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新试剂类型',
        responseType: ReagentTypeVo,
        errors: [
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotFoundException.code,
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotAdminException.code,
        ],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateReagentTypeDto) {
        return this.reagentTypeService.update(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除试剂类型',
        errors: [
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotFoundException.code,
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotAdminException.code,
        ],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: ReagentTypeIdDto) {
        await this.reagentTypeService.delete(user.sub, body.id);
    }
}

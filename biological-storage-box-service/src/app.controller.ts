import { AppService } from './app.service.js';

import { ChangeLoggerLevelDto } from './app.dto.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { ApiRoute } from '@/common/decorators/index.js';
import { Logger } from '@/common/services/index.js';

import { Controller, Get, Body, Post, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';

@Controller()
@ApiTags('应用')
export class AppController {
    private readonly logger = new Logger(AppController.name);
    constructor(private readonly appService: AppService) {}

    @Get('health')
    @ApiRoute({
        auth: 'public',
        summary: '健康检查',
        description: '检查应用的运行状态，返回基本的健康信息。',
    })
    getHealth() {
        return this.appService.getHealth();
    }

    @Post('/change-logging-level')
    @ApiRoute({
        auth: 'required',
        summary: '动态调整日志级别',
        description: '通过此接口可以在运行时动态调整日志记录器的级别，适用于测试或调试场景。',
    })
    changeLoggerLevel(@Body() body: ChangeLoggerLevelDto) {
        PinoLogger.root.level = body.level;
        const message = `Logger level changed to [${body.level}]`;
        this.logger.info(message);
        return message;
    }
}
@Controller('test')
@ApiTags('测试')
export class TestController {
    private readonly logger = new Logger(TestController.name);
    constructor(
        private readonly appService: AppService,
        private readonly databaseService: DatabaseService
    ) {}

    @Get('hello-world')
    @ApiRoute({
        auth: 'public',
        summary: 'Hello World 测试',
        description: '返回一个简单的 "Hello World" 消息，用于测试基本的路由和控制器功能。',
    })
    getHello() {
        return this.appService.getHello();
    }

    @Get('simulate-error')
    @ApiRoute({
        auth: 'required',
        summary: '模拟错误',
        description: '此接口会抛出一个模拟的 HTTP 418 错误，用于测试全局异常过滤器的功能。',
    })
    simulateError() {
        throw new HttpException(
            {
                message: 'I am a teapot - This is a simulated error for testing purposes.',
                code: 'I_AM_A_TEAPOT',
                timestamp: new Date().toISOString(),
            },
            HttpStatus.I_AM_A_TEAPOT
        );
    }

    /**
     * 模拟慢请求（2 秒延迟）
     */
    @Get('slow-request')
    @ApiRoute({
        auth: 'required',
        summary: '模拟慢请求',
        description:
            '此接口会模拟一个慢请求，延迟 2 秒后返回响应，用于测试请求超时和性能监控功能。',
    })
    async slowRequest() {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { message: 'This request took 2 seconds' };
    }

    /**
     * 模拟超慢请求（4 秒延迟）
     */
    @Get('very-slow-request')
    @ApiRoute({
        auth: 'required',
        summary: '模拟超慢请求',
        description:
            '此接口会模拟一个超慢请求，延迟 4 秒后返回响应，用于测试请求超时和性能监控功能。',
    })
    async verySlowRequest() {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        return { message: 'This request took 4 seconds' };
    }
}

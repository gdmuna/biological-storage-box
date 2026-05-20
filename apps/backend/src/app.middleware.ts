import { Logger } from '@/common/services/index.js';

import { AllConfig } from '@/constants/index.js';

import { AlsService } from '@/infra/als/als.service.js';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { ulid } from 'ulid';

@Injectable()
export class RequestPreprocessingMiddleware implements NestMiddleware {
    constructor(private readonly configService: ConfigService<AllConfig, true>) {}

    use(req: Request, res: Response, next: NextFunction) {
        const requestIdHeader = this.configService.get('http.requestIdHeader', { infer: true });
        const reqId = req.headers[requestIdHeader] ?? ulid();
        req.id = typeof reqId === 'string' ? reqId : reqId[0];
        res.setHeader(requestIdHeader, req.id);
        req.version = this.configService.get('app.appVersion', { infer: true });
        next();
    }
}

@Injectable()
export class RequestScopeMiddleware implements NestMiddleware {
    constructor(private readonly alsService: AlsService) {}
    use(req: Request, _: Response, next: NextFunction) {
        const requestContext = {
            requestId: typeof req.id === 'string' ? req.id : String(req.id ?? 'unknown'),
            time: Date.now(),
            version: req.version,
            metadata: {},
        };
        this.alsService.run(requestContext, () => {
            next();
        });
    }
}

@Injectable()
export class CorsMiddleware implements NestMiddleware {
    private readonly logger = new Logger(CorsMiddleware.name);

    constructor(private readonly configService: ConfigService<AllConfig, true>) {}

    use(req: Request, res: Response, next: NextFunction) {
        const origin = (req.headers.origin as string) || (req.headers.referer as string);

        // 预检请求单独处理
        if (req.method === 'OPTIONS') {
            if (this.isOriginAllowed(origin)) {
                this.setCorsHeaders(res, origin);
                res.sendStatus(204);
            } else {
                this.logger.debug(
                    {
                        requestId: req.id,
                        origin,
                        method: req.method,
                        url: req.url,
                    },
                    'CORS preflight rejected'
                );
                res.status(403).json({
                    success: false,
                    code: 'CORS_FORBIDDEN',
                    message: origin
                        ? `Origin "${origin}" is not allowed by CORS policy`
                        : 'CORS policy rejected this request',
                    requestId: req.id ?? 'unknown',
                });
            }
            return;
        }

        // 实际请求：检查CORS
        if (this.isOriginAllowed(origin)) {
            this.setCorsHeaders(res, origin);
            next();
        } else {
            this.logger.debug(
                {
                    requestId: req.id,
                    origin,
                    method: req.method,
                    url: req.url,
                },
                'CORS rejected'
            );
            res.status(403).json({
                success: false,
                code: 'CORS_FORBIDDEN',
                message: origin
                    ? `Origin "${origin}" is not allowed by CORS policy`
                    : 'CORS policy rejected this request',
                requestId: req.id,
            });
        }
    }

    /**
     * 验证CORS源是否被允许
     */
    private isOriginAllowed(origin: string | undefined): boolean {
        // 允许没有origin的请求（如移动应用、桌面应用、CURL等）
        if (!origin) {
            return true;
        }

        if (this.configService.get('app.isDev', { infer: true })) {
            return true;
        }

        const allowedOrigins = this.configService.get('http.corsAllowedOrigin', {
            infer: true,
        });
        return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
    }

    /**
     * 设置CORS响应头
     */
    private setCorsHeaders(res: Response, origin: string | undefined): void {
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        const { corsAllowedHeaders, corsAllowedMethods, corsPreflightMaxAgeSeconds } =
            this.configService.get('http', { infer: true });
        res.header('Access-Control-Allow-Headers', corsAllowedHeaders);
        res.header('Access-Control-Allow-Methods', corsAllowedMethods);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', String(corsPreflightMaxAgeSeconds));
    }
}

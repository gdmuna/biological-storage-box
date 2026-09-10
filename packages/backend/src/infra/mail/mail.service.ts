import { AllConfig } from '@/constants/index.js';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
    private transporter!: Transporter;

    constructor(private readonly configService: ConfigService<AllConfig, true>) {}

    onModuleInit() {
        const cfg = this.configService.get('mail', { infer: true });
        this.transporter = nodemailer.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            auth: {
                user: cfg.user,
                pass: cfg.pass,
            },
        });
    }

    /**
     * 发送纯文本/HTML 邮件。
     *
     * @param to 收件人地址。
     * @param subject 主题。
     * @param text 纯文本正文（可选，html 优先）。
     * @param html HTML 正文（可选）。
     */
    async sendMail(params: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
    }): Promise<void> {
        const cfg = this.configService.get('mail', { infer: true });
        await this.transporter.sendMail({
            from: cfg.from,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
        });
    }

    /**
     * 发送 6 位验证码邮件（快捷方法）。
     */
    async sendVerificationCode(to: string, code: string): Promise<void> {
        await this.sendMail({
            to,
            subject: '【BSB】邮箱验证码',
            html: `
                <p>您好，</p>
                <p>您的验证码为：<strong style="font-size:24px;letter-spacing:4px">${code}</strong></p>
                <p>验证码 10 分钟内有效，请勿泄露。</p>
                <p>如非本人操作，请忽略此邮件。</p>
            `,
            text: `您的验证码为：${code}，10 分钟内有效。`,
        });
    }
}

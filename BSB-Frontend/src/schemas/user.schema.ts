import { z } from 'zod/v4';

export const UserInfoSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
    nickname: z.string().nullable(),
    realname: z.string().nullable(),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;

export const LoginFormSchema = z.object({
    account: z.string().min(3),
    password: z.string().min(8),
});

export type LoginForm = z.infer<typeof LoginFormSchema>;

export const RegisterFormSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
});

export type RegisterForm = z.infer<typeof RegisterFormSchema>;

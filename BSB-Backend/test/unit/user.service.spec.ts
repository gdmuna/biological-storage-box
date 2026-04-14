import { UserService } from '@/modules/user/user.service.js';
import { UserRepository } from '@/modules/user/user.repository.js';
import {
    UserNotFoundException,
    OldPasswordWrongException,
    EmailSameException,
} from '@/modules/user/user.exception.js';

import bcrypt from 'bcryptjs';

describe('UserService', () => {
    const passwordHash = bcrypt.hashSync('P@ssw0rd!', 10);

    const mockUserRepository: jest.Mocked<
        Pick<UserRepository, 'findById' | 'findByEmail' | 'update' | 'search'>
    > = {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        update: jest.fn(),
        search: jest.fn(),
    };

    const mockConfigService: any = {
        get: jest.fn().mockReturnValue(10),
    };

    let service: UserService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new UserService(
            mockUserRepository as unknown as UserRepository,
            mockConfigService
        );
    });

    describe('getMyInfo', () => {
        it('should return user info without passwordHash', async () => {
            mockUserRepository.findById.mockResolvedValue({
                id: 'u_1',
                username: 'test',
                email: 'test@example.com',
                passwordHash,
                nickname: 'Nick',
                realname: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.getMyInfo('u_1');
            expect(result).toMatchObject({ id: 'u_1', username: 'test', nickname: 'Nick' });
            expect(result).not.toHaveProperty('passwordHash');
        });

        it('should throw UserNotFoundException when user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(service.getMyInfo('nonexistent')).rejects.toThrow(UserNotFoundException);
        });
    });

    describe('updateInfo', () => {
        it('should update nickname and realname', async () => {
            mockUserRepository.findById.mockResolvedValue({
                id: 'u_1',
                username: 'test',
                email: 'test@example.com',
                passwordHash,
                nickname: null,
                realname: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockUserRepository.update.mockResolvedValue({
                id: 'u_1',
                username: 'test',
                email: 'test@example.com',
                passwordHash,
                nickname: 'NewNick',
                realname: 'Real Name',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.updateInfo('u_1', {
                nickname: 'NewNick',
                realname: 'Real Name',
            });
            expect(result.nickname).toBe('NewNick');
            expect(result.realname).toBe('Real Name');
            expect(result).not.toHaveProperty('passwordHash');
        });
    });

    describe('updatePassword', () => {
        it('should update password when old password is correct', async () => {
            mockUserRepository.findById.mockResolvedValue({
                id: 'u_1',
                username: 'test',
                email: 'test@example.com',
                passwordHash,
                nickname: null,
                realname: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockUserRepository.update.mockResolvedValue({} as any);

            await expect(
                service.updatePassword('u_1', {
                    oldPassword: 'P@ssw0rd!',
                    newPassword: 'NewP@ssw0rd!',
                })
            ).resolves.toBeUndefined();
            expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
        });

        it('should throw OldPasswordWrongException when old password is wrong', async () => {
            mockUserRepository.findById.mockResolvedValue({
                id: 'u_1',
                username: 'test',
                email: 'test@example.com',
                passwordHash,
                nickname: null,
                realname: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await expect(
                service.updatePassword('u_1', {
                    oldPassword: 'WrongPass1',
                    newPassword: 'NewP@ssw0rd!',
                })
            ).rejects.toThrow(OldPasswordWrongException);
        });
    });

    describe('searchUsers', () => {
        it('should return search results excluding current user', async () => {
            mockUserRepository.search.mockResolvedValue([
                { id: 'u_2', username: 'other', nickname: null, email: 'other@example.com' },
            ]);

            const result = await service.searchUsers('other', 'u_1', 10);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('u_2');
            expect(mockUserRepository.search).toHaveBeenCalledWith('other', 'u_1', 10);
        });
    });

    describe('updateEmail', () => {
        it('should throw EmailSameException when new email equals current', async () => {
            mockUserRepository.findById.mockResolvedValue({
                id: 'u_1',
                username: 'test',
                email: 'test@example.com',
                passwordHash,
                nickname: null,
                realname: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await expect(service.updateEmail('u_1', 'test@example.com', '123456')).rejects.toThrow(
                EmailSameException
            );
        });
    });
});

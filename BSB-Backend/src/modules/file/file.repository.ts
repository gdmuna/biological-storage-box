import { DatabaseService } from '@/infra/index.js';

import type { Prisma } from '@root/prisma/generated/client.js';
import type { FileStatus } from '@root/prisma/generated/enums.js';
import type { FileModel, FileUncheckedCreateInput } from '@root/prisma/generated/models.js';

import { Injectable } from '@nestjs/common';

type Tx = Prisma.TransactionClient;

@Injectable()
export class FileRepository {
    constructor(private readonly db: DatabaseService) {}

    create(data: FileUncheckedCreateInput, tx?: Tx): Promise<FileModel> {
        return (tx ?? this.db).file.create({ data });
    }

    findById(id: string, tx?: Tx): Promise<FileModel | null> {
        return (tx ?? this.db).file.findUnique({ where: { id } });
    }

    // findBySha256(sha256: string, tx?: Tx): Promise<FileModel | null> {
    //     return (tx ?? this.db).file.findFirst({
    //         where: { sha256, status: 'ACTIVE' },
    //         orderBy: { createdAt: 'desc' },
    //     });
    // }

    updateStatus(
        id: string,
        status: FileStatus,
        uploadId?: string | null,
        tx?: Tx
    ): Promise<FileModel> {
        return (tx ?? this.db).file.update({
            where: { id },
            data: { status, ...(uploadId !== undefined ? { uploadId } : {}) },
        });
    }

    softDelete(id: string, tx?: Tx): Promise<FileModel> {
        return (tx ?? this.db).file.update({ where: { id }, data: { status: 'DELETED' } });
    }

    softDeleteMany(ids: string[], tx?: Tx): Promise<{ count: number }> {
        return (tx ?? this.db).file.updateMany({
            where: { id: { in: ids } },
            data: { status: 'DELETED' },
        });
    }
}

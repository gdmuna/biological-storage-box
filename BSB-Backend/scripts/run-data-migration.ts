/**
 * 数据迁移脚本：将 Root → Node(ROOM) + Box → Node(BOX)
 * 执行方式: cd BSB-Backend && pnpm tsx scripts/run-data-migration.ts
 *
 * 前置条件:
 *   1. 已执行 P1 全部 schema migration
 *   2. 已备份数据库
 *
 * 回滚方式:
 *   由于旧数据保留（Root + Box 表未删除），可直接回滚前端/后端代码，
 *   旧表数据不受影响。
 */
import { PrismaClient } from '../prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function migrateRootsToNodes() {
    console.log('=== 迁移 Root → Node(ROOM) ===');
    const roots = await prisma.root.findMany();
    console.log(`找到 ${roots.length} 个 Root 记录`);

    for (const root of roots) {
        const existing = await prisma.node.findFirst({
            where: { id: root.id },
        });
        if (existing) {
            console.log(`  跳过（已迁移）: ${root.id} ${root.name}`);
            continue;
        }

        await prisma.node.create({
            data: {
                id: root.id,
                orgId: root.orgId,
                parentId: null,
                name: root.name,
                description: root.description,
                type: 'ROOM',
                createdAt: root.createdAt,
                updatedAt: root.updatedAt,
            },
        });
        console.log(`  ✓ 迁移 Root → Node(ROOM): ${root.id} ${root.name}`);
    }
}

async function migrateBoxesToNodes() {
    console.log('\n=== 迁移 Box → Node(BOX) ===');
    const boxes = await prisma.box.findMany({
        include: { aliases: true, images: true },
    });
    console.log(`找到 ${boxes.length} 个 Box 记录`);

    for (const box of boxes) {
        const existing = await prisma.node.findFirst({
            where: { id: box.id },
        });
        if (existing) {
            console.log(`  跳过（已迁移）: ${box.id} ${box.name}`);
            continue;
        }

        // parentId 优先使用 nodeId（旧 Node 层级），其次 rootId（Room 层级）
        const parentId = box.nodeId ?? box.rootId ?? null;

        // 创建 Node(BOX)
        await prisma.node.create({
            data: {
                id: box.id,
                orgId: box.orgId,
                parentId: parentId,
                name: box.name,
                description: box.description,
                type: 'BOX',
                createdAt: box.createdAt,
                updatedAt: box.updatedAt,
            },
        });

        // 创建 NodeGridConfig
        await prisma.nodeGridConfig.create({
            data: {
                nodeId: box.id,
                rows: box.rows,
                cols: box.cols,
            },
        });

        // 迁移 BoxAlias → NodeAlias
        for (const alias of box.aliases) {
            await prisma.nodeAlias.create({
                data: {
                    id: alias.id,
                    nodeId: box.id,
                    alias: alias.alias,
                    createdAt: alias.createdAt,
                },
            });
        }

        // 迁移 BoxImage → NodeImage
        for (const image of box.images) {
            await prisma.nodeImage.create({
                data: {
                    id: image.id,
                    nodeId: box.id,
                    imageUrl: image.imageUrl,
                    createdAt: image.createdAt,
                },
            });
        }

        console.log(
            `  ✓ 迁移 Box → Node(BOX): ${box.id} ${box.name} (parent: ${parentId ?? 'null'})`
        );
    }
}

async function migrateReagentNodeIds() {
    console.log('\n=== 更新 Reagent.nodeId ===');
    const reagents = await prisma.reagent.findMany();
    console.log(`找到 ${reagents.length} 个 Reagent 记录`);

    for (const reagent of reagents) {
        if (reagent.nodeId) {
            console.log(`  跳过（已有 nodeId）: ${reagent.id}`);
            continue;
        }
        await prisma.reagent.update({
            where: { id: reagent.id },
            data: { nodeId: reagent.boxId },
        });
    }
    console.log('  ✓ Reagent.nodeId 全部更新完成');
}

async function main() {
    console.log('开始数据迁移...\n');
    try {
        await migrateRootsToNodes();
        await migrateBoxesToNodes();
        await migrateReagentNodeIds();
        console.log('\n✅ 数据迁移完成');
    } catch (e) {
        console.error('\n❌ 迁移失败:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

import { z } from 'zod/v4';

export const NodeImageSchema = z.object({
    id: z.string(),
    nodeId: z.string(),
    imageUrl: z.string(),
    createdAt: z.string(),
});

export type NodeImage = z.infer<typeof NodeImageSchema>;

export const NodeSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    type: z.enum(['ROOT', 'CONTAINER', 'BOX', 'BOX_SLOT']).default('CONTAINER'),
    description: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    gridConfig: z.object({ rows: z.number(), cols: z.number() }).nullable().optional(),
    images: z.array(NodeImageSchema).optional(),
    _count: z.object({ children: z.number() }).optional(),
});

export const NodeWithChildrenSchema: z.ZodType<NodeWithChildren> = z.lazy(() =>
    NodeSchema.extend({
        children: z.array(NodeWithChildrenSchema).optional(),
    })
);

export type Node = z.infer<typeof NodeSchema>;
export type NodeWithChildren = z.infer<typeof NodeSchema> & {
    children?: NodeWithChildren[];
};

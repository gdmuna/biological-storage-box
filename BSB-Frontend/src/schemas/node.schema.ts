import { z } from 'zod/v4';

export const NodeSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
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

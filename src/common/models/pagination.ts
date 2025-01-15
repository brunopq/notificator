import { z, ZodSchema } from "zod"

export const paginationInputSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().default(0),
})

export const paginatedSchema = <T extends ZodSchema>(schema: T) =>
  z.object({
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
    data: z.array(schema),
  })

export type PaginationInput = z.infer<typeof paginationInputSchema>
export type Paginated<T extends ZodSchema> = z.infer<
  ReturnType<typeof paginatedSchema<T>>
>

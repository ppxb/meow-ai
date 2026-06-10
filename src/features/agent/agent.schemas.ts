import { z } from 'zod'

export const agentOptionSchema = z.object({
  type: z.enum(['boolean', 'string', 'number']),
  default: z.union([z.boolean(), z.string(), z.number()]),
  label: z.string(),
  label_key: z.string().optional(),
  description: z.string().optional(),
  description_key: z.string().optional(),
  icon: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.union([z.string(), z.number()]),
        label: z.string().optional(),
        label_key: z.string().optional()
      })
    )
    .optional()
})

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  version: z.string().default(''),
  sort_order: z.number().optional(),
  icon: z.string().optional(),
  labels: z.record(z.string(), z.object({ name: z.string(), description: z.string() })).optional(),
  supports_sandbox: z.boolean().optional(),
  options: z.record(z.string(), agentOptionSchema).optional()
})

export const agentListSchema = z.object({
  agents: z.array(agentSchema).default([]),
  count: z.number().default(0),
  default_agent: z.string().optional(),
  allowed_model_ids: z.array(z.string()).nullable().optional()
})

export type Agent = z.infer<typeof agentSchema>
export type AgentList = z.infer<typeof agentListSchema>

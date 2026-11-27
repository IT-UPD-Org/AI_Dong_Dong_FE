import { apiClient } from './client';

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  instructions: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillCreateInput {
  slug: string;
  name: string;
  description: string;
  instructions: string;
  enabled?: boolean;
}

export interface SkillUpdateInput {
  slug?: string;
  name?: string;
  description?: string;
  instructions?: string;
  enabled?: boolean;
}

function normalizeSkill(raw: Skill): Skill {
  return {
    ...raw,
    id: String(raw.id),
    slug: raw.slug ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    instructions: raw.instructions ?? '',
    enabled: Boolean(raw.enabled),
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

export const skillsApi = {
  async getSkills(page = 1, limit = 20, q?: string): Promise<Skill[]> {
    const params = new URLSearchParams();
    params.set('page', String(Math.max(1, page)));
    params.set('limit', String(Math.min(100, Math.max(1, limit))));
    if (q && q.trim()) {
      params.set('q', q.trim());
    }

    const data = await apiClient<Skill[]>(`/api/admin/skills?${params.toString()}`);
    return (data || []).map(normalizeSkill);
  },

  async getSkill(id: string): Promise<Skill> {
    const data = await apiClient<Skill>(`/api/admin/skills/${encodeURIComponent(id)}`);
    return normalizeSkill(data);
  },

  async createSkill(input: SkillCreateInput): Promise<Skill> {
    const data = await apiClient<Skill>('/api/admin/skills', {
      method: 'POST',
      body: JSON.stringify({
        slug: input.slug.trim(),
        name: input.name.trim(),
        description: input.description.trim(),
        instructions: input.instructions.trim(),
        enabled: input.enabled ?? true,
      }),
    });
    return normalizeSkill(data);
  },

  async updateSkill(id: string, input: SkillUpdateInput): Promise<Skill> {
    const payload: Partial<SkillCreateInput> = {};
    if (input.slug !== undefined) payload.slug = input.slug.trim();
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.instructions !== undefined) payload.instructions = input.instructions.trim();
    if (input.enabled !== undefined) payload.enabled = input.enabled;

    const data = await apiClient<Skill>(`/api/admin/skills/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeSkill(data);
  },
};

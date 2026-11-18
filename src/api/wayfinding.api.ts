import { apiClient } from './client';
import { mapLevelToModelType } from './chat.api';
import type { AgentLevel, WayfindingRoutePayload } from './types';

export interface QueryWayfindingInput {
  content: string;
  modelLevel?: AgentLevel;
  defaultStartRoomId?: string;
}

export const wayfindingApi = {
  query(input: QueryWayfindingInput): Promise<WayfindingRoutePayload> {
    return apiClient<WayfindingRoutePayload>('/api/wayfinding/query', {
      method: 'POST',
      body: JSON.stringify({
        content: input.content,
        model_type: mapLevelToModelType(input.modelLevel),
        ...(input.defaultStartRoomId ? { default_start_room_id: input.defaultStartRoomId } : {}),
      }),
    });
  },
};

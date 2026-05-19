import { serviceGet, serviceRequest } from '@/shared/api/httpClient.ts';
import { poll } from '@/shared/utils/poll.ts';

export interface TaskStatusDetails {
  status: 'PENDING' | 'SUCCESSFUL' | 'ERROR';
  message: string;
  retryAfter: string | null;
}

export interface TaskResponse {
  id: string;
  type: string;
  taskStatus: TaskStatusDetails;
  inserted: string;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10;

export async function createSyncTask(viewId: string): Promise<{ id: string }> {
  return serviceRequest<{ id: string }>('POST', '/tasks', {
    type: 'CACHE_GAME_VIEW_DATA_TASK',
    arguments: { viewId },
  });
}

export async function getTask(taskId: string, signal?: AbortSignal): Promise<TaskResponse> {
  return serviceGet<TaskResponse>(`/tasks/${taskId}`, signal);
}

export async function pollSyncTask(taskId: string, signal?: AbortSignal): Promise<TaskResponse> {
  return (
    (await poll(
      (sig) => getTask(taskId, sig),
      (task) => task.taskStatus.status !== 'PENDING',
      POLL_INTERVAL_MS,
      MAX_POLL_ATTEMPTS,
      signal,
    )) ?? {
      id: taskId,
      type: 'CACHE_GAME_VIEW_DATA_TASK',
      taskStatus: { status: 'ERROR', message: 'Sync timed out', retryAfter: null },
      inserted: new Date().toISOString(),
    }
  );
}

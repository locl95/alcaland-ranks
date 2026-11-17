import { Page, Route } from '@playwright/test';
import {
  Game,
  GetViewsResponse,
  OperationResult,
  OperationStatus,
  SimpleView,
  ViewDataResponse,
  ViewExtraArguments,
  ViewResponse,
} from '@/features/views/api/view-types';
import { TaskResponse } from '@/features/views/api/taskApi';
import { makeSimpleView } from './views';
import { API, VALID_VIEW_ID } from '../constants';

/**
 * What the app sends to create or edit a ladder: the contract, written down here because the
 * app builds it inline. `E` is a member as the game sends them.
 */
export interface LadderRequest<E> {
  name: string;
  entities: E[];
  published: boolean;
  featured: boolean;
  game: Game;
  extraArguments?: ViewExtraArguments;
}

export interface SyncRequest {
  type: 'CACHE_GAME_VIEW_DATA_TASK';
  arguments: { viewId: string };
}

interface Options<M> {
  game: Game;
  /** The ladders in the owner's list; by default the one the tests open, VALID_VIEW_ID. */
  ladders?: SimpleView[];
  /** The ladder's members, as /views/{id}/data sends them. */
  members?: M[];
  /** Who owns the ladder; null answers 403, as for someone else's ladder. */
  owner?: string | null;
  isGuild?: boolean;
}

/**
 * The backend behind one game's ladders, keeping their state so a journey can change it as
 * the real one would (an operation finishing, a sync bringing new members) and read back what
 * the app sent. `M` is a member as /data sends them, `E` as the app sends them.
 */
export interface LadderBackend<M, E> {
  ladders: SimpleView[];
  members: M[];
  /** What every create, edit and delete operation answers when polled. */
  operationStatus: OperationStatus;
  /** The members a sync brings, once it starts. */
  membersAfterSync: M[] | null;

  created(): LadderRequest<E> | undefined;
  edited(): LadderRequest<E> | undefined;
  syncRequested(): SyncRequest | undefined;
  deleted(): boolean;
}

/** A ladder of the owner's list. */
export const ladder = (game: Game, id = VALID_VIEW_ID, name = 'My Ladder'): SimpleView =>
  makeSimpleView(id, name, 'testuser', game);

const CREATED_ID = 'created-ladder';

export async function mockLadderBackend<M, E>(
  page: Page,
  { game, ladders, members = [], owner = 'testuser', isGuild = false }: Options<M>,
): Promise<LadderBackend<M, E>> {
  const sent: { method: string; path: string; body: unknown }[] = [];
  const bodyOf = <T>(method: string, path: string) =>
    sent.find((r) => r.method === method && r.path === path)?.body as T | undefined;

  const backend: LadderBackend<M, E> = {
    ladders: ladders ?? [ladder(game)],
    members,
    operationStatus: 'COMPLETED',
    membersAfterSync: null,
    created: () => bodyOf('POST', '/views'),
    edited: () => bodyOf('PUT', `/views/${VALID_VIEW_ID}`),
    syncRequested: () => bodyOf('POST', '/tasks'),
    deleted: () => sent.some((r) => r.method === 'DELETE' && r.path === `/views/${VALID_VIEW_ID}`),
  };
  const ladderName = () => backend.ladders.find((l) => l.id === VALID_VIEW_ID)?.name ?? 'My Ladder';
  const reply = <T>(route: Route, body: T) => route.fulfill({ json: body });

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();
    const body: unknown = request.postData() ? request.postDataJSON() : null;
    sent.push({ method, path, body });

    if (path === '/views' && method === 'GET') {
      if (url.searchParams.get('game') !== game.toLowerCase()) return route.fallback();
      const pageNumber = Number(url.searchParams.get('page') ?? 1);
      const limit = Number(url.searchParams.get('limit') ?? backend.ladders.length);
      const start = (pageNumber - 1) * limit;
      return reply<GetViewsResponse>(route, {
        metadata: { totalCount: backend.ladders.length },
        records: backend.ladders.slice(start, start + limit),
      });
    }
    if (path === '/views' && method === 'POST') {
      const { name, extraArguments } = body as LadderRequest<E>;
      backend.ladders.push({ ...ladder(game, CREATED_ID, name), extraArguments });
      return reply(route, { id: 'op-create', resourceId: CREATED_ID });
    }
    if (path === `/views/${VALID_VIEW_ID}` && method === 'GET') {
      if (owner === null) return route.fulfill({ status: 403 });
      return reply<ViewResponse>(route, {
        owner,
        extraArguments: isGuild ? { type: 'wow', isGuild: true } : null,
      });
    }
    if (path === `/views/${VALID_VIEW_ID}` && method === 'PUT') {
      return reply(route, { id: 'op-edit' });
    }
    if (path === `/views/${VALID_VIEW_ID}` && method === 'DELETE') {
      backend.ladders = backend.ladders.filter((l) => l.id !== VALID_VIEW_ID);
      return reply(route, { id: 'op-delete' });
    }
    if (path === `/views/${VALID_VIEW_ID}/data`) {
      return reply<ViewDataResponse<M>>(route, { viewName: ladderName(), data: backend.members });
    }
    if (path === `/views/${VALID_VIEW_ID}/cached-data`) {
      return reply<ViewDataResponse<M>>(route, { viewName: ladderName(), data: [] });
    }
    const operation = path.match(/^\/operations\/(.+)$/);
    if (operation) {
      return reply<OperationResult>(route, {
        id: operation[1],
        status: backend.operationStatus,
        resourceId: CREATED_ID,
      });
    }
    if (path === '/tasks' && method === 'POST') {
      backend.members = backend.membersAfterSync ?? backend.members;
      return reply(route, { id: 'sync-task' });
    }
    if (path === '/tasks/sync-task') {
      // Running at the first poll, done at the next: the button says it is syncing in between.
      const polls = sent.filter((r) => r.path === path).length;
      return reply<TaskResponse>(route, {
        id: 'sync-task',
        type: 'CACHE_GAME_VIEW_DATA_TASK',
        taskStatus: {
          status: polls > 1 ? 'SUCCESSFUL' : 'PENDING',
          retryAfter: new Date(Date.now() + 60_000).toISOString(),
        },
        inserted: new Date().toISOString(),
      });
    }
    // Everyone a ladder is made with exists.
    if (path === '/entities/exists') {
      const { entities } = body as { entities: E[] };
      return reply(route, { exist: entities, nonExisting: [], unchecked: [] });
    }
    if (path === '/entities/exists/guild') {
      return reply(route, { guild: { ...(body as object), blizzardId: 1 } });
    }
    return route.fallback();
  });

  return backend;
}

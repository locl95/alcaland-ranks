import { serviceGet } from '@/shared/api/httpClient.ts';
import { Season } from '@/games/wow/retail/api/wow-types.ts';

export const wowStaticKey = () => ['wowStatic'] as const;

export const fetchWowStatic = (): Promise<Season> => serviceGet<Season>(`/sources/wow/static`);

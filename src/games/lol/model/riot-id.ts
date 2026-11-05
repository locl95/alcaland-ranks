export interface RiotId {
  name: string;
  tag: string;
}

export function parseRiotId(input: string): RiotId | null {
  const parts = input.split('#');
  if (parts.length !== 2) return null;
  const name = parts[0].trim();
  const tag = parts[1].trim();
  return name && tag ? { name, tag } : null;
}

export const riotIdKey = ({ name, tag }: RiotId): string =>
  `${name.toLowerCase()}#${tag.toLowerCase()}`;

export const formatNotFoundMessage = (riotIds: string[]): string | null =>
  riotIds.length === 0
    ? null
    : `${riotIds.join(', ')} ${riotIds.length === 1 ? 'was' : 'were'} not found. Check the Riot ID.`;

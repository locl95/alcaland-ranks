import keystone from '@/games/wow/retail/assets/keystone.webp';
import { useStaticData } from '@/games/wow/retail/hooks/useStaticData.ts';
import { ViewsPage } from '@/features/views/components/views-page/views-page.tsx';
import { CreateWowView } from '@/games/wow/retail/components/landing/create-wow-view.tsx';

const WOW_COPY = {
  members: 'Characters',
  emptyTitle: 'Start your first ladder',
  emptyText:
    "Track the characters you play with, or pull in a whole guild, and see who's climbing this season.",
  signedOutTitle: "Track your group's Mythic+ climb",
  signedOutText:
    'Build a ladder from your characters or a whole guild and follow every score through the season.',
};

export function WowLanding() {
  const { data: season } = useStaticData();

  return (
    <ViewsPage
      mark={keystone}
      title="Mythic+ ladder tracker"
      subtitle={season?.name ? { label: 'Season', value: season.name } : undefined}
      copy={WOW_COPY}
      CreateDialog={CreateWowView}
    />
  );
}

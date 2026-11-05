import challenger from '@/games/lol/assets/challenger.webp';
import { ViewsPage } from '@/features/views/components/views-page/views-page.tsx';
import { CreateLolView } from './create-lol-view.tsx';

const LOL_COPY = {
  members: 'Players',
  emptyTitle: 'Start your first ladder',
  emptyText: 'Add the players you queue with and see who climbs fastest in Solo and Flex.',
  signedOutTitle: "Track your group's ranked climb",
  signedOutText: 'Build a ladder from Riot IDs and follow every LP gained and lost this season.',
};

export function LolLanding() {
  return (
    <ViewsPage
      mark={challenger}
      title="Ranked ladder tracker"
      copy={LOL_COPY}
      CreateDialog={CreateLolView}
    />
  );
}

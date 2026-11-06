import warrior from '@/shared/warcraft/assets/classes/warrior.webp';
import { ViewsPage } from '@/features/views/components/views-page/views-page.tsx';
import { CreateForeverView } from './create-forever-view.tsx';

const FOREVER_COPY = {
  members: 'Characters',
  emptyTitle: 'Start your first ladder',
  emptyText: 'Add the characters you play with and see who levels up fastest.',
  signedOutTitle: "Track your group's leveling race",
  signedOutText: 'Build a ladder from your characters and follow every level and item upgrade.',
};

export function ForeverLanding() {
  return (
    <ViewsPage
      mark={warrior}
      title="Leveling ladder tracker"
      copy={FOREVER_COPY}
      CreateDialog={CreateForeverView}
    />
  );
}

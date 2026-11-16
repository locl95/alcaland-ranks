import logo from '@/games/wow/forever/assets/logo.webp';
import { ViewsPage } from '@/features/views/components/views-page/views-page.tsx';
import { CreateForeverView } from './create-forever-view.tsx';

const FOREVER_COPY = {
  members: 'Characters',
  emptyTitle: 'Start your first ladder',
  emptyText:
    'Add the characters you play with, or pull in a whole guild, and see who comes out on top.',
  signedOutTitle: "Track your group's Forever ladder",
  signedOutText:
    'Build a ladder from your characters or a whole guild and follow every level and item upgrade they make.',
};

export function ForeverLanding() {
  return (
    <ViewsPage
      mark={logo}
      title="Forever ladder tracker"
      copy={FOREVER_COPY}
      CreateDialog={CreateForeverView}
    />
  );
}

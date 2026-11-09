import { CLASS_IMAGES } from '@/games/wow/class-images.ts';
import { ViewsPage } from '@/features/views/components/views-page/views-page.tsx';
import { CreateForeverView } from './create-forever-view.tsx';

const FOREVER_COPY = {
  members: 'Characters',
  emptyTitle: 'Start your first ladder',
  emptyText: 'Add the characters you play with and see who comes out on top.',
  signedOutTitle: "Track your group's Forever ladder",
  signedOutText:
    'Build a ladder from your characters and follow every level and item upgrade they make.',
};

export function ForeverLanding() {
  return (
    <ViewsPage
      mark={CLASS_IMAGES.warrior}
      title="Forever ladder"
      copy={FOREVER_COPY}
      CreateDialog={CreateForeverView}
    />
  );
}

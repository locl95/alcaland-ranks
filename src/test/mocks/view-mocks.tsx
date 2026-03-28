import type { View } from '@/features/views/model/View.tsx';
import type { SimpleView } from '@/features/views/api/SimpleView.tsx';

export const MockViewsList = ({
  views,
  onViewClick,
  onCreateView,
  onDeleteView,
}: {
  views: View[];
  onViewClick: (id: string) => void;
  onCreateView: () => void;
  onDeleteView: (id: string) => void;
}) => (
  <div data-testid="views-list">
    {views.map((v) => (
      <div key={v.id} data-testid={`view-item-${v.id}`}>
        <button data-testid={`open-${v.id}`} onClick={() => onViewClick(v.id)}>
          Open {v.simpleView.name}
        </button>
        <button data-testid={`delete-${v.id}`} onClick={() => onDeleteView(v.id)}>
          Delete {v.simpleView.name}
        </button>
      </div>
    ))}
    <button data-testid="list-create-btn" onClick={onCreateView}>
      Create from list
    </button>
  </div>
);

export const MockCreateView = ({
  open,
  onCreateView,
  onOpenChange,
}: {
  open: boolean;
  onCreateView: (v: View) => void;
  onOpenChange: (open: boolean) => void;
}) =>
  open ? (
    <div data-testid="create-view-dialog">
      <button
        data-testid="submit-create"
        onClick={() =>
          onCreateView({
            id: 'pending-id',
            simpleView: makeSimpleView('pending-id', 'Pending View'),
            isSynced: false,
          })
        }
      >
        Submit
      </button>
      <button data-testid="close-dialog" onClick={() => onOpenChange(false)}>
        Close
      </button>
    </div>
  ) : null;

export const MockViewDetail = ({
  onBack,
}: {
  onBack: () => void;
}) => (
  <div data-testid="view-detail">
    <button data-testid="back-btn" onClick={onBack}>
      Back
    </button>
  </div>
);

export const makeSimpleView = (id: string, name: string): SimpleView => ({
  id,
  name,
  owner: 'testuser',
  published: false,
  entitiesIds: [],
  game: 'WOW',
  featured: false,
});

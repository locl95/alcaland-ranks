import { useNavigate } from 'react-router-dom';
import type { View } from '@/features/views/model/view.ts';
import type { SimpleView } from '@/features/views/api/view-types.ts';

export const MockViewsList = ({
  views,
  deletingViewId: _deletingViewId,
  onViewClick,
  onCreateView,
  onDeleteView,
}: {
  views: View[];
  deletingViewId: string | null;
  onViewClick: (id: string) => void;
  onCreateView: () => void;
  onDeleteView: (id: string) => void;
}) => (
  <div data-testid="views-list">
    {views.map((v) => (
      <div key={v.simpleView.id} data-testid={`view-item-${v.simpleView.id}`}>
        {v.status === 'deleting' && <span>Deleting...</span>}
        <button
          data-testid={`open-${v.simpleView.id}`}
          onClick={() => onViewClick(v.simpleView.id)}
        >
          Open {v.simpleView.name}
        </button>
        <button
          data-testid={`delete-${v.simpleView.id}`}
          onClick={() => onDeleteView(v.simpleView.id)}
        >
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
  onCreateView,
  onClose,
}: {
  onCreateView: (v: View) => void;
  onClose: () => void;
}) => (
  <div data-testid="create-view-dialog">
    <button
      data-testid="submit-create"
      onClick={() =>
        onCreateView({
          operationId: 'pending-id',
          simpleView: makeSimpleView('pending-id', 'Pending View'),
          status: 'pending',
        })
      }
    >
      Submit
    </button>
    <button data-testid="close-dialog" onClick={onClose}>
      Close
    </button>
  </div>
);

export const MockViewDetail = () => {
  const navigate = useNavigate();
  return (
    <div data-testid="view-detail">
      <button data-testid="back-btn" onClick={() => navigate('/')}>
        Back
      </button>
    </div>
  );
};

export const makeSimpleView = (id: string, name: string): SimpleView => ({
  id,
  name,
  owner: 'testuser',
  published: false,
  entitiesIds: [],
  game: 'WOW',
  featured: false,
});

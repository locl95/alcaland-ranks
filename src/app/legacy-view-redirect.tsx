import { Navigate, useParams } from 'react-router-dom';

export function LegacyViewRedirect() {
  const { viewId } = useParams();
  return <Navigate to={`/wow/${viewId}`} replace />;
}

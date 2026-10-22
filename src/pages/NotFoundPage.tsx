import { Link } from 'react-router';
import { useSearchPalette } from '../lib/searchContext';
import { useDocumentTitle } from '../hooks/usePageMeta';

export function NotFoundPage({ title = 'This trail doesn’t go anywhere', message }: { title?: string; message?: string }) {
  useDocumentTitle('Page not found');
  const palette = useSearchPalette();
  return (
    <div className="container not-found">
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
      <h1 className="page-header__title" style={{ marginTop: 'var(--s-4)' }}>
        {title}
      </h1>
      <p className="page-header__lede">
        {message ?? 'The page you were looking for does not exist. It may have been renamed, or the link may be mistyped.'}
      </p>
      <div className="button-row" style={{ marginTop: 'var(--s-8)' }}>
        <Link to="/" className="btn btn--primary">
          Go to the homepage
        </Link>
        <button type="button" className="btn" onClick={() => palette.open()}>
          Search ScoutPath
        </button>
        <Link to="/merit-badges" className="btn btn--ghost">
          Browse merit badges
        </Link>
      </div>
    </div>
  );
}

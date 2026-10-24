import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

/** Last-resort error screen. Rendered outside the shell, so it is self-contained. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error';
  return (
    <main className="container not-found" id="main">
      <p className="eyebrow">ScoutPath</p>
      <h1 className="page-header__title" style={{ marginTop: 'var(--s-4)' }}>
        Something went wrong on this page.
      </h1>
      <p className="page-header__lede">Your saved progress is unaffected, because it lives in this browser. Try reloading, or head back to the homepage.</p>
      <p className="small muted" style={{ marginTop: 'var(--s-4)' }}>
        <code>{message}</code>
      </p>
      <div className="button-row" style={{ marginTop: 'var(--s-8)' }}>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Reload
        </button>
        <Link to="/" className="btn">
          Homepage
        </Link>
      </div>
    </main>
  );
}

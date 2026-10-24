/** Placeholder shown while a page's code is loading: flat blocks in the shape of a page header and a list. */
export function PageSkeleton() {
  return (
    <div className="container page" role="status" aria-live="polite">
      <span className="sr-only">Loading page…</span>
      <div className="page-skeleton" aria-hidden="true">
        <span className="skeleton page-skeleton__crumbs" />
        <span className="skeleton page-skeleton__title" />
        <span className="skeleton page-skeleton__lede" />
        <span className="skeleton page-skeleton__lede page-skeleton__lede--short" />
        <div className="page-skeleton__rows">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="skeleton page-skeleton__row" />
          ))}
        </div>
      </div>
    </div>
  );
}

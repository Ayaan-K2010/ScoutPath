import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

interface Props {
  title: ReactNode;
  eyebrow?: ReactNode;
  lede?: ReactNode;
  crumbs?: Crumb[];
  meta?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  sans?: boolean;
}

export function PageHeader({ title, eyebrow, lede, crumbs, meta, actions, aside, sans = false }: Props) {
  const body = (
    <div>
      {crumbs && <Breadcrumbs items={crumbs} />}
      {eyebrow && <p className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>{eyebrow}</p>}
      <h1 className={`page-header__title${sans ? ' page-header__title--sans' : ''}`}>{title}</h1>
      {lede && <p className="page-header__lede">{lede}</p>}
      {meta && <div className="page-header__meta">{meta}</div>}
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
  return (
    <header className={`page-header${aside ? ' page-header--split' : ''}`}>
      {body}
      {aside}
    </header>
  );
}

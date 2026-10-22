import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon: Icon, title, children, actions, center = false }: { icon: LucideIcon; title: string; children?: ReactNode; actions?: ReactNode; center?: boolean }) {
  return (
    <div className={`empty${center ? ' empty--center' : ''}`}>
      <span className="empty__icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <h2 className="empty__title">{title}</h2>
      {children && <div className="empty__body">{children}</div>}
      {actions && <div className="button-row">{actions}</div>}
    </div>
  );
}

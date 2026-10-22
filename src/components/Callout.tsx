import { Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'alert' | 'safety'; title?: ReactNode; children: ReactNode }) {
  const Icon = tone === 'warn' || tone === 'alert' ? TriangleAlert : tone === 'safety' ? ShieldCheck : Info;
  return (
    <div className={`callout${tone === 'warn' || tone === 'safety' ? ' callout--warn' : tone === 'alert' ? ' callout--alert' : ''}`} role="note">
      <Icon size={18} aria-hidden="true" />
      <div>
        {title && <p><strong>{title}</strong></p>}
        <div style={{ marginTop: title ? 'var(--s-1)' : 0 }}>{children}</div>
      </div>
    </div>
  );
}

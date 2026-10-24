import { ExternalLink as ExternalIcon } from './icons';
import type { ReactNode } from 'react';
import { domainOf } from '../lib/format';

/**
 * Links that leave ScoutPath always open in a new tab without passing a
 * referrer or window handle, and always say where they go.
 */
export function ExternalLink({ href, children, className, showDomain = false }: { href: string; children: ReactNode; className?: string; showDomain?: boolean }) {
  const domain = domainOf(href);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer external" referrerPolicy="no-referrer" className={`external-link ${className ?? ''}`}>
      {children}
      {showDomain && <span className="domain">{domain}</span>}
      <ExternalIcon size={14} aria-hidden="true" />
      <span className="sr-only">(leaves ScoutPath and opens {domain} in a new tab)</span>
    </a>
  );
}

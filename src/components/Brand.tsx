import { Link } from 'react-router';

/** ScoutPath's original mark: a round cloth patch with a stitched edge and a compass needle. */
export function BrandMark({ className = 'brand__mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <circle cx="18" cy="18" r="17" fill="#2E3820" />
      <circle cx="18" cy="18" r="14.5" fill="#4C5A2C" />
      <circle cx="18" cy="18" r="12.25" fill="none" stroke="#E6D9BA" strokeWidth="1.2" strokeDasharray="2.4 2" />
      <path d="M22.5 13.5 19.6 19.6 13.5 22.5 16.4 16.4Z" fill="#F3ECDA" />
      <path d="M22.5 13.5 19.6 19.6 16.4 16.4Z" fill="#9E2B22" />
    </svg>
  );
}

export function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link to="/" className="brand" onClick={onNavigate}>
      <BrandMark />
      <span className="brand__name">ScoutPath</span>
    </Link>
  );
}

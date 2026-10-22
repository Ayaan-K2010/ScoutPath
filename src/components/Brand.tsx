import { Link } from 'react-router';

/** ScoutPath's original mark: a winding trail ending at a waypoint. */
export function BrandMark({ className = 'brand__mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="#193C32" />
      <path d="M8 24c3-1 4-4 7-5s6 1 8-3 0-6 1-8" fill="none" stroke="#E8EFE5" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="8" r="2.6" fill="#C99A4A" />
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

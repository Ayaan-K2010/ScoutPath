import { Link } from 'react-router';
import type { Badge } from '../features/content/model';
import { BadgeMark } from './BadgeMark';
import { VerificationTag } from './StatusTag';

export function EagleTag({ badge }: { badge: Badge }) {
  if (badge.eagle.status === 'required') return <span className="tag tag--brand" title={badge.eagle.note}>Eagle-required*</span>;
  if (badge.eagle.status === 'required-option') return <span className="tag tag--outline" title={badge.eagle.group}>Eagle option*</span>;
  return null;
}

export function BadgeCard({ badge, categoryName, resourceCount }: { badge: Badge; categoryName: string; resourceCount: number }) {
  return (
    <Link to={`/merit-badges/${badge.slug}`} className="badge-card">
      <div className="badge-card__top">
        <BadgeMark category={badge.category} />
        <div>
          <h3 className="badge-card__name">{badge.name}</h3>
          <p className="badge-card__category">{categoryName}</p>
        </div>
      </div>
      {badge.detail && <p className="badge-card__desc">{badge.detail.description}</p>}
      <div className="badge-card__foot">
        <span>{badge.version ? `${resourceCount} linked resources` : 'Outline in progress'}</span>
        <span className="tag-list">
          <EagleTag badge={badge} />
          <VerificationTag status={badge.version ? badge.version.status : 'missing'} />
        </span>
      </div>
    </Link>
  );
}

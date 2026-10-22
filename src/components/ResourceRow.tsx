import { Link } from 'react-router';
import type { Mapping, Resource } from '../schemas/content';
import { PUBLISHER_TYPE_LABELS, RESOURCE_TYPE_LABELS, resourcePath } from '../lib/labels';
import { domainOf, minutesLabel } from '../lib/format';
import { BookmarkButton } from './BookmarkButton';
import { ExternalLink } from './ExternalLink';
import { ReportLinkButton } from './ReportLinkButton';
import { ResourceTypeIcon } from './ResourceTypeIcon';
import { Highlight } from './Highlight';

const RELEVANCE: Record<Mapping['relevance'], string> = {
  core: 'Core reading',
  supporting: 'Supporting',
  background: 'Background',
};

interface Props {
  resource: Resource;
  relevance?: Mapping['relevance'];
  compact?: boolean;
  highlight?: string[];
  headingLevel?: 'h3' | 'h4';
}

export function ResourceRow({ resource, relevance, compact = false, highlight = [], headingLevel: H = 'h3' }: Props) {
  return (
    <article className={`resource-row${compact ? ' resource-row--compact' : ''}`}>
      <ResourceTypeIcon type={resource.type} />
      <div>
        <div className="resource-row__head">
          <H className="resource-row__title">
            <Link to={resourcePath(resource)}>
              <Highlight text={resource.title} terms={highlight} />
            </Link>
          </H>
        </div>
        <p className="resource-row__publisher">
          {resource.publisher} · {PUBLISHER_TYPE_LABELS[resource.publisherType]} · {RESOURCE_TYPE_LABELS[resource.type]}
          {resource.durationVerified && resource.durationMinutes !== null && <> · {minutesLabel(resource.durationMinutes)}</>}
        </p>
        <p className="resource-row__desc">
          <Highlight text={resource.description} terms={highlight} />
        </p>
        <div className="resource-row__foot">
          <div className="tag-list">
            {relevance && <span className={`relevance relevance--${relevance}`}>{RELEVANCE[relevance]}</span>}
            {resource.linkStatus === 'broken' && <span className="tag tag--alert">Link reported broken</span>}
          </div>
          <div className="resource-row__actions">
            <ExternalLink href={resource.url} className="btn btn--sm">
              Open on {domainOf(resource.url)}
            </ExternalLink>
            <BookmarkButton resourceId={resource.id} title={resource.title} />
            {!compact && <ReportLinkButton resource={resource} />}
          </div>
        </div>
      </div>
    </article>
  );
}

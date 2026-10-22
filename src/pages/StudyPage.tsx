import { ArrowRight, Hourglass } from 'lucide-react';
import { Link } from 'react-router';
import { Callout } from '../components/Callout';
import { PageHeader } from '../components/PageHeader';
import { VerificationTag } from '../components/StatusTag';
import { content } from '../features/content/data';
import { deckStats } from '../features/study/logic';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUserData } from '../hooks/useUserData';

export function StudyPage() {
  useDocumentTitle('Study tools');
  const data = useUserData();
  const awaiting = content.badges.filter((b) => b.version && (b.detail?.studySetIds.length ?? 0) === 0);

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Study' }]}
        title="Study tools"
        lede="Study guides, flashcards and practice quizzes written by ScoutPath. Every card and question cites the public resource it is based on."
      />
      <div className="stack-lg">
        <Callout title="Practice, not a test">
          Practice quizzes are not official exams, and a score here never counts as completing a requirement. Your counselor or leader decides when you
          have met a requirement.
        </Callout>
        <div className="study-grid">
          {content.studySets.map((s) => {
            const stats = deckStats(s.flashcards, data.flashcards[s.id] ?? {});
            const attempts = data.quizzes[s.id]?.attempts ?? [];
            const last = attempts[attempts.length - 1];
            return (
              <Link key={s.id} to={`/study/${s.slug}`} className="study-card">
                <span className="tag-list">
                  <VerificationTag status={s.status} label={s.status === 'verified' ? 'Reviewed' : 'Awaiting expert review'} />
                </span>
                <h2 className="study-card__title">{s.title}</h2>
                <p className="small muted">{s.description}</p>
                <span className="study-card__counts">
                  <span>{s.guide.sections.length} guide sections</span>
                  <span>
                    {stats.known}/{stats.total} cards known
                  </span>
                  <span>{last ? `Last quiz ${last.score}/${last.total}` : `${s.quiz.length} questions`}</span>
                </span>
              </Link>
            );
          })}
        </div>
        {awaiting.length > 0 && (
          <section aria-labelledby="awaiting-title">
            <div className="section-head">
              <h2 id="awaiting-title">Awaiting study materials</h2>
            </div>
            <ul className="plain-list">
              {awaiting.map((b) => (
                <li key={b.id}>
                  <Link to={`/merit-badges/${b.slug}`} className="continue-row continue-row--simple">
                    <span>
                      <span className="continue-row__title">
                        <Hourglass size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                        {b.name}
                      </span>
                      <span className="continue-row__meta">
                        Requirement pages and resources are available. Study materials will be written once the topic has been reviewed; ScoutPath does not
                        publish practice material for unreviewed requirements.
                      </span>
                    </span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

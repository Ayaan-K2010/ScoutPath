import { ArrowLeft, ArrowRight, BookOpen, Check, Layers, ListChecks, Printer, RotateCcw, Shuffle } from '../components/icons';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Callout } from '../components/Callout';
import { ExternalLink } from '../components/ExternalLink';
import { PageHeader } from '../components/PageHeader';
import { PrintHeader } from '../components/PrintHeader';
import { VerificationTag } from '../components/StatusTag';
import { content } from '../features/content/data';
import { recordQuiz, resetFlashcards, setFlashcard } from '../features/progress/actions';
import { buildDeck, deckStats, scoreQuiz, shuffle, type DeckMode } from '../features/study/logic';
import { useDocumentTitle, useRecordVisit } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { formatTimestamp } from '../lib/format';
import { useToast } from '../lib/toastContext';
import type { StudySet } from '../schemas/content';
import { NotFoundPage } from './NotFoundPage';

function Sources({ ids }: { ids: string[] }) {
  return (
    <p className="sources">
      Based on:{' '}
      {ids.map((id, i) => {
        const r = content.resourceById.get(id);
        if (!r) return null;
        return (
          <span key={id}>
            <ExternalLink href={r.url}>{r.publisher}</ExternalLink>
            {i < ids.length - 1 ? '; ' : ''}
          </span>
        );
      })}
    </p>
  );
}

function Guide({ set }: { set: StudySet }) {
  return (
    <div className="stack-lg">
      <div className="button-row no-print" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()}>
          <Printer size={15} aria-hidden="true" /> Print study guide
        </button>
      </div>
      <p className="prose">{set.guide.intro}</p>
      <div>
        {set.guide.sections.map((s) => (
          <section key={s.heading} className="guide-section">
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
            <Sources ids={s.sourceResourceIds} />
          </section>
        ))}
      </div>
      {set.guide.vocabulary.length > 0 && (
        <section id="vocabulary" aria-labelledby="vocab-title">
          <div className="section-head section-head--serif">
            <h2 id="vocab-title">Key vocabulary</h2>
          </div>
          <dl className="vocab">
            {set.guide.vocabulary.map((v) => (
              <div key={v.term}>
                <dt>{v.term}</dt>
                <dd>{v.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {set.quiz.length > 0 && (
        <section aria-labelledby="review-q-title">
          <div className="section-head">
            <h2 id="review-q-title">Review questions</h2>
            <Link to="?tab=quiz" className="text-link no-print">
              Take them as a practice quiz
            </Link>
          </div>
          <ol style={{ paddingLeft: 'var(--s-6)', display: 'grid', gap: 'var(--s-2)' }} className="prose">
            {set.quiz.map((q) => (
              <li key={q.id}>{q.prompt}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Flashcards({ set }: { set: StudySet }) {
  const data = useUserData();
  const update = useUpdateUser();
  const marks = useMemo(() => data.flashcards[set.id] ?? {}, [data.flashcards, set.id]);
  const defaultOrder = useMemo(() => set.flashcards.map((c) => c.id), [set.flashcards]);
  const [mode, setMode] = useState<DeckMode>('all');
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // The deck is fixed when the mode or order changes, so marking a card does not pull it out from under the user.
  const [deckIds, setDeckIds] = useState<string[]>(defaultOrder);

  const rebuild = (nextMode: DeckMode, nextOrder: string[], currentMarks = marks) => {
    const byId = new Map(set.flashcards.map((c) => [c.id, c]));
    const ordered = nextOrder.map((id) => byId.get(id)).filter((c) => c !== undefined);
    setMode(nextMode);
    setOrder(nextOrder);
    setDeckIds(buildDeck(ordered, currentMarks, nextMode).map((c) => c.id));
    setIndex(0);
    setFlipped(false);
  };

  const deck = deckIds.map((id) => set.flashcards.find((c) => c.id === id)!).filter(Boolean);
  const card = deck[Math.min(index, deck.length - 1)];
  const stats = deckStats(set.flashcards, marks);

  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => (deck.length ? (i + delta + deck.length) % deck.length : 0));
  };

  const mark = (value: 'known' | 'review') => {
    if (!card) return;
    update((d) => setFlashcard(d, set.id, card.id, marks[card.id] === value ? null : value));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div>
      <div className="catalog-toolbar" style={{ maxWidth: '40rem', marginInline: 'auto' }}>
        <div className="view-toggle" role="group" aria-label="Which cards">
          <button type="button" aria-pressed={mode === 'all'} onClick={() => rebuild('all', order)}>
            All {stats.total}
          </button>
          <button type="button" aria-pressed={mode === 'review'} onClick={() => rebuild('review', order)} disabled={stats.review === 0 && mode !== 'review'}>
            For review {stats.review}
          </button>
          <button type="button" aria-pressed={mode === 'unmarked'} onClick={() => rebuild('unmarked', order)}>
            Unmarked {stats.unmarked}
          </button>
        </div>
        <div className="button-row">
          <button type="button" className="btn btn--sm" onClick={() => rebuild(mode, shuffle(defaultOrder))}>
            <Shuffle size={14} aria-hidden="true" /> Shuffle
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              update((d) => resetFlashcards(d, set.id));
              rebuild('all', defaultOrder, {});
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </div>

      {!card ? (
        <div className="empty empty--center" style={{ maxWidth: '40rem', marginInline: 'auto' }}>
          <h2 className="empty__title">{mode === 'review' ? 'No cards marked for review' : 'All cards are marked'}</h2>
          <p className="empty__body">Switch to “All” to go through the full deck again.</p>
          <button type="button" className="btn" onClick={() => rebuild('all', order)}>
            Show all cards
          </button>
        </div>
      ) : (
        <>
          <div className="flashcard-stage">
            <button
              type="button"
              className="flashcard"
              data-flipped={flipped}
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? `Answer: ${card.back}. Activate to show the question.` : `Question: ${card.front}. Activate to reveal the answer.`}
            >
              <span className="flashcard__face" aria-hidden={flipped}>
                <span className="flashcard__label">
                  Question {Math.min(index, deck.length - 1) + 1} of {deck.length}
                </span>
                <span className="flashcard__text">{card.front}</span>
                <span className="flashcard__hint">Tap or press Enter to flip</span>
              </span>
              <span className="flashcard__face flashcard__face--back" aria-hidden={!flipped}>
                <span className="flashcard__label">Answer</span>
                <span className="flashcard__text">{card.back}</span>
                <span className="flashcard__hint">Tap to see the question again</span>
              </span>
            </button>
          </div>
          <div className="flashcard-controls">
            <button type="button" className="btn" onClick={() => go(-1)} aria-label="Previous card">
              <ArrowLeft size={16} aria-hidden="true" /> Prev
            </button>
            <div className="button-row">
              <button type="button" className="btn btn--sm" aria-pressed={marks[card.id] === 'review'} onClick={() => mark('review')}>
                <RotateCcw size={14} aria-hidden="true" /> {marks[card.id] === 'review' ? 'Marked for review' : 'Review again'}
              </button>
              <button type="button" className={`btn btn--sm${marks[card.id] === 'known' ? ' btn--primary' : ''}`} aria-pressed={marks[card.id] === 'known'} onClick={() => mark('known')}>
                <Check size={14} aria-hidden="true" /> {marks[card.id] === 'known' ? 'Known' : 'I know this'}
              </button>
            </div>
            <button type="button" className="btn" onClick={() => go(1)} aria-label="Next card">
              Next <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div style={{ maxWidth: '40rem', margin: 'var(--s-4) auto 0' }}>
            <Sources ids={card.sourceResourceIds} />
            <p className="field__hint">
              {stats.known} known · {stats.review} marked for review · progress saved in this browser
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Quiz({ set }: { set: StudySet }) {
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();
  const [questions, setQuestions] = useState(set.quiz);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const attempts = data.quizzes[set.id]?.attempts ?? [];

  const restart = (subset = set.quiz) => {
    setQuestions(subset);
    setIndex(0);
    setAnswers({});
    setDone(false);
  };

  if (questions.length === 0) return <p className="muted">This study set has no practice questions yet.</p>;

  if (done) {
    const result = scoreQuiz(questions, answers);
    const wrong = questions.filter((q) => result.wrongIds.includes(q.id));
    return (
      <div className="stack-lg" style={{ maxWidth: '44rem' }}>
        <div className="quiz-card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--s-6)', alignItems: 'center' }}>
          <div
            className="score-ring"
            style={{ background: `conic-gradient(var(--forest) ${(result.score / result.total) * 360}deg, var(--sage-pale) 0)` }}
            role="img"
            aria-label={`${result.score} of ${result.total} correct`}
          >
            <span style={{ background: 'var(--paper)', borderRadius: '50%', width: '6.25rem', height: '6.25rem', display: 'grid', placeItems: 'center' }}>
              {result.score}/{result.total}
            </span>
          </div>
          <div>
            <h3 className="quiz-card__prompt">{result.score === result.total ? 'Every answer correct.' : `${result.score} of ${result.total} correct.`}</h3>
            <p className="small muted" style={{ marginTop: 'var(--s-2)' }}>
              Practice only. This score is saved in your browser and is not an official test result.
            </p>
            <div className="button-row" style={{ marginTop: 'var(--s-4)' }}>
              <button type="button" className="btn btn--primary" onClick={() => restart()}>
                <RotateCcw size={16} aria-hidden="true" /> Restart quiz
              </button>
              {wrong.length > 0 && (
                <button type="button" className="btn" onClick={() => restart(wrong)}>
                  Retry the {wrong.length} I missed
                </button>
              )}
            </div>
          </div>
        </div>
        {wrong.length > 0 && (
          <section aria-labelledby="missed-title">
            <div className="section-head">
              <h3 id="missed-title" style={{ fontSize: 'var(--fs-lg)' }}>
                Review incorrect answers
              </h3>
            </div>
            <ol className="plain-list stack">
              {wrong.map((q) => (
                <li key={q.id} className="panel">
                  <p style={{ fontWeight: 650 }}>{q.prompt}</p>
                  <p className="small" style={{ marginTop: 'var(--s-2)', color: 'var(--alert-ink)' }}>
                    Your answer: {q.choices[answers[q.id]] ?? 'No answer'}
                  </p>
                  <p className="small" style={{ color: 'var(--ok-ink)' }}>
                    Correct answer: {q.choices[q.answerIndex]}
                  </p>
                  <p className="small" style={{ marginTop: 'var(--s-2)' }}>
                    {q.explanation}
                  </p>
                  <Sources ids={q.sourceResourceIds} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    );
  }

  const q = questions[index];
  const chosen = answers[q.id];
  const answered = chosen !== undefined;
  const correct = chosen === q.answerIndex;

  const finish = () => {
    const result = scoreQuiz(questions, answers);
    update((d) => recordQuiz(d, set.id, result.score, result.total, result.wrongIds));
    toast.show('Quiz result saved');
    setDone(true);
  };

  return (
    <div className="stack-lg">
      <div className="quiz-card">
        <p className="eyebrow">
          Question {index + 1} of {questions.length}
        </p>
        <div className="meter" style={{ margin: 'var(--s-3) 0 var(--s-6)' }} role="img" aria-label={`Question ${index + 1} of ${questions.length}`}>
          <span className="meter__fill" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <h3 className="quiz-card__prompt" id={`q-${q.id}`}>
          {q.prompt}
        </h3>
        <ul className="choices" aria-labelledby={`q-${q.id}`}>
          {q.choices.map((choice, i) => {
            const result = !answered ? undefined : i === q.answerIndex ? 'correct' : i === chosen ? 'wrong' : undefined;
            return (
              <li key={choice}>
                <button
                  type="button"
                  className="choice"
                  data-result={result}
                  disabled={answered}
                  aria-pressed={chosen === i}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                >
                  <span className="choice__key" aria-hidden="true">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>
                    {choice}
                    {result === 'correct' && <span className="sr-only"> (correct answer)</span>}
                    {result === 'wrong' && <span className="sr-only"> (your answer, incorrect)</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div aria-live="polite">
          {answered && (
            <div className={`feedback ${correct ? 'feedback--correct' : 'feedback--wrong'}`}>
              <p>
                <strong>{correct ? 'Correct.' : `Not quite. The answer is ${String.fromCharCode(65 + q.answerIndex)}.`}</strong>
              </p>
              <p>{q.explanation}</p>
              <Sources ids={q.sourceResourceIds} />
            </div>
          )}
        </div>
        <div className="button-row" style={{ marginTop: 'var(--s-6)', justifyContent: 'space-between' }}>
          <span className="small muted">Practice quiz · not an official test</span>
          {index < questions.length - 1 ? (
            <button type="button" className="btn btn--primary" disabled={!answered} onClick={() => setIndex((i) => i + 1)}>
              Next question <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="btn btn--primary" disabled={!answered} onClick={finish}>
              See results
            </button>
          )}
        </div>
      </div>
      {attempts.length > 0 && (
        <p className="small muted">
          Previous attempts:{' '}
          {attempts
            .slice(-5)
            .reverse()
            .map((a) => `${a.score}/${a.total} on ${formatTimestamp(a.at)}`)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}

const TABS = [
  { id: 'guide', label: 'Study guide', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Practice quiz', icon: ListChecks },
] as const;

export function StudySetPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const set = content.studyBySlug.get(slug);
  useDocumentTitle(set ? set.title : 'Study set not found');
  useRecordVisit(set ? { kind: 'study', id: set.id, title: set.title, path: `/study/${set.slug}` } : null);
  if (!set) return <NotFoundPage title="We couldn’t find that study set" />;
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'guide') as (typeof TABS)[number]['id'];
  const linked = set.requirementIds.map((id) => content.requirements.get(id)).filter((n) => n !== undefined);

  return (
    <div className="container page">
      <PrintHeader title={`${set.title} study guide`} />
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Study', to: '/study' }, { label: set.title }]}
        eyebrow="Study set"
        title={set.title}
        lede={set.description}
        meta={<VerificationTag status={set.status} label={set.status === 'verified' ? 'Reviewed' : 'Awaiting expert review'} />}
      />
      <div className="with-aside">
        <div>
          <div className="tabs no-print" role="tablist" aria-label="Study modes">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                className="tab"
                onClick={() => setParams({ tab: t.id }, { replace: true })}
              >
                <t.icon size={16} aria-hidden="true" /> {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'guide' && <Guide set={set} />}
            {tab === 'flashcards' && <Flashcards key={set.id} set={set} />}
            {tab === 'quiz' && <Quiz key={set.id} set={set} />}
          </div>
        </div>
        <aside className="with-aside__aside">
          <Callout title="How this set was made">
            Written by ScoutPath from the public sources cited under each item. It has not yet been reviewed by a qualified expert. If anything here
            conflicts with your instructor or official training, follow them.
          </Callout>
          {linked.length > 0 && (
            <section className="panel" aria-labelledby="covers-title">
              <h2 className="panel__title" id="covers-title">
                Related requirements
              </h2>
              <ul className="plain-list" style={{ display: 'grid', gap: 'var(--s-2)', fontSize: 'var(--fs-sm)' }}>
                {linked.map((n) => (
                  <li key={n.id}>
                    <Link to={n.path}>
                      {n.ownerName} {n.requirement.number} · {n.requirement.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/**
 * Pure study-tool logic: flashcard deck building and quiz scoring.
 */
import type { Flashcard, QuizQuestion } from '../../schemas/content';

export type DeckMode = 'all' | 'review' | 'unmarked';

export function buildDeck(cards: Flashcard[], marks: Record<string, 'known' | 'review'>, mode: DeckMode): Flashcard[] {
  if (mode === 'review') return cards.filter((c) => marks[c.id] === 'review');
  if (mode === 'unmarked') return cards.filter((c) => !marks[c.id]);
  return cards;
}

/** Fisher–Yates shuffle with an injectable random source for testing. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function deckStats(cards: Flashcard[], marks: Record<string, 'known' | 'review'>) {
  const known = cards.filter((c) => marks[c.id] === 'known').length;
  const review = cards.filter((c) => marks[c.id] === 'review').length;
  return { total: cards.length, known, review, unmarked: cards.length - known - review };
}

export interface QuizScore {
  score: number;
  total: number;
  wrongIds: string[];
}

export function scoreQuiz(questions: QuizQuestion[], answers: Record<string, number>): QuizScore {
  const wrongIds = questions.filter((q) => answers[q.id] !== q.answerIndex).map((q) => q.id);
  return { score: questions.length - wrongIds.length, total: questions.length, wrongIds };
}

import { Fragment } from 'react';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wraps matched terms in <mark>. Terms come from the search engine, so prefix and fuzzy matches are highlighted too. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const clean = [...new Set(terms.map((t) => t.trim()).filter((t) => t.length > 1))].sort((a, b) => b.length - a.length);
  if (clean.length === 0) return <>{text}</>;
  const re = new RegExp(`(${clean.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

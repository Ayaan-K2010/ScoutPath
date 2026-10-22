import { content } from '../content/data';
import { createSearch, type LocalSearch } from './searchIndex';

let instance: LocalSearch | null = null;

/** The search index is built on first use so it never slows down the first paint. */
export function getSearch(): LocalSearch {
  instance ??= createSearch(content);
  return instance;
}

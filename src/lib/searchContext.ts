import { createContext, useContext } from 'react';

export const SearchPaletteContext = createContext<{ open: (initial?: string) => void }>({ open: () => {} });

export function useSearchPalette() {
  return useContext(SearchPaletteContext);
}

import { ChevronDown } from './icons';
import { useId, useState, type ReactNode } from 'react';

export function Disclosure({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="disclosure">
      <button type="button" className="disclosure__button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <ChevronDown size={18} className="chevron" aria-hidden="true" />
      </button>
      <div id={id} className={`disclosure__panel${open ? '' : ' is-collapsed'}`}>
        {children}
      </div>
    </div>
  );
}

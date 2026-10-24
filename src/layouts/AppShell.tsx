import { Bookmark, CalendarDays, FolderOpen, GraduationCap, LayoutDashboard, Medal, Menu, Award, Search, Settings, X, Info, ShieldCheck, ScanSearch, Library, FileText } from '../components/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router';
import { Brand } from '../components/Brand';
import { ExternalLink } from '../components/ExternalLink';
import { PageSkeleton } from '../components/PageSkeleton';
import { SearchPalette } from '../components/SearchPalette';
import { ToastProvider } from '../components/ToastProvider';
import { TopoPattern } from '../components/TopoPattern';
import { userStore } from '../features/progress/store';
import { SearchPaletteContext } from '../lib/searchContext';

const PRIMARY = [
  { to: '/merit-badges', label: 'Merit badges', icon: Award },
  { to: '/ranks', label: 'Ranks', icon: Medal },
  { to: '/study', label: 'Study', icon: GraduationCap },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/collections', label: 'Collections', icon: FolderOpen },
];

const PERSONAL = [
  { to: '/dashboard', label: 'My dashboard', icon: LayoutDashboard },
  { to: '/saved', label: 'Saved resources', icon: Bookmark },
  { to: '/settings', label: 'Settings & data', icon: Settings },
];

const ABOUT = [
  { to: '/resources', label: 'Resource library', icon: Library },
  { to: '/about', label: 'About ScoutPath', icon: Info },
  { to: '/coverage', label: 'Content coverage', icon: ScanSearch },
  { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
  { to: '/terms', label: 'Terms of use', icon: FileText },
];

function StorageNotice() {
  const status = userStore.getStatus();
  if (status.persistent && !status.recoveredFromCorruption) return null;
  return (
    <div role="status" style={{ background: 'var(--amber-pale)', color: 'var(--amber-ink)', fontSize: 'var(--fs-sm)', padding: 'var(--s-2) 0' }}>
      <div className="container">
        {!status.persistent
          ? 'Your browser is blocking local storage, so progress will be lost when you close this tab. ScoutPath still works; export your data from Settings to keep it.'
          : 'Some saved data in this browser could not be read, so ScoutPath started fresh. The unreadable copy was kept in browser storage as a backup.'}
      </div>
    </div>
  );
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [palette, setPalette] = useState<{ open: boolean; query: string; session: number }>({ open: false, query: '', session: 0 });
  const location = useLocation();
  // Lazy pages load their code on navigation; show a placeholder instead of leaving the old page up.
  const navigation = useNavigation();
  const loadingPage = navigation.state === 'loading' && navigation.location?.pathname !== location.pathname;
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  const openPalette = useCallback((initial = '') => setPalette((p) => ({ open: true, query: initial, session: p.session + 1 })), []);
  const paletteApi = useMemo(() => ({ open: openPalette }), [openPalette]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!location.hash) mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openPalette();
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        openPalette();
      } else if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPalette, drawerOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
  }, [drawerOpen]);

  return (
    <SearchPaletteContext.Provider value={paletteApi}>
      <ToastProvider>
        <div className="app">
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <header className="site-header no-print">
            <div className="container site-header__inner">
              <Brand />
              <nav className="primary-nav" aria-label="Primary">
                {PRIMARY.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-link">
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="header-actions">
                <button type="button" className="search-trigger desktop-only" onClick={() => openPalette()} aria-keyshortcuts="Control+K Meta+K /">
                  <Search size={16} aria-hidden="true" />
                  <span>Search ScoutPath</span>
                  <kbd aria-hidden="true">/</kbd>
                </button>
                <button type="button" className="icon-button mobile-only" onClick={() => openPalette()} aria-label="Search">
                  <Search size={20} />
                </button>
                <NavLink to="/saved" className="icon-button desktop-only" aria-label="Saved resources" title="Saved resources">
                  <Bookmark size={19} />
                </NavLink>
                <NavLink to="/dashboard" className="btn btn--sm desktop-only" style={{ marginLeft: 'var(--s-1)' }}>
                  <LayoutDashboard size={15} aria-hidden="true" /> My dashboard
                </NavLink>
                <button
                  type="button"
                  className="icon-button mobile-only"
                  aria-label="Open menu"
                  aria-expanded={drawerOpen}
                  aria-controls="mobile-drawer"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </header>
          <StorageNotice />

          <div className="drawer no-print" id="mobile-drawer" data-open={drawerOpen} aria-hidden={!drawerOpen} inert={!drawerOpen}>
            <div className="drawer__scrim" onClick={() => setDrawerOpen(false)} />
            <div className="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
              <div className="drawer__head">
                <Brand onNavigate={() => setDrawerOpen(false)} />
                <button type="button" className="icon-button" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <nav className="drawer__nav" aria-label="Mobile">
                <div className="drawer__group-label">Explore</div>
                {PRIMARY.map((item) => (
                  <NavLink key={item.to} to={item.to} className="drawer__link" onClick={() => setDrawerOpen(false)}>
                    <item.icon size={18} aria-hidden="true" /> {item.label}
                  </NavLink>
                ))}
                <div className="drawer__group-label">Your learning</div>
                {PERSONAL.map((item) => (
                  <NavLink key={item.to} to={item.to} className="drawer__link" onClick={() => setDrawerOpen(false)}>
                    <item.icon size={18} aria-hidden="true" /> {item.label}
                  </NavLink>
                ))}
                <div className="drawer__group-label">About</div>
                {ABOUT.map((item) => (
                  <NavLink key={item.to} to={item.to} className="drawer__link" onClick={() => setDrawerOpen(false)}>
                    <item.icon size={18} aria-hidden="true" /> {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          <main id="main" className="app-main" ref={mainRef} tabIndex={-1}>
            {loadingPage ? (
              <PageSkeleton />
            ) : (
              // Keyed by path so each page starts with fresh state.
              <div key={location.pathname}>
                <Outlet />
              </div>
            )}
          </main>

          <footer className="site-footer no-print">
            <TopoPattern className="site-footer__topo" variant="compact" />
            <div className="container">
              <div className="site-footer__grid">
                <div className="site-footer__brand">
                  <Brand />
                  <p className="site-footer__note">
                    ScoutPath is an independent, free learning aid. It is not affiliated with or endorsed by Scouting America. Official requirements
                    and advancement decisions remain with Scouting America and your unit’s authorized leaders and counselors.
                  </p>
                </div>
                <div>
                  <h2>Explore</h2>
                  <ul>
                    <li><Link to="/merit-badges">Merit badges</Link></li>
                    <li><Link to="/ranks">Ranks</Link></li>
                    <li><Link to="/resources">Resource library</Link></li>
                    <li><Link to="/study">Study tools</Link></li>
                    <li><Link to="/search">Search</Link></li>
                  </ul>
                </div>
                <div>
                  <h2>Your data</h2>
                  <ul>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    <li><Link to="/planner">Planner</Link></li>
                    <li><Link to="/collections">Collections</Link></li>
                    <li><Link to="/settings">Export, import & delete</Link></li>
                    <li><Link to="/privacy">Privacy</Link></li>
                  </ul>
                </div>
                <div>
                  <h2>About</h2>
                  <ul>
                    <li><Link to="/about">About ScoutPath</Link></li>
                    <li><Link to="/disclaimer">Disclaimer</Link></li>
                    <li><Link to="/terms">Terms of use</Link></li>
                    <li><Link to="/coverage">Content coverage</Link></li>
                    <li><Link to="/review">Content review tool</Link></li>
                    <li>
                      <ExternalLink href="https://www.scouting.org/">Scouting America (official)</ExternalLink>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="site-footer__base">
                <span>Your progress is stored only in this browser. No accounts, no tracking.</span>
                <span>Content is labeled by verification status. Always confirm with official requirements.</span>
              </div>
            </div>
          </footer>
          <SearchPalette key={palette.session} open={palette.open} initialQuery={palette.query} onClose={() => setPalette((p) => ({ ...p, open: false }))} />
          <ScrollRestoration />
        </div>
      </ToastProvider>
    </SearchPaletteContext.Provider>
  );
}

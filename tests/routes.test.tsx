import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import { userStore } from '../src/features/progress/store';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('routes', () => {
  beforeEach(() => userStore.clear());

  it('renders the homepage with working primary actions', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: /Every requirement/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse merit badges' })).toHaveAttribute('href', '/merit-badges');
    expect(screen.getByRole('link', { name: 'Explore ranks' })).toHaveAttribute('href', '/ranks');
    expect(screen.getAllByText(/not an official Scouting America product|not affiliated with or endorsed by Scouting America/).length).toBeGreaterThan(0);
  });

  it('renders a badge page with its requirement hierarchy', async () => {
    renderAt('/merit-badges/first-aid');
    expect(await screen.findByRole('heading', { level: 1, name: /First Aid/ })).toBeInTheDocument();
    expect(screen.getByText('Bleeding')).toBeInTheDocument();
    expect(screen.getByText('Partial outline: some requirements are not shown yet')).toBeInTheDocument();
  });

  it('shows a content-being-reviewed state for a listed badge without an outline', async () => {
    renderAt('/merit-badges/chess');
    expect(await screen.findByRole('heading', { name: 'Content being reviewed' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /official requirements/i })[0]).toHaveAttribute('target', '_blank');
  });

  it('renders a requirement page and records personal progress locally', async () => {
    const user = userEvent.setup();
    renderAt('/merit-badges/first-aid/requirements/7');
    expect(await screen.findByRole('heading', { level: 1, name: /Heart attack, CPR, and AEDs/ })).toBeInTheDocument();
    expect(screen.getByText('ScoutPath summary · not official wording')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All First Aid requirements' })).toHaveAttribute('href', '/merit-badges/first-aid');
    await user.click(screen.getByLabelText('Learning'));
    expect(userStore.getSnapshot().progress['mb.first-aid.7'].state).toBe('learning');
    expect(JSON.parse(localStorage.getItem('scoutpath:user:v1')!).progress['mb.first-aid.7'].state).toBe('learning');
    expect(userStore.getSnapshot().recent[0].id).toBe('mb.first-aid.7');
  });

  it('bookmarks a resource', async () => {
    const user = userEvent.setup();
    renderAt('/merit-badges/first-aid/requirements/5');
    const save = await screen.findByRole('button', { name: /Save “Adult and child choking/ });
    await user.click(save);
    expect(userStore.getSnapshot().saved['res.redcross-choking']).toBeDefined();
    expect(screen.getByRole('button', { name: /Remove “Adult and child choking/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders rank pages', async () => {
    renderAt('/ranks');
    expect(await screen.findByRole('heading', { level: 1, name: 'Rank advancement' })).toBeInTheDocument();
    for (const name of ['Scout', 'Tenderfoot', 'Second Class', 'First Class', 'Star', 'Life', 'Eagle']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it('renders a rank requirement page', async () => {
    renderAt('/ranks/tenderfoot/requirements/7a');
    expect(await screen.findByRole('heading', { level: 1, name: /Flag etiquette/ })).toBeInTheDocument();
  });

  it.each([
    ['/merit-badges/not-a-badge', /couldn’t find that merit badge/],
    ['/merit-badges/first-aid/requirements/42', /couldn’t find that requirement/],
    ['/ranks/admiral', /couldn’t find that rank/],
    ['/resources/not-real', /couldn’t find that resource/],
    ['/study/not-real', /couldn’t find that study set/],
    ['/collections/not-real', /couldn’t find that collection/],
    ['/totally/unknown/path', /This trail doesn’t go anywhere/],
  ])('shows a not-found page for %s', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the homepage' })).toHaveAttribute('href', '/');
  });

  it('runs a search from the URL', async () => {
    renderAt('/search?q=lightning');
    expect(await screen.findByRole('link', { name: /^Lightning safety/ })).toBeInTheDocument();
  });

  it('builds a study plan without inventing durations', async () => {
    const user = userEvent.setup();
    renderAt('/planner?target=rank.scout');
    const create = await screen.findByRole('button', { name: /Create study plan/ });
    expect(screen.getByText(/no time estimate/)).toBeInTheDocument();
    await user.click(create);
    const plan = userStore.getSnapshot().plans[0];
    expect(plan.target.id).toBe('rank.scout');
    expect(plan.sessions.length).toBeGreaterThan(0);
    expect(plan.sessions.every((s) => s.minutes === null)).toBe(true);
    expect(await screen.findByRole('heading', { name: 'Upcoming' })).toBeInTheDocument();
  });

  it('flips flashcards and gives quiz feedback', async () => {
    const user = userEvent.setup();
    const router = renderAt('/study/camp-ready?tab=flashcards');
    const card = await screen.findByRole('button', { name: /Question: How many Leave No Trace/ });
    await user.click(card);
    expect(screen.getByRole('button', { name: /Answer: Seven/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /I know this/ }));
    expect(userStore.getSnapshot().flashcards['study.camp-ready']['cr-1']).toBe('known');

    await router.navigate('/study/camp-ready?tab=quiz');
    await user.click(await screen.findByRole('button', { name: /Respect wildlife/ }));
    expect(screen.getByText('Correct.')).toBeInTheDocument();
  });

  it('creates a collection from a template', async () => {
    const user = userEvent.setup();
    renderAt('/collections');
    const row = (await screen.findByText('First Aid workshop')).closest('li')!;
    await user.click(within(row).getByRole('button', { name: 'Use template' }));
    expect(userStore.getSnapshot().collections[0].title).toBe('First Aid workshop');
    expect(await screen.findByRole('heading', { level: 1, name: 'First Aid workshop' })).toBeInTheDocument();
  });

  it('renders the settings, coverage, privacy and review pages', async () => {
    for (const [path, heading] of [
      ['/settings', 'Settings and your data'],
      ['/coverage', 'Content coverage'],
      ['/privacy', 'Privacy notice'],
      ['/disclaimer', 'Independent project disclaimer'],
      ['/about', 'About ScoutPath'],
      ['/review', 'Content review tool'],
      ['/dashboard', 'Your learning dashboard'],
      ['/saved', 'Saved resources'],
      ['/resources', 'Resource library'],
    ] as const) {
      const { unmount } = render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      unmount();
    }
  });
});

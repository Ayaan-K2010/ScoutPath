import type { RouteObject } from 'react-router';
import { AppShell } from '../layouts/AppShell';
import { AboutPage, DisclaimerPage, PrivacyPage } from '../pages/InfoPages';
import { BadgeLibraryPage } from '../pages/BadgeLibraryPage';
import { BadgePage } from '../pages/BadgePage';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RankPage } from '../pages/RankPage';
import { RanksPage } from '../pages/RanksPage';
import { RequirementPage } from '../pages/RequirementPage';
import { ResourcePage } from '../pages/ResourcePage';
import { ResourcesPage } from '../pages/ResourcesPage';
import { RouteError } from '../pages/RouteError';
import { SavedPage } from '../pages/SavedPage';
import { SearchPage } from '../pages/SearchPage';
import { StudyPage } from '../pages/StudyPage';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/merit-badges', element: <BadgeLibraryPage /> },
      { path: '/merit-badges/:slug', element: <BadgePage /> },
      { path: '/merit-badges/:slug/requirements/:number', element: <RequirementPage ownerType="badge" /> },
      { path: '/ranks', element: <RanksPage /> },
      { path: '/ranks/:slug', element: <RankPage /> },
      { path: '/ranks/:slug/requirements/:number', element: <RequirementPage ownerType="rank" /> },
      { path: '/resources', element: <ResourcesPage /> },
      { path: '/resources/:id', element: <ResourcePage /> },
      { path: '/saved', element: <SavedPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/study', element: <StudyPage /> },
      { path: '/study/:slug', lazy: async () => ({ Component: (await import('../pages/StudySetPage')).StudySetPage }) },
      { path: '/planner', lazy: async () => ({ Component: (await import('../pages/PlannerPage')).PlannerPage }) },
      { path: '/collections', lazy: async () => ({ Component: (await import('../pages/CollectionsPage')).CollectionsPage }) },
      { path: '/collections/:id', lazy: async () => ({ Component: (await import('../pages/CollectionPage')).CollectionPage }) },
      { path: '/settings', lazy: async () => ({ Component: (await import('../pages/SettingsPage')).SettingsPage }) },
      { path: '/about', element: <AboutPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/disclaimer', element: <DisclaimerPage /> },
      { path: '/coverage', lazy: async () => ({ Component: (await import('../pages/CoveragePage')).CoveragePage }) },
      { path: '/review', lazy: async () => ({ Component: (await import('../pages/ReviewPage')).ReviewPage }) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

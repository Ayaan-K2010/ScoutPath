import { Link } from 'react-router';
import { ExternalLink } from '../components/ExternalLink';
import { PageHeader } from '../components/PageHeader';
import { content } from '../features/content/data';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { formatIsoDate } from '../lib/format';

export function AboutPage() {
  useDocumentTitle('About');
  return (
    <div className="container page">
      <PageHeader crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]} title="About ScoutPath" lede="A free, independent learning library that organizes educational resources around individual Scouts BSA requirements." />
      <article className="article">
        <p>
          Scouts often piece together what a requirement asks by searching across videos, articles, official websites, handbooks, PDFs and troop
          documents. ScoutPath collects trustworthy public resources and organizes them requirement by requirement, so a Scout can open the exact step
          they are working on and find what helps.
        </p>
        <h2>What ScoutPath does</h2>
        <ul>
          <li>Gives each outlined requirement its own page with an original orientation, curated resources and practice material.</li>
          <li>Lets you keep a private record of your learning progress, notes, goals and study plans in your own browser.</li>
          <li>Helps leaders and volunteers build ordered resource collections for meetings and workshops, and share them as files.</li>
          <li>Labels every record with where it came from and whether it has been verified.</li>
        </ul>
        <h2>What ScoutPath does not do</h2>
        <ul>
          <li>It does not award merit badges or ranks, approve advancement, or certify that a requirement is complete.</li>
          <li>It does not replace your merit badge counselor, Scoutmaster, board of review or the official requirements.</li>
          <li>It does not offer messaging, public profiles, leaderboards, accounts or online meetings.</li>
        </ul>
        <h2>How content is built</h2>
        <p>
          Requirement outlines, resource descriptions, orientations and study materials are written by ScoutPath. Official requirement wording is linked
          rather than reproduced unless permission to reproduce it has been established. Resources link to their original publishers. ScoutPath never
          re-hosts videos, articles or pamphlets.
        </p>
        <p>
          Content moves through a review workflow: draft, then verification against official sources, link checking, and safety review for
          safety-sensitive topics. The <Link to="/coverage">coverage report</Link> shows exactly where each badge and rank stands. Today, dataset{' '}
          <code>{content.meta?.datasetVersion}</code> (updated {formatIsoDate(content.meta?.updatedOn)}) contains no records that have been verified
          against official sources yet.
        </p>
        <h2>Built to be free</h2>
        <p>
          ScoutPath is a static website with no server, database, paid API or AI service. It can be hosted on free static hosting, and it keeps working
          offline once loaded. Fonts are self-hosted, and the icons and illustrations are drawn for ScoutPath. It does not use Scouting America logos or
          badge artwork.
        </p>
        <h2>Official resources</h2>
        <p>
          For official requirements and program information, visit <ExternalLink href="https://www.scouting.org/">Scouting America</ExternalLink> and
          talk with your unit leaders. See the <Link to="/disclaimer">disclaimer</Link>, <Link to="/terms">terms of use</Link> and{' '}
          <Link to="/privacy">privacy notice</Link>.
        </p>
      </article>
    </div>
  );
}

export function DisclaimerPage() {
  useDocumentTitle('Disclaimer');
  return (
    <div className="container page">
      <PageHeader crumbs={[{ label: 'Home', to: '/' }, { label: 'Disclaimer' }]} title="Independent project disclaimer" />
      <article className="article">
        <p>
          <strong>ScoutPath is an independent educational project. It is not affiliated with, endorsed by, or operated by Scouting America</strong>{' '}
          (formerly the Boy Scouts of America). Scouting-related names are used only to describe the program this tool helps Scouts study for.
        </p>
        <h2>Official requirements</h2>
        <p>
          Official advancement requirements are set and published by Scouting America. ScoutPath’s requirement pages contain ScoutPath’s own summaries,
          which may simplify, omit or be numbered differently from the official text. Requirements change over time, and which version applies to a
          particular Scout depends on official rules. When anything here differs from the official requirements, the official requirements govern. Ask
          your unit leader when you are unsure which version applies to you.
        </p>
        <h2>Advancement decisions</h2>
        <p>
          Only authorized Scouting volunteers, such as registered merit badge counselors, Scoutmasters and boards of review, can sign off on
          requirements and approve advancement. ScoutPath’s progress tracker is a personal learning record. Marking something “Completed (personal)”
          does not mean it has been completed officially.
        </p>
        <h2>Learning resources and practice tools</h2>
        <p>
          Reading an article, watching a video or passing a practice quiz does not by itself fulfill any requirement. Many requirements ask you to
          demonstrate, discuss, make or do something in person. Practice quizzes are not official tests.
        </p>
        <h2>Safety</h2>
        <p>
          First aid, aquatics, fire, tools, weather and other safety-sensitive topics must be learned with qualified instruction and appropriate
          supervision. Online resources are background reading only. In an emergency, call 911 or your local emergency number.
        </p>
        <h2>External sites</h2>
        <p>
          Resources link to third-party websites that ScoutPath does not control. Their content, availability and privacy practices are their own.
          If a link is broken or inappropriate, use the “Report link” button on the resource.
        </p>
      </article>
    </div>
  );
}

export function PrivacyPage() {
  useDocumentTitle('Privacy');
  return (
    <div className="container page">
      <PageHeader crumbs={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]} title="Privacy notice" lede="Short version: ScoutPath keeps your information in your browser, and nowhere else." />
      <article className="article">
        <h2>What ScoutPath stores</h2>
        <p>When you use ScoutPath, it saves the following in your browser’s local storage, on your device only:</p>
        <ul>
          <li>Your selected rank and badges, requirement progress states and study notes</li>
          <li>Saved resources, recently viewed pages, learning goals and study plans</li>
          <li>Flashcard marks, practice quiz scores and a count of study actions per day</li>
          <li>Collections you create or import, and any link reports you file</li>
        </ul>
        <h2>What ScoutPath does not collect</h2>
        <ul>
          <li>No accounts, names, email addresses, birth dates or ages</li>
          <li>No location data</li>
          <li>No analytics, tracking pixels, advertising or third-party cookies</li>
          <li>No server copy of your progress. ScoutPath has no server that could receive it.</li>
        </ul>
        <p>
          Hosting providers that serve the website’s files may keep standard technical logs (such as IP addresses) for security and operations under
          their own policies. Those logs never include your progress or notes, because that data is never sent.
        </p>
        <h2>Your controls</h2>
        <ul>
          <li>
            <Link to="/settings">Export</Link> all of your data as a file at any time.
          </li>
          <li>Import a previous export, with a choice to merge or replace.</li>
          <li>Delete everything from this browser in one step from Settings.</li>
        </ul>
        <p>Your data does not sync between devices or browsers. Clearing your browser’s site data also removes it.</p>
        <h2>Sharing</h2>
        <p>
          Shared collection files contain only the collection’s title, description, resource list and associated requirements. Private notes are excluded
          unless you choose to include them, and progress is never included.
        </p>
        <h2>External links</h2>
        <p>
          Resources open on their publishers’ websites in a new tab without passing a referrer. Those sites have their own privacy practices.
        </p>
        <h2>Future changes</h2>
        <p>
          If ScoutPath ever adds accounts, cloud sync or collaboration, that would be designed and reviewed separately (including applicable privacy laws,
          parental consent for users under 13, and Scouting America’s Youth Protection policies) before any personal information is collected. Having
          this notice is not a claim of legal compliance; it describes how the software works.
        </p>
      </article>
    </div>
  );
}

export function TermsPage() {
  useDocumentTitle('Terms of use');
  return (
    <div className="container page">
      <PageHeader crumbs={[{ label: 'Home', to: '/' }, { label: 'Terms of use' }]} title="Terms of use" lede="The plain rules for using ScoutPath. By using the site, you agree to them." />
      <article className="article">
        <h2>Free to use</h2>
        <p>
          ScoutPath is free. There are no accounts, subscriptions or payments. You may use it for your own advancement, with your family, or with your
          troop, crew or patrol, including at meetings and workshops.
        </p>
        <h2>Not official</h2>
        <p>
          ScoutPath is an independent project and is not affiliated with Scouting America. Its requirement pages are ScoutPath’s own summaries. The
          official requirements, and the decisions of your counselor, Scoutmaster and board of review, always take priority. See the{' '}
          <Link to="/disclaimer">disclaimer</Link> for details.
        </p>
        <h2>Use it safely</h2>
        <p>
          Some requirements involve first aid, water, fire, tools or the outdoors. Learn and practice those skills with qualified instruction and adult
          supervision. Nothing on ScoutPath replaces that training. In an emergency, call 911 or your local emergency number.
        </p>
        <h2>Your data</h2>
        <p>
          Your progress, notes and plans stay in your own browser, as described in the <Link to="/privacy">privacy notice</Link>. You are responsible for
          exporting a copy if you want to keep it, because clearing your browser data erases it.
        </p>
        <h2>Content and links</h2>
        <p>
          ScoutPath’s summaries, orientations, study sets and illustrations are written and drawn for ScoutPath. Linked resources belong to their
          publishers and are governed by their own terms. Please do not copy ScoutPath’s content wholesale to present it as official material.
        </p>
        <h2>Shared collections</h2>
        <p>
          If you share a collection file, you are responsible for what you put in it. Only share notes you are comfortable with others reading, and
          never include personal information about other Scouts.
        </p>
        <h2>No guarantees</h2>
        <p>
          ScoutPath is provided as is. It is checked carefully, but it may contain mistakes, outdated requirements or broken links, and it may change
          or go offline at any time. Use the “Report link” button when you find a problem.
        </p>
        <h2>Changes to these terms</h2>
        <p>If these terms change, this page will be updated. Continuing to use ScoutPath after a change means you accept the updated terms.</p>
      </article>
    </div>
  );
}

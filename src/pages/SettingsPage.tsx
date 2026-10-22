import { Copy, Download, HardDrive, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Callout } from '../components/Callout';
import { Dialog } from '../components/Dialog';
import { PageHeader } from '../components/PageHeader';
import { content } from '../features/content/data';
import { clearRecent } from '../features/progress/actions';
import { userStore } from '../features/progress/store';
import { exportUserData, mergeUserData, parseUserDataImport, summarize, type ImportResult } from '../features/progress/transfer';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { downloadText, readFileText } from '../lib/download';
import { formatTimestamp } from '../lib/format';
import { useToast } from '../lib/toastContext';

function SummaryList({ s }: { s: ReturnType<typeof summarize> }) {
  return (
    <dl className="meta-list">
      <div>
        <dt>Requirement progress</dt>
        <dd>{s.progress}</dd>
      </div>
      <div>
        <dt>Notes</dt>
        <dd>{s.notes}</dd>
      </div>
      <div>
        <dt>Saved resources</dt>
        <dd>{s.saved}</dd>
      </div>
      <div>
        <dt>Goals</dt>
        <dd>{s.goals}</dd>
      </div>
      <div>
        <dt>Study plans</dt>
        <dd>{s.plans}</dd>
      </div>
      <div>
        <dt>Collections</dt>
        <dd>{s.collections}</dd>
      </div>
      <div>
        <dt>Quiz attempts</dt>
        <dd>{s.quizAttempts}</dd>
      </div>
    </dl>
  );
}

export function SettingsPage() {
  useDocumentTitle('Settings and data');
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();
  const status = userStore.getStatus();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ImportResult | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [confirmText, setConfirmText] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const current = summarize(data);
  const hasData = Object.values(current).some((n) => n > 0);

  const apply = () => {
    if (!pending?.ok) return;
    const next = mode === 'replace' ? pending.data : mergeUserData(data, pending.data);
    userStore.replace({ ...next, updatedAt: new Date().toISOString() });
    setPending(null);
    setConfirmText('');
    toast.show(mode === 'replace' ? 'Data replaced from file' : 'Data merged from file');
  };

  return (
    <div className="container container--narrow page">
      <PageHeader crumbs={[{ label: 'Home', to: '/' }, { label: 'Settings' }]} title="Settings and your data" lede="ScoutPath has no accounts. Everything you record lives in this browser, and you control it here." />

      <div className="stack-lg">
        <section className="panel" aria-labelledby="storage-title">
          <h2 className="panel__title" id="storage-title">
            <HardDrive size={16} aria-hidden="true" /> Storage on this device
          </h2>
          {status.persistent ? (
            <p className="small">
              Saved in this browser’s local storage. It is not synced to other devices or browsers, and clearing your browser data will erase it — export a
              backup if it matters to you.
            </p>
          ) : (
            <Callout tone="warn" title="Storage is unavailable">
              This browser is blocking local storage (for example in a private window), so your data will be lost when the tab closes. Export it before you
              leave.
            </Callout>
          )}
          {status.lastError && <p className="field__error" style={{ marginTop: 'var(--s-2)' }}>Last save failed: {status.lastError}</p>}
          <div style={{ marginTop: 'var(--s-4)' }}>
            <SummaryList s={current} />
          </div>
        </section>

        <section aria-labelledby="export-title">
          <div className="section-head">
            <h2 id="export-title">Export</h2>
          </div>
          <p className="small" style={{ marginBottom: 'var(--s-4)' }}>
            Download everything as a JSON file. Keep it as a backup, or import it into ScoutPath on another device.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              downloadText(`scoutpath-personal-data-${new Date().toISOString().slice(0, 10)}.json`, exportUserData(data));
              toast.show('Export downloaded');
            }}
          >
            <Download size={16} aria-hidden="true" /> Export my data
          </button>
        </section>

        <section aria-labelledby="import-title">
          <div className="section-head">
            <h2 id="import-title">Import</h2>
          </div>
          <p className="small" style={{ marginBottom: 'var(--s-4)' }}>
            Restore a ScoutPath export. The file is checked completely before anything changes, and you choose whether to merge or replace.
          </p>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Choose a file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const text = await readFileText(file).catch(() => '');
              setMode('merge');
              setConfirmText('');
              setPending(parseUserDataImport(text));
            }}
          />
        </section>

        <section aria-labelledby="reports-title">
          <div className="section-head">
            <h2 id="reports-title">Link reports</h2>
          </div>
          {data.linkReports.length ? (
            <>
              <ul className="plain-list small">
                {data.linkReports.map((r) => (
                  <li key={`${r.resourceId}-${r.reportedAt}`} style={{ padding: 'var(--s-2) 0', borderBottom: '1px solid var(--border)' }}>
                    <strong>{content.resourceById.get(r.resourceId)?.title ?? r.resourceId}</strong> — {r.note || 'no details'}{' '}
                    <span className="muted">({formatTimestamp(r.reportedAt)})</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn--sm"
                style={{ marginTop: 'var(--s-3)' }}
                onClick={() => {
                  const text = data.linkReports
                    .map((r) => `${r.resourceId}\t${content.resourceById.get(r.resourceId)?.url ?? ''}\t${r.note}\t${r.reportedAt}`)
                    .join('\n');
                  void navigator.clipboard?.writeText(text).then(() => toast.show('Reports copied'));
                }}
              >
                <Copy size={14} aria-hidden="true" /> Copy all reports
              </button>
            </>
          ) : (
            <p className="small muted">You have not reported any links. Reports stay on this device; copy them to send to your library’s maintainer.</p>
          )}
        </section>

        <section aria-labelledby="danger-title">
          <div className="section-head">
            <h2 id="danger-title">Clear data</h2>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="btn"
              disabled={data.recent.length === 0}
              onClick={() => {
                update(clearRecent);
                toast.show('Recently viewed cleared');
              }}
            >
              Clear recently viewed
            </button>
            <button type="button" className="btn btn--danger" disabled={!hasData && data.recent.length === 0 && !data.profile.selectedRankId} onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} aria-hidden="true" /> Delete all my data
            </button>
          </div>
          <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>
            See the <Link to="/privacy">privacy notice</Link> for what ScoutPath stores and why.
          </p>
        </section>
      </div>

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.ok ? 'Import this data?' : 'This file can’t be imported'}
        footer={
          pending?.ok ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button type="button" className={`btn ${mode === 'replace' ? 'btn--danger-solid' : 'btn--primary'}`} disabled={mode === 'replace' && hasData && confirmText !== 'REPLACE'} onClick={apply}>
                {mode === 'replace' ? 'Replace my data' : 'Merge into my data'}
              </button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setPending(null)}>
              Close
            </button>
          )
        }
      >
        <div className="dialog__body">
          {pending?.ok ? (
            <>
              <p>The file is a valid ScoutPath export containing:</p>
              <SummaryList s={pending.summary} />
              {hasData && (
                <fieldset className="field">
                  <legend>You already have data in this browser</legend>
                  <label className="check">
                    <input type="radio" name="import-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
                    <span>
                      <strong>Merge</strong> — keep everything here and add what is new. Where both have the same item, the most recently updated wins.
                    </span>
                  </label>
                  <label className="check">
                    <input type="radio" name="import-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                    <span>
                      <strong>Replace</strong> — erase the data in this browser and use the file instead.
                    </span>
                  </label>
                  {mode === 'replace' && (
                    <div className="field" style={{ marginTop: 'var(--s-2)' }}>
                      <label htmlFor="replace-confirm">Type REPLACE to confirm</label>
                      <input id="replace-confirm" className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
                    </div>
                  )}
                </fieldset>
              )}
            </>
          ) : (
            <>
              <p>Nothing was changed. The problems found were:</p>
              <ul style={{ paddingLeft: 'var(--s-5)' }}>{pending && !pending.ok && pending.errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </>
          )}
        </div>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText('');
        }}
        title="Delete all of your ScoutPath data?"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger-solid"
              disabled={confirmText !== 'DELETE'}
              onClick={() => {
                userStore.clear();
                setDeleteOpen(false);
                setConfirmText('');
                toast.show('All ScoutPath data deleted from this browser');
              }}
            >
              Delete everything
            </button>
          </>
        }
      >
        <div className="dialog__body">
          <p>This permanently erases your progress, notes, saved resources, goals, plans, collections, quiz history and link reports from this browser. It cannot be undone.</p>
          <p>Consider exporting a backup first.</p>
          <div className="field">
            <label htmlFor="delete-confirm">Type DELETE to confirm</label>
            <input id="delete-confirm" className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

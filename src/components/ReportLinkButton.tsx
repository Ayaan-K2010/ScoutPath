import { Flag } from './icons';
import { useId, useState } from 'react';
import { reportLink } from '../features/progress/actions';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { useToast } from '../lib/toastContext';
import type { Resource } from '../schemas/content';
import { Dialog } from './Dialog';

/**
 * Lets a user flag a broken or inappropriate link. ScoutPath has no server,
 * so reports are kept on this device and can be copied for the maintainers.
 */
export function ReportLinkButton({ resource }: { resource: Resource }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('broken');
  const update = useUpdateUser();
  const data = useUserData();
  const toast = useToast();
  const id = useId();
  const already = data.linkReports.some((r) => r.resourceId === resource.id);

  const reportText = `ScoutPath link report\nResource: ${resource.title} (${resource.id})\nURL: ${resource.url}\nProblem: ${reason}\nNote: ${note || '(none)'}`;

  const submit = () => {
    update((d) => reportLink(d, resource.id, `${reason}: ${note}`.trim()));
    setOpen(false);
    setNote('');
    toast.show('Report saved on this device');
  };

  return (
    <>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(true)}>
        <Flag size={14} aria-hidden="true" />
        {already ? 'Reported' : 'Report link'}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Report a problem with this link"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                void navigator.clipboard?.writeText(reportText).then(() => toast.show('Report copied to clipboard'));
              }}
            >
              Copy report text
            </button>
            <button type="button" className="btn btn--primary" onClick={submit}>
              Save report
            </button>
          </>
        }
      >
        <div className="dialog__body">
          <p>
            <strong>{resource.title}</strong>
            <br />
            <span className="muted">{resource.url}</span>
          </p>
          <div className="field">
            <label htmlFor={`${id}-reason`}>What is wrong?</label>
            <select id={`${id}-reason`} className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="broken">The link is broken or the page moved</option>
              <option value="changed">The page content changed or no longer matches</option>
              <option value="inappropriate">The content seems inappropriate or unsafe</option>
              <option value="other">Something else</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${id}-note`}>Details (optional)</label>
            <textarea id={`${id}-note`} className="textarea" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          </div>
          <p className="field__hint">
            ScoutPath has no server, so this report is saved only in this browser. Use “Copy report text” to send it to whoever maintains your
            ScoutPath library. Do not include personal information.
          </p>
        </div>
      </Dialog>
    </>
  );
}

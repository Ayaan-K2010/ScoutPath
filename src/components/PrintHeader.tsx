/** Shown only when printing: labels every printout as an unofficial personal document. */
export function PrintHeader({ title }: { title: string }) {
  return (
    <div className="print-only" style={{ marginBottom: '10pt', fontSize: '9pt' }}>
      <strong>ScoutPath — {title}</strong>
      <br />
      Unofficial personal study document printed {new Date().toLocaleDateString('en-US')}. Requirement outlines are ScoutPath summaries, not official
      wording. Use the official Scouting America requirements and your leaders’ sign-offs for advancement.
    </div>
  );
}

import { Bookmark } from 'lucide-react';
import { toggleSaved } from '../features/progress/actions';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { useToast } from '../lib/toastContext';

export function BookmarkButton({ resourceId, title }: { resourceId: string; title: string }) {
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();
  const saved = Boolean(data.saved[resourceId]);
  return (
    <button
      type="button"
      className="bookmark"
      aria-pressed={saved}
      aria-label={saved ? `Remove “${title}” from saved resources` : `Save “${title}”`}
      onClick={() => {
        update((d) => toggleSaved(d, resourceId));
        toast.show(saved ? 'Removed from saved resources' : 'Saved to your resources');
      }}
    >
      <Bookmark size={15} aria-hidden="true" />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

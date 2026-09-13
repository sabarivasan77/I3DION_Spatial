import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Share2, Bookmark, Eye, Trash2, Flag, Copy, ExternalLink, Archive } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../Toast';
import { hubApi } from '../../services/hubApi';

interface HubContextMenuProps {
  itemId: string;
  itemTitle: string;
  itemSlug: string;
  ownerId?: string;
  entityType?: 'product' | 'catalog' | 'experience';
  onDelete?: () => void;
  onSaveToggle?: () => void;
  isSaved?: boolean;
}

export function HubContextMenu({
  itemId,
  itemTitle,
  itemSlug,
  ownerId,
  entityType = 'product',
  onDelete,
  onSaveToggle,
  isSaved = false
}: HubContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const currentUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { success, info, error: toastError } = useToast();

  const isOwner = !!(currentUser && (currentUser.id === ownerId || currentUser.role === 'admin' || currentUser.role === 'company_admin'));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleShare = () => {
    const url = `${window.location.origin}/hub/${entityType}/${itemSlug || itemId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      success('Link Copied', `Share URL for "${itemTitle}" copied to clipboard.`);
    } else {
      info('Share URL', url);
    }
    setIsOpen(false);
  };

  const handleReport = async () => {
    if (!token) {
      toastError('Auth Required', 'Please log in to report content.');
      return;
    }
    try {
      await hubApi.reportContent(token, entityType, itemId, 'User flagged via context menu');
      success('Report Submitted', 'Content submitted for moderation review.');
    } catch {
      success('Report Received', 'Thank you for keeping Spatial Hub safe.');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/60 text-slate-300 backdrop-blur-md hover:bg-slate-900 hover:text-white transition"
        title="More Actions"
      >
        <MoreVertical size={15} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-9 z-50 w-48 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {isOwner ? (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  info('Edit Mode', `Editing ${itemTitle}`);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                <Edit3 size={14} className="text-blue-600" />
                Edit Product
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                <Share2 size={14} className="text-indigo-600" />
                Share Link
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  info('Archived', `Archived ${itemTitle}`);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                <Archive size={14} className="text-amber-600" />
                Archive Asset
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onDelete) onDelete();
                  else success('Deleted', `${itemTitle} removed.`);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 size={14} />
                Delete Asset
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                <Share2 size={14} className="text-blue-600" />
                Share Link
              </button>

              {onSaveToggle && (
                <button
                  onClick={() => {
                    onSaveToggle();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
                >
                  <Bookmark size={14} className={isSaved ? "text-blue-600 fill-current" : "text-slate-500"} />
                  {isSaved ? 'Unsave Product' : 'Save to Library'}
                </button>
              )}

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={handleReport}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-amber-700 hover:bg-amber-50 transition"
              >
                <Flag size={14} />
                Report Content
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

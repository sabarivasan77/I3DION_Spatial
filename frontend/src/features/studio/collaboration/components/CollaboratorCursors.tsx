import React from 'react';
import { useRealtimeCollaborationStore } from '../store/realtimeCollaborationStore';
import { MousePointer2 } from 'lucide-react';

export const CollaboratorCursors: React.FC = () => {
  const { remoteCursors } = useRealtimeCollaborationStore();

  const cursorsList = Array.from(remoteCursors.values());

  if (cursorsList.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {cursorsList.map((cursor) => (
        <div
          key={cursor.actorId}
          style={{
            transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
            transition: 'transform 0.08s ease-out',
          }}
          className="absolute top-0 left-0 flex items-start gap-1"
        >
          {/* Cursor Pointer */}
          <MousePointer2
            size={18}
            className="drop-shadow-md text-cyan-400 fill-cyan-400/30 -rotate-45"
            style={{ color: cursor.actorColor || '#06b6d4' }}
          />

          {/* User Name & Section Tag */}
          <div
            style={{ backgroundColor: cursor.actorColor || '#06b6d4' }}
            className="px-2 py-0.5 rounded-full text-slate-950 font-bold font-mono text-[10px] shadow-lg flex items-center gap-1 opacity-90"
          >
            <span>{cursor.actorName}</span>
            {cursor.editingSection && (
              <span className="text-[9px] opacity-75 border-l border-slate-900/40 pl-1">
                {cursor.editingSection}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

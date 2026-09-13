import React from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';

export const LogicMiniMap: React.FC = () => {
  const { getActiveGraph } = useLogicCraftStore();
  const activeGraph = getActiveGraph();
  const nodes = activeGraph.nodes || [];

  return (
    <div className="absolute bottom-4 right-4 z-20 h-28 w-40 rounded-xl border border-slate-800 bg-slate-950/80 p-2 shadow-2xl backdrop-blur-md overflow-hidden">
      <div className="text-[9px] font-mono text-slate-500 mb-1">Graph Minimap</div>
      <div className="relative h-20 w-36 rounded bg-slate-900 border border-slate-800 overflow-hidden">
        {nodes.map((node) => {
          const miniX = Math.max(0, Math.min(130, (node.position.x / 1000) * 120));
          const miniY = Math.max(0, Math.min(65, (node.position.y / 800) * 60));

          return (
            <div
              key={node.id}
              style={{
                left: `${miniX}px`,
                top: `${miniY}px`,
              }}
              className="absolute h-2 w-4 rounded bg-indigo-500/70"
            />
          );
        })}
      </div>
    </div>
  );
};

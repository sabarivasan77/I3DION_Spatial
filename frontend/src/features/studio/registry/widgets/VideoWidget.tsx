import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { Video } from 'lucide-react';

export const VideoWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    src = '',
    poster = '',
    controls = true,
    autoPlay = false,
    loop = false,
    muted = false,
    height = 320,
    borderRadius = 12,
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
      }}
      className={`relative w-full overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      {src ? (
        <video
          src={src}
          poster={poster}
          controls={controls}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Video size={36} className="mb-2 text-slate-500" />
          <span className="text-xs font-semibold">Video Media Placeholder</span>
          <span className="text-[10px] text-slate-500">Configure video URL in Properties</span>
        </div>
      )}
    </div>
  );
};

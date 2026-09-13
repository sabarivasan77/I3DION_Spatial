import React from 'react';

export interface VoiceIndicatorProps {
  isSpeaking: boolean;
  isMuted?: boolean;
  audioLevel?: number; // 0 - 100
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  isSpeaking,
  isMuted = false,
  audioLevel = 0,
  size = 'md',
}) => {
  if (isMuted) {
    return <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" title="Muted" />;
  }

  const diameter = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className="relative flex items-center justify-center shrink-0">
      {isSpeaking && (
        <span
          className={`absolute rounded-full bg-emerald-400 opacity-75 animate-ping ${diameter}`}
          style={{ transform: `scale(${1 + (audioLevel / 100) * 0.5})` }}
        />
      )}
      <span
        className={`relative rounded-full transition-all ${
          isSpeaking ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-slate-300'
        } ${diameter}`}
      />
    </div>
  );
};

import { Box } from 'lucide-react';
import { cx } from '../utils/format';

interface LogoProps {
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light';
  className?: string;
}

export function Logo({ variant = 'full', theme = 'light', className }: LogoProps) {
  const isDark = theme === 'dark';
  
  if (variant === 'icon') {
    return (
      <div className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black transition-colors",
        isDark ? "bg-white text-slate-950" : "bg-slate-950 text-white",
        className
      )}>
        <Box size={20} className="opacity-90" />
      </div>
    );
  }

  return (
    <div className={cx("flex items-center gap-3", className)}>
      <div className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
        isDark ? "bg-white text-slate-950" : "bg-slate-950 text-white"
      )}>
        <Box size={20} className="opacity-90" />
      </div>
      <div className="flex flex-col">
        <span className={cx(
          "text-[15px] font-black leading-none tracking-tight",
          isDark ? "text-white" : "text-slate-950"
        )}>
          I3DION
        </span>
        <span className={cx(
          "text-[10px] font-bold uppercase tracking-[0.25em] mt-0.5",
          isDark ? "text-slate-400" : "text-slate-500"
        )}>
          Spatial
        </span>
      </div>
    </div>
  );
}

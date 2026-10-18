import { cx } from '../utils/format';

interface LogoProps {
  variant?: 'full' | 'icon' | 'dark' | 'white' | 'text';
  theme?: 'dark' | 'light';
  className?: string;
  height?: number | string;
}

export function Logo({ variant = 'full', theme = 'light', className }: LogoProps) {
  const isDark = theme === 'dark' || variant === 'dark' || variant === 'white';

  if (variant === 'icon') {
    return (
      <div className={cx("flex items-center justify-center select-none", className)}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 border border-slate-200/80 shadow-md p-1">
          <img src="/assets/logos/hub.png" alt="I3DION Spatial" className="h-7 w-7 object-contain drop-shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={cx("flex items-center gap-2.5 select-none font-sans tracking-tight", className)}>
      {/* Official 3D Spatial Portal Logo */}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs p-1 shrink-0">
        <img src="/assets/logos/hub.png" alt="I3DION Spatial" className="h-7 w-7 object-contain drop-shadow-sm" />
      </div>
      
      {/* Bold Modern Typography Wordmark */}
      <div className="flex flex-col text-left leading-none">
        <span className={cx("text-base md:text-lg font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>
          I3DION
        </span>
        <span className="text-[9.5px] font-bold tracking-[0.22em] text-blue-600 uppercase mt-0.5">
          SPATIAL
        </span>
      </div>
    </div>
  );
}

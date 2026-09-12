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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-extrabold text-white text-xs shadow-md shadow-blue-600/30 font-sans tracking-tight">
          i3D
        </div>
      </div>
    );
  }

  return (
    <div className={cx("flex items-center gap-2.5 select-none font-sans tracking-tight", className)}>
      {/* Sleek Vector 3D Badge */}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 font-extrabold text-white text-xs shadow-md shadow-blue-600/30">
        i3D
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

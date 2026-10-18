import React from 'react';
import { cx } from '../utils/format';

export type ProductKey = 'hub' | 'vault' | 'engine' | 'lens' | 'studio' | 'flow' | 'i3dion';

export interface ProductLogoProps {
  product: ProductKey;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  imgClassName?: string;
  badge?: boolean;
}

const PRODUCT_META: Record<
  ProductKey,
  {
    name: string;
    sub: string;
    tagline: string;
    logoUrl: string;
    badgeBorder: string;
    badgeBg: string;
    textColor: string;
  }
> = {
  hub: {
    name: 'I3DION',
    sub: 'Spatial Hub',
    tagline: 'EXPLORE • EXPERIENCE • ENGAGE',
    logoUrl: '/assets/logos/hub.png',
    badgeBorder: 'border-blue-500/20',
    badgeBg: 'bg-blue-500/10',
    textColor: 'text-blue-500',
  },
  vault: {
    name: 'I3DION',
    sub: 'Spatial Vault',
    tagline: 'SECURE • ORGANIZE • EMPOWER',
    logoUrl: '/assets/logos/vault.png',
    badgeBorder: 'border-emerald-500/20',
    badgeBg: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
  },
  engine: {
    name: 'I3DION',
    sub: 'Spatial Engine',
    tagline: 'BUILD • POWER • INTERACT',
    logoUrl: '/assets/logos/engine.png',
    badgeBorder: 'border-rose-500/20',
    badgeBg: 'bg-rose-500/10',
    textColor: 'text-rose-500',
  },
  lens: {
    name: 'I3DION',
    sub: 'Spatial Lens',
    tagline: 'OBSERVE • ANALYZE • INSIGHT',
    logoUrl: '/assets/logos/lens.png',
    badgeBorder: 'border-amber-500/20',
    badgeBg: 'bg-amber-500/10',
    textColor: 'text-amber-500',
  },
  studio: {
    name: 'I3DION',
    sub: 'Omni Studio',
    tagline: 'CREATE • SHOWCASE • IMMERSE',
    logoUrl: '/assets/logos/studio.png',
    badgeBorder: 'border-purple-500/20',
    badgeBg: 'bg-purple-500/10',
    textColor: 'text-purple-500',
  },
  flow: {
    name: 'I3DION',
    sub: 'Flow',
    tagline: 'AUTOMATE • CONNECT • ACCELERATE',
    logoUrl: '/assets/logos/flow.png',
    badgeBorder: 'border-cyan-500/20',
    badgeBg: 'bg-cyan-500/10',
    textColor: 'text-cyan-500',
  },
  i3dion: {
    name: 'I3DION',
    sub: 'Spatial',
    tagline: 'SPATIAL DIGITAL ECOSYSTEM',
    logoUrl: '/assets/logos/hub.png',
    badgeBorder: 'border-blue-500/20',
    badgeBg: 'bg-blue-500/10',
    textColor: 'text-blue-500',
  },
};

const SIZE_MAP = {
  xs: { box: 'h-5 w-5', img: 'h-4 w-4', text: 'text-xs', sub: 'text-[9px]' },
  sm: { box: 'h-7 w-7', img: 'h-5 w-5', text: 'text-xs', sub: 'text-[10px]' },
  md: { box: 'h-9 w-9', img: 'h-7 w-7', text: 'text-sm', sub: 'text-[11px]' },
  lg: { box: 'h-11 w-11', img: 'h-9 w-9', text: 'text-base', sub: 'text-xs' },
  xl: { box: 'h-14 w-14', img: 'h-12 w-12', text: 'text-lg', sub: 'text-xs' },
  '2xl': { box: 'h-20 w-20', img: 'h-16 w-16', text: 'text-2xl', sub: 'text-sm' },
};

export const ProductLogo: React.FC<ProductLogoProps> = ({
  product,
  size = 'md',
  showText = false,
  theme = 'light',
  className,
  imgClassName,
  badge = true,
}) => {
  const meta = PRODUCT_META[product] || PRODUCT_META.hub;
  const sizeConfig = SIZE_MAP[size];
  const isDark = theme === 'dark';

  return (
    <div className={cx('inline-flex items-center gap-2.5 select-none font-sans', className)}>
      <div
        className={cx(
          'flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
          sizeConfig.box,
          badge &&
            cx(
              'rounded-xl border shadow-xs overflow-hidden',
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200/80 shadow-2xs'
            )
        )}
      >
        <img
          src={meta.logoUrl}
          alt={`${meta.name} ${meta.sub} Logo`}
          className={cx('object-contain drop-shadow-sm', sizeConfig.img, imgClassName)}
          loading="lazy"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={cx(
                'font-black tracking-tight uppercase',
                sizeConfig.text,
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              {meta.name}
            </span>
            <span className={cx('font-bold', sizeConfig.text, meta.textColor)}>{meta.sub}</span>
          </div>
          <span className={cx('font-semibold tracking-wider text-slate-400 uppercase', sizeConfig.sub)}>
            {meta.tagline.split('•')[0].trim()}
          </span>
        </div>
      )}
    </div>
  );
};

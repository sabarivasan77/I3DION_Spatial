import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { Kpi } from '../types';
import { cx, statusClass } from '../utils/format';

export function Button({
  children,
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'>) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-blue-600 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-error text-white hover:bg-red-500',
  };

  return (
    <button
      type={type}
      className={cx(
        'inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all active:scale-[0.98]',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cx('rounded-2xl border border-slate-200 bg-white card-shadow', className)}
    >
      {children}
    </motion.section>
  );
}

export function PageHeader({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-base text-slate-500">{eyebrow}</p>
      </div>
      {action}
    </div>
  );
}

export function KpiCard({ item }: { item: Kpi }) {
  const Icon = item.icon;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-xl bg-blue-50 p-2 text-primary">
          <Icon size={21} />
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
          <ArrowUpRight size={14} />
          {item.change}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500">{item.label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
    </Card>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('rounded-full border px-3 py-1 text-xs font-semibold', typeof children === 'string' ? statusClass(children) : '', className)}>
      {children}
    </span>
  );
}

export function SectionTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      {meta ? <span className="text-sm font-medium text-slate-500">{meta}</span> : null}
    </div>
  );
}

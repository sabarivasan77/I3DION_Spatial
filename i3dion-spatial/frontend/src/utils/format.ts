export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const statusClass = (status: string) => {
  if (status === 'Published' || status === 'Qualified' || status === 'Closed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (status === 'Draft' || status === 'Demo Scheduled') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return 'bg-slate-100 text-slate-600 border-slate-200';
};

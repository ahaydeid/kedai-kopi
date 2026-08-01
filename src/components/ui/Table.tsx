import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <div className="overflow-hidden rounded border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="overflow-x-auto thin-scroll">
        <table className={`w-full border-collapse text-left text-sm ${className || ""}`} {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`border-b border-zinc-100 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800/60 dark:text-zinc-500 ${className || ""}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`${className || ""}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr 
      className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-600 dark:text-slate-400 even:bg-slate-50 dark:even:bg-slate-900/40 ${className || ""}`} 
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-6 py-4 font-semibold ${className || ""}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-6 py-4 ${className || ""}`} {...props}>
      {children}
    </td>
  );
}

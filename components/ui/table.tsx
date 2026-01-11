import * as React from "react";

type BaseProps<T extends HTMLElement> = React.HTMLAttributes<T> & {
  className?: string;
};

export function Table({ className = "", ...props }: BaseProps<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-white/10 bg-black/20">
      <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({
  className = "",
  ...props
}: BaseProps<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function TableBody({
  className = "",
  ...props
}: BaseProps<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = "", ...props }: BaseProps<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-white/10 hover:bg-orange-500/5 transition ${className}`}
      {...props}
    />
  );
}

/**
 * IMPORTANT:
 * - TableHead трябва да приема th атрибути (colSpan не е тук, но е коректно за th)
 * - TableCell трябва да приема td атрибути (colSpan/rowSpan са тук)
 */
export function TableHead({
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { className?: string }) {
  return (
    <th
      className={`h-11 px-4 text-left align-middle font-medium text-gray-300 ${className}`}
      {...props}
    />
  );
}

export function TableCell({
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { className?: string }) {
  return <td className={`px-4 py-3 align-middle text-gray-100 ${className}`} {...props} />;
}

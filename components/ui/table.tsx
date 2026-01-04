import * as React from "react";

type Props<T extends HTMLElement> = React.HTMLAttributes<T> & {
  className?: string;
};

export function Table({ className = "", ...props }: Props<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-white/10 bg-black/20">
      <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = "", ...props }: Props<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function TableBody({ className = "", ...props }: Props<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = "", ...props }: Props<HTMLTableRowElement>) {
  return (
    <tr className={`border-b border-white/10 hover:bg-orange-500/5 transition ${className}`} {...props} />
  );
}

export function TableHead({ className = "", ...props }: Props<HTMLTableCellElement>) {
  return (
    <th className={`h-11 px-4 text-left align-middle font-medium text-gray-300 ${className}`} {...props} />
  );
}

export function TableCell({ className = "", ...props }: Props<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 align-middle text-gray-100 ${className}`} {...props} />;
}

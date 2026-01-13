import React from 'react';

const Table = ({ children, className = '' }) => (
  <div className="relative w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>
      {children}
    </table>
  </div>
);

const TableHeader = ({ children, className = '' }) => (
  <thead className={`[&_tr]:border-b ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '' }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
    {children}
  </tbody>
);

const TableFooter = ({ children, className = '' }) => (
  <tfoot className={`bg-primary font-medium text-primary-foreground ${className}`}>
    {children}
  </tfoot>
);

const TableRow = ({ children, className = '' }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
    {children}
  </tr>
);

const TableHead = ({ children, className = '' }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = '' }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
);

const TableCaption = ({ children, className = '' }) => (
  <caption className={`mt-4 text-sm text-muted-foreground ${className}`}>
    {children}
  </caption>
);

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };

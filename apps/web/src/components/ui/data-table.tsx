import type { ReactNode } from 'react';

const pageSizeOptions = [10, 20, 50];

export function SortableTableHeader({ label, field, sortBy, sortOrder, onSort, className }: {
  label: string;
  field: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  className?: string;
}) {
  const isActive = sortBy === field;
  const icon = isActive ? (sortOrder === 'ASC' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up';
  return <th className={className}><button type="button" className="btn btn-link p-0 text-reset text-decoration-none fw-bold" onClick={() => onSort(field)}>{label} <i className={`bi ${icon}`} aria-hidden="true" /></button></th>;
}

export function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return <tr><td colSpan={colSpan} className="text-center text-body-secondary py-4">{message}</td></tr>;
}

export function DataTableFooter({ itemLabel, total, page, totalPages, limit, onPageChange, onLimitChange, children }: {
  itemLabel: string;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  children?: ReactNode;
}) {
  const pages = pageNumbers(page, totalPages);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
    <div className="d-flex align-items-center gap-2"><span className="text-body-secondary small">{start}–{end} of {total} {itemLabel}</span><label className="visually-hidden" htmlFor={`page-size-${itemLabel}`}>Rows per page</label><select id={`page-size-${itemLabel}`} className="form-select form-select-sm" value={limit} onChange={(event) => onLimitChange(Number(event.target.value))}>{pageSizeOptions.map((option) => <option value={option} key={option}>{option} / page</option>)}</select></div>
    {children}
    <nav aria-label={`${itemLabel} pagination`}><ul className="pagination pagination-sm mb-0"><li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button type="button" className="page-link" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button></li>{pages.map((item, index) => item === 'ellipsis' ? <li className="page-item disabled" key={`ellipsis-${index}`}><span className="page-link">…</span></li> : <li className={`page-item ${item === page ? 'active' : ''}`} key={item}><button type="button" className="page-link" onClick={() => onPageChange(item)}>{item}</button></li>)}<li className={`page-item ${page === totalPages ? 'disabled' : ''}`}><button type="button" className="page-link" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button></li></ul></nav>
  </div>;
}

function pageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages: Array<number | 'ellipsis'> = [1];
  if (page > 3) pages.push('ellipsis');
  for (let current = Math.max(2, page - 1); current <= Math.min(totalPages - 1, page + 1); current += 1) pages.push(current);
  if (page < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

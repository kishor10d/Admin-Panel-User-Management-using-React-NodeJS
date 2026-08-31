import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DataTableFooter, EmptyTableRow, SortableTableHeader } from '../../../components/ui/data-table';
import { useDebouncedValue } from '../../../lib/use-debounced-value';
import { getLoginHistory, type ListLoginHistoryOptions } from '../api/login-history-api';

export function LoginHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [successful, setSuccessful] = useState('');
  const [sortBy, setSortBy] = useState<ListLoginHistoryOptions['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<ListLoginHistoryOptions['sortOrder']>('DESC');
  const debouncedSearch = useDebouncedValue(search);
  const history = useQuery({ queryKey: ['login-history', page, limit, debouncedSearch, successful, sortBy, sortOrder], queryFn: () => getLoginHistory({ page, limit, search: debouncedSearch, successful, sortBy, sortOrder }) });
  const toggleSort = (field: ListLoginHistoryOptions['sortBy']) => {
    if (sortBy === field) setSortOrder((current) => current === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortOrder('ASC'); }
    setPage(1);
  };

  return <section className="card">
    <div className="card-header"><div className="row g-2"><div className="col-md-6"><div className="input-group input-group-sm"><input className="form-control" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search email, IP, or browser" /><span className="input-group-text"><i className="bi bi-search" /></span></div></div><div className="col-md-3"><select className="form-select form-select-sm" value={successful} onChange={(event) => { setSuccessful(event.target.value); setPage(1); }}><option value="">All results</option><option value="true">Successful</option><option value="false">Failed</option></select></div></div></div>
    <div className="card-body table-responsive p-0">
      {history.isPending && <div className="p-3 text-body-secondary">Loading login history…</div>}
      {history.isError && <div className="alert alert-danger m-3 mb-0">{history.error.message}</div>}
      {history.data && <table className="table table-hover align-middle mb-0"><thead><tr><SortableTableHeader label="Time" field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListLoginHistoryOptions['sortBy'])} /><SortableTableHeader label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListLoginHistoryOptions['sortBy'])} /><SortableTableHeader label="IP address" field="ipAddress" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListLoginHistoryOptions['sortBy'])} /><th>Browser / device</th><SortableTableHeader label="Result" field="successful" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListLoginHistoryOptions['sortBy'])} /></tr></thead><tbody>{history.data.items.map((event) => <tr key={event.id}><td>{new Date(event.createdAt).toLocaleString()}</td><td>{event.email}</td><td>{event.ipAddress ?? '—'}</td><td className="text-truncate" style={{ maxWidth: 280 }}>{event.userAgent ?? '—'}</td><td><span className={`badge text-bg-${event.successful ? 'success' : 'danger'}`}>{event.successful ? 'Successful' : 'Failed'}</span></td></tr>)}{history.data.items.length === 0 && <EmptyTableRow colSpan={5} message="No login events found." />}</tbody></table>}
    </div>
    {history.data && <DataTableFooter itemLabel="events" total={history.data.total} page={page} totalPages={history.data.totalPages} limit={limit} onPageChange={setPage} onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }} />}
  </section>;
}

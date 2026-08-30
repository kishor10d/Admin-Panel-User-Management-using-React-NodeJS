import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getLoginHistory } from '../api/login-history-api';

export function LoginHistoryPage() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [successful, setSuccessful] = useState('');
  const history = useQuery({ queryKey: ['login-history', page, search, successful], queryFn: () => getLoginHistory(page, search, successful) });
  const updateSearch = (value: string) => { setSearch(value); setPage(1); };
  return <div className="login-history-page"><div className="table-card"><div className="filters"><input className="search-input" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search email, IP, or browser" /><select value={successful} onChange={(event) => { setSuccessful(event.target.value); setPage(1); }}><option value="">All results</option><option value="true">Successful</option><option value="false">Failed</option></select></div>{history.isPending && <p>Loading login history…</p>}{history.isError && <p className="status-error">{history.error.message}</p>}{history.data && <><table><thead><tr><th>Time</th><th>Email</th><th>IP address</th><th>Browser / device</th><th>Result</th></tr></thead><tbody>{history.data.items.map((event) => <tr key={event.id}><td>{new Date(event.createdAt).toLocaleString()}</td><td>{event.email}</td><td>{event.ipAddress ?? '—'}</td><td className="agent-cell">{event.userAgent ?? '—'}</td><td><span className={event.successful ? 'status-active' : 'status-error'}>{event.successful ? 'Successful' : 'Failed'}</span></td></tr>)}</tbody></table><div className="pagination"><span>{history.data.total} event(s)</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {history.data.totalPages}</span><button disabled={page >= history.data.totalPages} onClick={() => setPage(page + 1)}>Next</button></div></div></>}</div></div>;
}

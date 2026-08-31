import { Link } from 'react-router-dom';

export function AccessDeniedPage() {
  return <div className="row justify-content-center"><div className="col-lg-6"><section className="card card-outline card-danger"><div className="card-body text-center py-5"><i className="bi bi-shield-lock-fill display-4 text-danger" aria-hidden="true" /><h1 className="h3 mt-3">Access denied</h1><p className="text-body-secondary mb-4">You do not have permission to view this page.</p><Link className="btn btn-primary" to="/">Return to dashboard</Link></div></section></div></div>;
}

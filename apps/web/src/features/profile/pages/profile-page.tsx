import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authApi } from '../../auth/api/auth-api';

export function ProfilePage() {
  const currentUser = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me });
  if (currentUser.isPending) return <div className="card"><div className="card-body text-body-secondary">Loading profile…</div></div>;
  if (currentUser.isError) return <div className="alert alert-danger">Unable to load your profile.</div>;

  const { user } = currentUser.data;
  return <div className="row"><div className="col-md-8 col-lg-6"><section className="card card-outline card-primary"><div className="card-header"><h3 className="card-title">Account information</h3></div><div className="card-body"><div className="text-center mb-4"><i className="bi bi-person-circle display-3 text-body-secondary" aria-hidden="true" /><h2 className="h4 mt-2 mb-1">{user.name ?? user.email}</h2><p className="text-body-secondary mb-0">{user.email}</p></div><dl className="row mb-0"><dt className="col-sm-4">Name</dt><dd className="col-sm-8">{user.name ?? 'Not provided'}</dd><dt className="col-sm-4">Email</dt><dd className="col-sm-8">{user.email}</dd><dt className="col-sm-4">Roles</dt><dd className="col-sm-8 d-flex flex-wrap gap-1">{user.roles.length ? user.roles.map((role) => <span className="badge text-bg-secondary" key={role}>{role}</span>) : 'No assigned roles'}</dd></dl></div><div className="card-footer text-end"><Link className="btn btn-primary" to="/change-password"><i className="bi bi-key-fill me-1" />Change password</Link></div></section></div></div>;
}

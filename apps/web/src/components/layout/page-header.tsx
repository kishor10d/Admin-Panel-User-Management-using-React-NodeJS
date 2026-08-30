import { Link, useLocation } from 'react-router-dom';
import { pageTitles } from './navigation';

export function PageHeader() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] ?? 'Admin panel';

  return (
    <div className="app-content-header">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-sm-6"><h3 className="mb-0">{pageTitle}</h3></div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-end mb-0">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active">{pageTitle}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

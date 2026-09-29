import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <header className="app-header">
      <div>
        <h5 className="mb-0">
          Dairy Farm Management
        </h5>

        <small className="text-muted">
          Farm operations dashboard
        </small>
      </div>

      <div className="header-user">
        <div className="user-info">
          <strong>
            {user?.name}
          </strong>

          <small>
            {user?.role}
          </small>
        </div>

        <Button
          variant="outline-danger"
          size="sm"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
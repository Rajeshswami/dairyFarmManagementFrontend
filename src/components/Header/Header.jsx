import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

import { useAuth } from "../../context/AuthContext";

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open navigation"
          onClick={onMenuToggle}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="header-title">
          <h5 className="mb-0">Dairy Farm Management</h5>
          <small className="text-muted">Farm operations dashboard</small>
        </div>
      </div>

      <div className="header-user">
        <div className="user-info">
          <strong>{user?.name}</strong>
          <small>{user?.role}</small>
        </div>

        <Button
          variant="outline-danger"
          size="sm"
          onClick={handleLogout}
          className="logout-button"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}

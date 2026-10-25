import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name || 'Farm User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button type="button" className="mobile-menu-button" aria-label="Open navigation" onClick={onMenuToggle}>
          <span /><span /><span />
        </button>
        <div className="header-title">
          <span className="header-eyebrow">FARM WORKSPACE</span>
          <h5 className="mb-0">Dairy Farm Management</h5>
        </div>
      </div>

      <div className="header-user">
        <div className="header-user-avatar" aria-hidden="true">{initials || 'U'}</div>
        <div className="user-info">
          <strong>{user?.name || 'Farm User'}</strong>
          <small>{user?.role || 'User'}</small>
        </div>
        <span className="header-user-divider" />
        <Button variant="outline-danger" size="sm" onClick={handleLogout} className="logout-button">Logout</Button>
      </div>
    </header>
  );
}

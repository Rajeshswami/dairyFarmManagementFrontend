import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/", icon: "⌂" },
  { label: "Customers", path: "/customers", icon: "♙" },
  { label: "Animals", path: "/animals", icon: "🐄" },
  { label: "Milk Production", path: "/milk-production", icon: "◒" },
  { label: "Milk Delivery", path: "/milk-delivery", icon: "↗" },
  { label: "Bills", path: "/bills", icon: "▤" },
  { label: "Payments", path: "/payments", icon: "₹" },
  { label: "Reports", path: "/reports", icon: "▥" },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-icon" aria-hidden="true">🐄</div>
        <div className="brand-copy">
          <div className="brand-title">Dairy Farm</div>
          <div className="brand-subtitle">MANAGEMENT SYSTEM</div>
        </div>
        <button type="button" className="sidebar-close-button" aria-label="Close navigation" onClick={onClose}>×</button>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === "/" && <span className="sidebar-active-dot" aria-hidden="true" />}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-mark">✦</div>
        <div><strong>Every drop counts.</strong><span>Manage your farm with clarity.</span></div>
      </div>
    </aside>
  );
}

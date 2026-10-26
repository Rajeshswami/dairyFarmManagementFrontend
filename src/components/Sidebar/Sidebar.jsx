import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/" },
  { label: "Customers", path: "/customers" },
  { label: "Animals", path: "/animals" },
  { label: "Milk Production", path: "/milk-production" },
  { label: "Milk Delivery", path: "/milk-delivery" },
  { label: "Bills", path: "/bills" },
  { label: "Payments", path: "/payments" },
  { label: "Reports", path: "/reports" },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">🐄</div>

        <div>
          <div className="brand-title">Dairy Farm</div>
          <div className="brand-subtitle">Management</div>
        </div>

        <button
          type="button"
          className="sidebar-close-button"
          aria-label="Close navigation"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

import { NavLink } from 'react-router-dom';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/',
  },
  {
    label: 'Customers',
    path: '/customers',
  },
  {
    label: 'Animals',
    path: '/animals',
  },
  {
    label: 'Milk Production',
    path: '/milk-production',
  },
  {
    label: 'Milk Delivery',
    path: '/milk-delivery',
  },
  {
    label: 'Bills',
    path: '/bills',
  },
  {
    label: 'Payments',
    path: '/payments',
  },
  {
    label: 'Reports',
    path: '/reports',
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">🐄</div>

        <div>
          <div className="brand-title">
            Dairy Farm
          </div>

          <div className="brand-subtitle">
            Management
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? 'active' : ''
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", hindi: "मुख्य पृष्ठ", path: "/", icon: "⌂" },
  { label: "Customers", hindi: "ग्राहक", path: "/customers", icon: "♙" },
  { label: "Animals", hindi: "पशु", path: "/animals", icon: "♧" },
  { label: "Milk Production", hindi: "दूध उत्पादन", path: "/milk-production", icon: "◉" },
  { label: "Milk Delivery", hindi: "दूध वितरण", path: "/milk-delivery", icon: "↗" },
  { label: "Bills", hindi: "बिल / हिसाब", path: "/bills", icon: "▤" },
  { label: "Payments", hindi: "पैसे जमा करें", path: "/payments", icon: "₹" },
  { label: "Reports", hindi: "रिपोर्ट", path: "/reports", icon: "▥" },
  { label: "Voice Assistant", hindi: "आवाज़ सहायक", path: "/voice-assistant", icon: "🎙" },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("dairy-app-language") || "hi");
  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem("dairy-app-language") || "hi");
    window.addEventListener("dairy-language-change", syncLanguage);
    return () => window.removeEventListener("dairy-language-change", syncLanguage);
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-icon" aria-hidden="true">🌿</div>

        <div>
          <div className="brand-title">{language === "hi" ? "अपना डेयरी" : "Dairy Farm"}</div>
          <div className="brand-subtitle">{language === "hi" ? "आसान हिसाब-किताब" : "Management"}</div>
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
            <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
            <span className="sidebar-link-label">{language === "hi" ? item.hindi : item.label}</span>
            <span className="sidebar-link-arrow" aria-hidden="true">›</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

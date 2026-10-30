import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', hindi: 'मुख्य पृष्ठ', path: '/', icon: '⌂' },
  { label: 'Customers', hindi: 'ग्राहक प्रबंधन', path: '/customers', icon: '♙' },
  { label: 'Animals', hindi: 'पशु प्रबंधन', path: '/animals', icon: '♧' },
  { label: 'Milk Production', hindi: 'दूध उत्पादन', path: '/milk-production', icon: '◉' },
  { label: 'Milk Delivery', hindi: 'डिलीवरी प्रबंधन', path: '/milk-delivery', icon: '↗' },
  { label: 'Bills', hindi: 'मासिक बिल', path: '/bills', icon: '▤' },
  { label: 'Payments', hindi: 'भुगतान', path: '/payments', icon: '₹' },
  { label: 'Reports', hindi: 'रिपोर्ट', path: '/reports', icon: '▥' },
  { label: 'Voice Assistant', hindi: 'वॉइस असिस्टेंट', path: '/voice-assistant', icon: '🎙' },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('dairy-app-language') || 'hi');
  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem('dairy-app-language') || 'hi');
    window.addEventListener('dairy-language-change', syncLanguage);
    return () => window.removeEventListener('dairy-language-change', syncLanguage);
  }, []);

  return <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
    <div className="sidebar-brand">
      <div className="brand-icon" aria-hidden="true">🐄</div>
      <div className="sidebar-brand-copy"><div className="brand-title">{language === 'hi' ? 'मेरी डेयरी' : 'My Dairy'}</div><div className="brand-subtitle">{language === 'hi' ? 'आपका भरोसेमंद साथी' : 'Your trusted farm partner'}</div></div>
      <button type="button" className="sidebar-close-button" aria-label="Close navigation" onClick={onClose}>×</button>
    </div>
    <nav className="sidebar-nav" aria-label="Main navigation">
      {menuItems.map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span><span className="sidebar-link-label">{language === 'hi' ? item.hindi : item.label}</span><span className="sidebar-link-arrow" aria-hidden="true">›</span>
      </NavLink>)}
    </nav>
    <div className="sidebar-farm-note"><span className="farm-note-illustration">🌾🐄</span><div><strong>{language === 'hi' ? 'किसान का सम्मान' : 'Proudly supporting farmers'}</strong><span>{language === 'hi' ? 'हमारी पहचान' : 'Everyday dairy made simpler'}</span></div></div>
  </aside>;
}

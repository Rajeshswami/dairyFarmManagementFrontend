import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState(() => localStorage.getItem('dairy-app-language') || 'hi');
  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem('dairy-app-language') || 'hi');
    window.addEventListener('dairy-language-change', syncLanguage);
    return () => window.removeEventListener('dairy-language-change', syncLanguage);
  }, []);
  const changeLanguage = (next) => {
    localStorage.setItem('dairy-app-language', next); setLanguage(next);
    window.dispatchEvent(new CustomEvent('dairy-language-change', { detail: next }));
  };
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const today = new Date();
  return <header className="app-header">
    <div className="header-left">
      <button type="button" className="mobile-menu-button" aria-label="Open navigation" onClick={onMenuToggle}><span/><span/><span/></button>
      <div className="header-title"><h5 className="mb-0">{language === 'hi' ? 'नमस्ते' : 'Welcome'}, {user?.name || (language === 'hi' ? 'जी' : 'there')} 👋</h5><small>{language === 'hi' ? 'आज की डेयरी गतिविधियों का सारांश' : 'Here is what is happening on your farm today'}</small></div>
    </div>
    <div className="header-user">
      <div className="header-date-card"><span className="header-date-icon">▦</span><div><small>{language === 'hi' ? 'आज की तारीख' : "Today's date"}</small><strong>{today.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</strong></div></div>
      <label className="language-picker-label"><span className="visually-hidden">Language / भाषा</span><select aria-label="Language / भाषा" className="form-select form-select-sm language-picker" value={language} onChange={(event) => changeLanguage(event.target.value)}><option value="hi">हिन्दी</option><option value="en">English</option></select></label>
      <div className="user-info"><strong>{user?.name}</strong><small>{language === 'hi' ? ({ ADMIN: 'प्रशासक', MANAGER: 'प्रबंधक', STAFF: 'कर्मचारी' }[user?.role] || user?.role) : user?.role}</small></div>
      <Button variant="outline-secondary" size="sm" onClick={handleLogout} className="logout-button">{language === 'hi' ? 'लॉग आउट' : 'Logout'}</Button>
    </div>
  </header>;
}

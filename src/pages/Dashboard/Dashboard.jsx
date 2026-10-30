import { useEffect, useState } from 'react';
import { Alert, Col, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getDashboardApi } from '../../api/dashboard.api';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const number = (value) => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

function useLanguage() {
  const [language, setLanguage] = useState(() => localStorage.getItem('dairy-app-language') || 'hi');
  useEffect(() => {
    const sync = (event) => setLanguage(event.detail || localStorage.getItem('dairy-app-language') || 'hi');
    window.addEventListener('dairy-language-change', sync);
    return () => window.removeEventListener('dairy-language-change', sync);
  }, []);
  return language;
}

const quickActions = [
  { to: '/customers', icon: '👥', title: 'नया ग्राहक जोड़ें', en: 'Add customer', tone: 'mint' },
  { to: '/animals', icon: '🐄', title: 'पशु जोड़ें', en: 'Add animal', tone: 'blue' },
  { to: '/milk-production', icon: '🥛', title: 'दूध दर्ज करें', en: 'Record milk', tone: 'butter' },
  { to: '/milk-delivery', icon: '🚚', title: 'डिलीवरी राउंड', en: 'Delivery round', tone: 'rose' },
  { to: '/bills', icon: '🧾', title: 'बिल देखें', en: 'View bills', tone: 'lavender' },
  { to: '/voice-assistant', icon: '🎙️', title: 'वॉइस असिस्टेंट', en: 'Voice assistant', tone: 'aqua' },
];

export default function Dashboard() {
  const language = useLanguage();
  const isHindi = language === 'hi';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true); setError('');
        const data = await getDashboardApi(year, month);
        if (active) setDashboard(data);
      } catch (err) {
        if (active) setError(err.response?.data?.message || (isHindi ? 'डैशबोर्ड लोड नहीं हो पाया।' : 'Failed to load dashboard.'));
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [year, month]);

  if (loading) return <div className="page-loading"><Spinner animation="border" /><span>{isHindi ? 'डैशबोर्ड खुल रहा है…' : 'Loading dashboard…'}</span></div>;
  if (error) return <Alert variant="danger">{Array.isArray(error) ? error.join(', ') : error}</Alert>;
  if (!dashboard) return null;

  const customers = dashboard.customers || {};
  const animals = dashboard.animals || {};
  const production = dashboard.production || {};
  const delivery = dashboard.delivery || {};
  const billing = dashboard.billing || {};
  const payments = dashboard.payments || {};
  const stats = [
    { icon: '👥', label: isHindi ? 'कुल ग्राहक' : 'Total customers', value: number(customers.total), note: `${number(customers.active)} ${isHindi ? 'चालू ग्राहक' : 'active'}`, tone: 'mint' },
    { icon: '🐄', label: isHindi ? 'कुल पशु' : 'Total animals', value: number(animals.total), note: `${number(animals.active)} ${isHindi ? 'चालू पशु' : 'active'}`, tone: 'blue' },
    { icon: '🥛', label: isHindi ? 'कुल दूध उत्पादन' : 'Milk produced', value: `${number(production.totalLiters)} L`, note: `${number(production.morningLiters)} L ${isHindi ? 'सुबह' : 'morning'} · ${number(production.eveningLiters)} L ${isHindi ? 'शाम' : 'evening'}`, tone: 'butter' },
    { icon: '🚚', label: isHindi ? 'दूध की डिलीवरी' : 'Milk delivered', value: `${number(delivery.totalLiters)} L`, note: money(delivery.totalAmount), tone: 'rose' },
    { icon: '₹', label: isHindi ? 'कुल बाकी राशि' : 'Pending balance', value: money(billing.totalPending), note: `${number(payments.paidCustomers)} ${isHindi ? 'ग्राहकों ने भुगतान किया' : 'customers paid'}`, tone: 'lavender' },
  ];
  const finance = [
    { label: isHindi ? 'कुल बिल' : 'Total billing', value: money(billing.totalBilling), icon: '🧾' },
    { label: isHindi ? 'जमा राशि' : 'Collected', value: money(billing.totalCollected), icon: '💰' },
    { label: isHindi ? 'बाकी राशि' : 'Pending', value: money(billing.totalPending), icon: '⏳' },
    { label: isHindi ? 'भुगतान करने वाले ग्राहक' : 'Paid customers', value: number(payments.paidCustomers), icon: '🤝' },
  ];

  return (
    <div className="dashboard-page soft-dashboard">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-kicker">{isHindi ? 'आपकी डेयरी का आज का सारांश' : 'YOUR FARM AT A GLANCE'}</span>
          <h1>{isHindi ? 'राम राम सा! आज का काम कैसा चल रहा है?' : 'Good day! Here is your farm summary.'}</h1>
          <p>{isHindi ? 'दूध, ग्राहक, डिलीवरी और भुगतान — सबका हिसाब एक जगह।' : 'Keep track of milk, customers, deliveries and payments in one place.'}</p>
        </div>
        <div className="dashboard-period-card">
          <span className="period-icon">🗓️</span>
          <label htmlFor="dashboard-month">{isHindi ? 'हिसाब का महीना' : 'Reporting month'}</label>
          <div className="dashboard-period-selects">
            <select id="dashboard-month" className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {monthNames.map((name, index) => <option key={name} value={index + 1}>{isHindi ? new Date(2025, index, 1).toLocaleDateString('hi-IN', { month: 'long' }) : name}</option>)}
            </select>
            <select className="form-select" aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[year - 2, year - 1, year, year + 1].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="dashboard-stat-grid" aria-label={isHindi ? 'मुख्य जानकारी' : 'Key metrics'}>
        {stats.map((item) => <article className={`dashboard-stat-card tone-${item.tone}`} key={item.label}>
          <div className="dashboard-stat-top"><span className="dashboard-stat-icon">{item.icon}</span><span className="dashboard-stat-label">{item.label}</span></div>
          <strong className="dashboard-stat-value">{item.value}</strong>
          <span className="dashboard-stat-note">{item.note}</span>
          <span className="stat-decoration" aria-hidden="true">{item.icon}</span>
        </article>)}
      </section>

      <div className="dashboard-section-heading"><div><span className="section-eyebrow">{isHindi ? 'काम जल्दी करें' : 'GET THINGS DONE'}</span><h2>{isHindi ? 'त्वरित कार्य' : 'Quick actions'}</h2></div><span className="section-heading-note">{isHindi ? 'ज़रूरी काम एक टैप में' : 'Your everyday shortcuts'}</span></div>
      <section className="dashboard-quick-grid">
        {quickActions.map((action) => <Link className={`dashboard-quick-card tone-${action.tone}`} to={action.to} key={action.to}>
          <span className="quick-card-icon">{action.icon}</span><strong>{isHindi ? action.title : action.en}</strong><span className="quick-card-arrow">↗</span>
        </Link>)}
      </section>

      <div className="dashboard-section-heading dashboard-finance-heading"><div><span className="section-eyebrow">{isHindi ? 'महीने का हिसाब' : 'MONTHLY OVERVIEW'}</span><h2>{isHindi ? 'बिल और भुगतान' : 'Billing & collections'}</h2></div><Link to="/bills" className="dashboard-text-link">{isHindi ? 'बिल देखें' : 'View bills'} ↗</Link></div>
      <Row className="g-3 dashboard-finance-grid">
        {finance.map((item, index) => <Col xs={12} sm={6} xl={3} key={item.label}><article className={`dashboard-finance-card finance-${index}`}><span className="finance-icon">{item.icon}</span><div><span>{item.label}</span><strong>{item.value}</strong></div></article></Col>)}
      </Row>
      <div className="dashboard-footer-note"><span>🌱</span>{isHindi ? 'अच्छा हिसाब, बेहतर डेयरी प्रबंधन।' : 'Better records make a better-run dairy.'}</div>
    </div>
  );
}

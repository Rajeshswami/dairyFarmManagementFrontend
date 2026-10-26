const variants = {
  'Total Customers': ['teal', '👥'], 'Active Customers': ['green', '✓'],
  'Total Animals': ['gold', '🐄'], 'Active Animals': ['coral', '♥'],
  'Production': ['teal', '🥛'], 'Production - Morning': ['gold', '☀'],
  'Production - Evening': ['purple', '☾'], 'Delivered': ['green', '↗'],
  'Total Billing': ['gold', '₹'], 'Collected': ['green', '✓'],
  'Pending': ['coral', '◷'], 'Paid Customers': ['purple', '✓'],
};
export default function StatCard({ title, value, subtitle }) {
  const [variant, icon] = variants[title] || ['teal', '•'];
  return <div className={`stat-card stat-card--${variant}`} style={{ '--stat-tint': variant === 'gold' ? '#fff1ce' : variant === 'coral' ? '#ffebe5' : variant === 'purple' ? '#efecff' : variant === 'green' ? '#e0f5e9' : '#e0f4ed' }}>
    <div className="stat-card-icon" aria-hidden="true">{icon}</div>
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
  </div>;
}

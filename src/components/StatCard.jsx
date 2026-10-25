const iconTones = {
  green: 'stat-icon-green',
  mint: 'stat-icon-mint',
  gold: 'stat-icon-gold',
  blue: 'stat-icon-blue',
  rose: 'stat-icon-rose',
};

export default function StatCard({ title, value, subtitle, icon = '•', tone = 'green' }) {
  return (
    <article className={`stat-card ${iconTones[tone] || iconTones.green}`}>
      <div className="stat-card-top">
        <div className="stat-title">{title}</div>
        <div className="stat-icon" aria-hidden="true">{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </article>
  );
}

import AnimatedNumber from "./AnimatedNumber";

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "purple",
  change,
}) {
  return (
    <article className={`stat-card stat-${color}`}>
      <div className="stat-card-top">
        <span>{title}</span>
        <div className="stat-icon">
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <strong className="stat-value"><AnimatedNumber value={value} /></strong>

      {change && (
        <p className="stat-change">{change}</p>
      )}
    </article>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'amber' | 'red' | 'green';
  subtitle?: string;
}

const colorMap = {
  blue: 'border-blue-500',
  amber: 'border-amber-500',
  red: 'border-red-500',
  green: 'border-green-500',
};

export function StatCard({ title, value, color, subtitle }: StatCardProps) {
  return (
    <div className={`stat-card ${colorMap[color]}`}>
      <h2 className="text-3xl font-bold text-gray-900 mb-1">{value}</h2>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

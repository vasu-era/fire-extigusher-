'use client';

import { StatCard } from '../ui/StatCard';
import { DashboardStats } from '@/types';

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Customers (FY)"
        value={stats.total}
        color="blue"
      />
      <StatCard
        title="Expiry Due (30 Days)"
        value={stats.expiryDue}
        color="amber"
      />
      <StatCard
        title="Expired Customers"
        value={stats.expired}
        color="red"
      />
      <StatCard
        title="Monthly Report"
        value={stats.monthlyCount}
        color="green"
      />
    </div>
  );
}

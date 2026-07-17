'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentCustomers } from '@/components/dashboard/RecentCustomers';
import { NotificationPortal } from '@/components/dashboard/NotificationPortal';
import { getCurrentFY, getFYDates } from '@/lib/financial-year';
import { DashboardStats, Customer, Notification } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [stats, setStats] = useState<DashboardStats>({ total: 0, expiryDue: 0, expired: 0, monthlyCount: 0 });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [selectedFY, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, customersRes] = await Promise.all([
        fetch(`/api/reports/dashboard?fy=${selectedFY}`),
        fetch(`/api/customers?fy=${selectedFY}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setRecentCustomers(customersData.customers.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <Sidebar />
      <div className="ml-[260px] p-8">
        <TopNavbar selectedFY={selectedFY} onFYChange={setSelectedFY} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-gray-500">Loading dashboard...</div>
          </div>
        ) : (
          <>
            <StatsGrid stats={stats} />

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <RecentCustomers
                  customers={recentCustomers}
                  onViewAll={() => router.push('/customers')}
                  fy={selectedFY}
                />
              </div>

              <div>
                <NotificationPortal
                  notifications={notifications}
                  onRenew={(id) => router.push(`/customers/${id}/renew`)}
                  onViewAll={() => router.push('/reports/monthly')}
                  fy={selectedFY}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

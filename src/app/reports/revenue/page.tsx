'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { getCurrentFY } from '@/lib/financial-year';
import { MonthlyTrendChart, TypeBreakdownChart, TypeBarChart } from '@/components/revenue/RevenueCharts';

interface RevenueData {
  totalRevenue: number;
  refillingRevenue: number;
  newSalesRevenue: number;
  pendingPayments: number;
  actualReceived: number;
  totalCustomers: number;
  monthlyTrend: any[];
  typeBreakdown: any[];
}

export default function RevenueDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) fetchData();
  }, [selectedFY, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/revenue?fy=${selectedFY}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <TopNavbar selectedFY={selectedFY} onFYChange={setSelectedFY} />

        <div className="report-container">
          <div className="header-section">
            <div>
              <h2>💰 REVENUE DASHBOARD</h2>
              <p>RAKESH GAS SUPPLIERS — Financial Performance & Analytics</p>
            </div>
            <div className="fy-badge">Financial Year: {selectedFY === '25-26' ? '2025-26' : '2026-27'}</div>
          </div>

          {loading || !data ? (
            <div className="bg-white rounded-xl shadow-card p-10 text-center text-gray-500">Loading revenue data...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 25 }}>
                <div className="report-stat-card total">
                  <h3>Total Revenue</h3>
                  <p style={{ fontSize: 22 }}>₹{data.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="report-stat-card new-type">
                  <h3>Refilling</h3>
                  <p style={{ fontSize: 22 }}>₹{data.refillingRevenue.toLocaleString()}</p>
                </div>
                <div className="report-stat-card renew-type">
                  <h3>New Sales</h3>
                  <p style={{ fontSize: 22 }}>₹{data.newSalesRevenue.toLocaleString()}</p>
                </div>
                <div className="report-stat-card due">
                  <h3>Received</h3>
                  <p style={{ fontSize: 22 }}>₹{data.actualReceived.toLocaleString()}</p>
                </div>
                <div className="report-stat-card expired">
                  <h3>Pending</h3>
                  <p style={{ fontSize: 22 }}>₹{data.pendingPayments.toLocaleString()}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 25, marginBottom: 25 }}>
                <MonthlyTrendChart data={data.monthlyTrend} />
                <TypeBreakdownChart data={data.typeBreakdown} />
              </div>

              <div style={{ marginBottom: 25 }}>
                <TypeBarChart data={data.typeBreakdown} />
              </div>

              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalCustomers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Avg Revenue per Customer</p>
                    <p className="text-2xl font-bold text-gray-900">₹{Math.round(data.totalRevenue / (data.totalCustomers || 1)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Refilling vs New Sales Ratio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.refillingRevenue > 0 ? Math.round((data.refillingRevenue / (data.refillingRevenue + data.newSalesRevenue || 1)) * 100) : 0}% / {data.newSalesRevenue > 0 ? Math.round((data.newSalesRevenue / (data.refillingRevenue + data.newSalesRevenue || 1)) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

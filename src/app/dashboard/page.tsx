'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { getCurrentFY } from '@/lib/financial-year';
import { DashboardStats, Customer } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [stats, setStats] = useState<DashboardStats>({ total: 0, expiryDue: 0, expired: 0, monthlyCount: 0 });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
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
      const [statsRes, customersRes] = await Promise.all([
        fetch(`/api/reports/dashboard?fy=${selectedFY}`),
        fetch(`/api/customers?fy=${selectedFY}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({ total: statsData.total, expiryDue: statsData.expiryDue, expired: statsData.expired, monthlyCount: statsData.monthlyCount });
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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <TopNavbar selectedFY={selectedFY} onFYChange={setSelectedFY} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading dashboard...</div>
        ) : (
          <>
            <div className="cards-grid">
              <div className="stat-card total">
                <h2>{stats.total}</h2>
                <p>Total Customers (FY)</p>
              </div>
              <div className="stat-card due">
                <h2>{stats.expiryDue}</h2>
                <p>Expiry Due (30 Days)</p>
              </div>
              <div className="stat-card expired">
                <h2>{stats.expired}</h2>
                <p>Expired Customers</p>
              </div>
              <div className="stat-card report">
                <h2>{stats.monthlyCount}</h2>
                <p>Monthly Report Count</p>
              </div>
            </div>

            <div className="dashboard-details-layout">
              <div className="welcome-panel">
                <div className="panel-header-flex">
                  <h3>➕ Recently Added (FY {selectedFY})</h3>
                  <Link href="/customers" className="view-all-link">View All Customers →</Link>
                </div>

                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Certificate No.</th>
                      <th>Expiry Date</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCustomers.length > 0 ? (
                      recentCustomers.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="cust-name-badge">
                              <span className="user-avatar-icon">👤</span>
                              <b>{c.customer_name}</b>
                            </div>
                          </td>
                          <td><span className="cert-badge">📄 {c.certificate_no}</span></td>
                          <td><span>📅 {new Date(c.expiry_date).toLocaleDateString('en-GB')}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <Link href={`/customers/${c.id}/certificate`} target="_blank" className="table-view-btn">👁️ View</Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Is financial year me koi customer nahi hai.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

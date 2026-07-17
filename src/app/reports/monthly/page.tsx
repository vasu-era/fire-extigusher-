'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { getCurrentFY } from '@/lib/financial-year';
import { Customer } from '@/types';

export default function MonthlyReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchReport();
    }
  }, [selectedFY, month, year, session]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?fy=${selectedFY}&month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
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

        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📅 Monthly Report (FY {selectedFY})
          </h2>

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleDateString('en-IN', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : customers.length > 0 ? (
            <CustomerTable
              customers={customers}
              onViewCertificate={(id) => router.push(`/customers/${id}/certificate`)}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No customers found for this month
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { getCurrentFY } from '@/lib/financial-year';
import { Customer } from '@/types';

export default function ExpiryReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchExpiryData();
    }
  }, [session]);

  const fetchExpiryData = async () => {
    try {
      const res = await fetch('/api/reports/expiry');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching expiry data:', error);
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
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ⏰ Expiry Due Customers (Next 30 Days)
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-card">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : customers.length > 0 ? (
            <CustomerTable
              customers={customers}
              onViewCertificate={(id) => router.push(`/customers/${id}/certificate`)}
              onRenew={(id) => router.push(`/customers/${id}/renew`)}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No customers expiring in the next 30 days
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

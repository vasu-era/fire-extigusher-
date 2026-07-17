'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { SearchBar } from '@/components/customers/SearchBar';
import { getCurrentFY } from '@/lib/financial-year';
import { Customer } from '@/types';

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCustomers();
    }
  }, [selectedFY, search, session]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?fy=${selectedFY}&search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              👥 Customer Records (FY {selectedFY})
            </h2>
            <button
              onClick={() => router.push('/customers/new')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover"
            >
              + Add New Customer
            </button>
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, mobile, or certificate number..."
          />
        </div>

        <div className="bg-white rounded-xl shadow-card">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading customers...</div>
          ) : customers.length > 0 ? (
            <CustomerTable
              customers={customers}
              onEdit={(id) => router.push(`/customers/${id}/edit`)}
              onDelete={handleDelete}
              onViewCertificate={(id) => router.push(`/customers/${id}/certificate`)}
              onRenew={(id) => router.push(`/customers/${id}/renew`)}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No customers found for this financial year
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

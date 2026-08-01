'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Customer } from '@/types';
import Link from 'next/link';

export default function ExpiryReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);
  useEffect(() => { if (session) fetchData(); }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/reports/expiry');
      if (res.ok) { const d = await res.json(); setCustomers(d.customers); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (status === 'loading' || !session) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>⏰ Expiry Due Customers (Next 30 Days)</h2>
          <Link href="/dashboard" className="nav-btn btn-back">← Dashboard</Link>
        </div>

        <div className="expiry-page">
          <table>
            <thead><tr><th>Certificate No</th><th>Customer Name</th><th>Mobile</th><th>Expiry Date</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : customers.length > 0 ? customers.map(c => (
                <tr key={c.id}>
                  <td>{c.certificate_no}</td>
                  <td>{c.customer_name}</td>
                  <td>{c.mobile}</td>
                  <td>{new Date(c.expiry_date).toLocaleDateString('en-GB')}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Link href={`/customers/${c.id}/certificate`} target="_blank" className="action-btn btn-view-print" style={{ marginRight: 5 }}>🖨️</Link>
                    <Link href={`/customers/${c.id}/renew`} className="action-btn btn-edit-action">🔄</Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No customers expiring in the next 30 days.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

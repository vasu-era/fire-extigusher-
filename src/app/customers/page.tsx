'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { getCurrentFY } from '@/lib/financial-year';
import { daysUntilExpiry } from '@/lib/utils';
import { Customer } from '@/types';
import { FYOption } from '@/lib/financial-year';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fyOptions, setFyOptions] = useState<FYOption[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/reports/fy-options')
      .then(r => r.json())
      .then(d => setFyOptions(d.options || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session) fetchCustomers();
  }, [selectedFY, session]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?fy=${selectedFY}`);
      if (res.ok) { const d = await res.json(); setCustomers(d.customers); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer?')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    fetchCustomers();
  };

  const filtered = customers.filter(c =>
    !search || c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search) || c.certificate_no.toLowerCase().includes(search.toLowerCase())
  );

  const fyDisplay = selectedFY === 'all' ? 'All Time Records' : selectedFY === 'others' ? 'Unassigned Records' : `FY 20${selectedFY.split('-')[0]}-${selectedFY.split('-')[1]}`;

  if (status === 'loading' || !session) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  const exportToExcel = () => {
    const rows = filtered.map(c => ({
      'Certificate No.': c.certificate_no,
      'Customer Name': c.customer_name,
      'Mobile': c.mobile,
      'Address': c.address || '',
      'Issue Date': new Date(c.service_date).toLocaleDateString('en-GB'),
      'Expiry Date': new Date(c.expiry_date).toLocaleDateString('en-GB'),
      'Total Qty': c.total_qty,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_${selectedFY}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <div className="custlist-container">
          <div className="header-panel">
            <div>
              <h2>👥 CUSTOMER MASTER DATABASE</h2>
              <p>Rakesh Gas Suppliers — Viewing Records for <strong>{fyDisplay}</strong></p>
            </div>
            <div className="top-nav-btns">
              <select className="fy-select" value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
                {fyOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                <option value="all">All Time</option>
                <option value="others">Others/Unassigned</option>
              </select>
              <Link href="/dashboard" className="nav-btn btn-back">← Dashboard</Link>
            </div>
          </div>

          <div className="search-panel">
            <div className="search-box-wrapper">
              <span>🔍</span>
              <input type="text" className="search-input" placeholder="Type name, phone number, or certificate number to search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="total-badge">Customers in {selectedFY === 'all' ? 'Database' : selectedFY}: {filtered.length}</div>
            <button type="button" className="btn-style btn-excel" onClick={exportToExcel}>📊 Export Excel</button>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Certificate No</th><th>Customer Name</th><th>Mobile</th>
                  <th>Issue Date</th><th>Expiry Date</th><th>Qty</th><th>Status</th>
                  <th style={{ textAlign: 'center' }} colSpan={3}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map(c => {
                  const days = daysUntilExpiry(c.expiry_date);
                  const statusClass = days < 0 ? 'status-expired' : days <= 30 ? 'status-due' : 'status-active';
                  const statusText = days < 0 ? '🔴 Expired' : days <= 30 ? `🟡 Due (${days} Days)` : `🟢 Active (${days} Days)`;
                  return (
                    <tr key={c.id}>
                      <td className="id-col">#{c.id}</td>
                      <td><span className="cust-cert-badge">📄 {c.certificate_no}</span></td>
                      <td><span className="cust-name-bold">{c.customer_name}</span></td>
                      <td style={{ fontWeight: 500, color: '#475569' }}>📞 {c.mobile}</td>
                      <td>📅 {new Date(c.service_date).toLocaleDateString('en-GB')}</td>
                      <td>📅 {new Date(c.expiry_date).toLocaleDateString('en-GB')}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{c.total_qty} Nos</td>
                      <td><span className={`status-tag ${statusClass}`}>{statusText}</span></td>
                      <td style={{ width: 50, paddingRight: 5 }}>
                        <Link href={`/customers/${c.id}/certificate`} target="_blank" className="action-btn btn-view-print" title="Print Certificate">🖨️</Link>
                      </td>
                      <td style={{ width: 50, padding: '16px 5px' }}>
                        <Link href={`/customers/${c.id}/edit`} className="action-btn btn-edit-action" title="Edit">✏️</Link>
                      </td>
                      <td style={{ width: 50, paddingLeft: 5 }}>
                        <button onClick={() => handleDelete(c.id)} className="action-btn btn-delete-action" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#64748b', fontWeight: 500 }}>Is Financial Year me koi bhi customer record nahi mila.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

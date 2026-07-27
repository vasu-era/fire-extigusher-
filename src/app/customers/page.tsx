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

type StatusFilter = 'all' | 'due' | 'expired' | 'active';
type SortBy = 'latest' | 'expiryAsc' | 'nameAsc' | 'qtyDesc';

function formatDateSafe(date: string) {
  if (!date) return '-';
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('en-GB');
}

function getStatus(days: number) {
  if (days < 0) return { key: 'expired' as const, className: 'status-expired', label: `Expired ${Math.abs(days)} days ago` };
  if (days <= 30) return { key: 'due' as const, className: 'status-due', label: days === 0 ? 'Due today' : `Due in ${days} days` };
  return { key: 'active' as const, className: 'status-active', label: `Active ${days} days` };
}

function getWhatsAppHref(customer: Customer, days: number) {
  const digits = customer.mobile.replace(/\D/g, '');
  const phone = digits.length > 10 ? digits.slice(-10) : digits;
  const expiryText = formatDateSafe(customer.expiry_date);
  const timing = days < 0 ? `expired ${Math.abs(days)} days ago` : days === 0 ? 'expires today' : `expires in ${days} days`;
  const message = `Namaste ${customer.customer_name}, your fire extinguisher certificate ${customer.certificate_no} ${timing} (${expiryText}). Please contact Rakesh Gas Suppliers for renewal.`;
  return phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}` : '#';
}

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fyOptions, setFyOptions] = useState<FYOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('latest');

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

  const customerStats = customers.reduce((acc, c) => {
    const status = getStatus(daysUntilExpiry(c.expiry_date));
    acc[status.key] += 1;
    acc.qty += Number(c.total_qty || 0);
    return acc;
  }, { active: 0, due: 0, expired: 0, qty: 0 });

  const filtered = customers
    .filter(c => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        c.customer_name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.certificate_no.toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || getStatus(daysUntilExpiry(c.expiry_date)).key === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'expiryAsc') return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      if (sortBy === 'nameAsc') return a.customer_name.localeCompare(b.customer_name);
      if (sortBy === 'qtyDesc') return Number(b.total_qty || 0) - Number(a.total_qty || 0);
      return b.id - a.id;
    });

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
      'Status': getStatus(daysUntilExpiry(c.expiry_date)).label,
      'Total Qty': c.total_qty,
      'Payment Status': c.payment_status,
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
              <h2>Customer Master</h2>
              <p>Rakesh Gas Suppliers - shop owner view for <strong>{fyDisplay}</strong></p>
            </div>
            <div className="top-nav-btns">
              <select className="fy-select" value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
                {fyOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                <option value="all">All Time</option>
                <option value="others">Others/Unassigned</option>
              </select>
              <Link href="/customers/new" className="nav-btn btn-primary-link">+ Add Customer</Link>
              <Link href="/dashboard" className="nav-btn btn-back">← Dashboard</Link>
            </div>
          </div>

          <div className="customer-insight-grid">
            <button type="button" className={`customer-insight-card ${statusFilter === 'all' ? 'is-selected' : ''}`} onClick={() => setStatusFilter('all')}>
              <span>Total Customers</span>
              <strong>{customers.length}</strong>
              <small>{customerStats.qty} extinguishers</small>
            </button>
            <button type="button" className={`customer-insight-card danger ${statusFilter === 'expired' ? 'is-selected' : ''}`} onClick={() => setStatusFilter('expired')}>
              <span>Expired</span>
              <strong>{customerStats.expired}</strong>
              <small>Renew first</small>
            </button>
            <button type="button" className={`customer-insight-card warning ${statusFilter === 'due' ? 'is-selected' : ''}`} onClick={() => setStatusFilter('due')}>
              <span>Due in 30 Days</span>
              <strong>{customerStats.due}</strong>
              <small>Call today</small>
            </button>
            <button type="button" className={`customer-insight-card success ${statusFilter === 'active' ? 'is-selected' : ''}`} onClick={() => setStatusFilter('active')}>
              <span>Active</span>
              <strong>{customerStats.active}</strong>
              <small>Healthy records</small>
            </button>
          </div>

          <div className="search-panel">
            <div className="search-box-wrapper">
              <span>🔍</span>
              <input type="text" className="search-input" placeholder="Search name, phone, certificate, or address..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
              <option value="latest">Latest Added</option>
              <option value="expiryAsc">Expiry First</option>
              <option value="nameAsc">Name A-Z</option>
              <option value="qtyDesc">Highest Qty</option>
            </select>
            {(search || statusFilter !== 'all') && (
              <button type="button" className="btn-style btn-clear-filter" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear</button>
            )}
            <div className="total-badge">Showing {filtered.length} of {customers.length}</div>
            <button type="button" className="btn-style btn-excel" onClick={exportToExcel}>📊 Export Excel</button>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Certificate No</th><th>Customer</th><th>Contact</th>
                  <th>Issue</th><th>Expiry</th><th>Qty</th><th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map(c => {
                  const days = daysUntilExpiry(c.expiry_date);
                  const status = getStatus(days);
                  return (
                    <tr key={c.id}>
                      <td className="id-col">#{c.id}</td>
                      <td><span className="cust-cert-badge">📄 {c.certificate_no}</span></td>
                      <td>
                        <span className="cust-name-bold">{c.customer_name}</span>
                        <small className="customer-address-line">{c.address || 'No address saved'}</small>
                      </td>
                      <td>
                        <a href={`tel:${c.mobile}`} className="contact-link">📞 {c.mobile}</a>
                        <a href={getWhatsAppHref(c, days)} target="_blank" rel="noreferrer" className="mini-whatsapp-link">WhatsApp</a>
                      </td>
                      <td>📅 {formatDateSafe(c.service_date)}</td>
                      <td>📅 {formatDateSafe(c.expiry_date)}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{c.total_qty} Nos</td>
                      <td><span className={`status-tag ${status.className}`}>{status.label}</span></td>
                      <td>
                        <div className="customer-action-stack">
                          <Link href={`/customers/${c.id}/certificate`} target="_blank" className="action-btn btn-view-print" title="Print Certificate">Print</Link>
                          {(status.key === 'due' || status.key === 'expired') && <Link href={`/customers/${c.id}/renew`} className="action-btn btn-renew-action" title="Renew">Renew</Link>}
                          <Link href={`/customers/${c.id}/edit`} className="action-btn btn-edit-action" title="Edit">Edit</Link>
                          <Link href={`/customers/${c.id}/history`} className="action-btn btn-history-action" title="Service History">History</Link>
                          <button onClick={() => handleDelete(c.id)} className="action-btn btn-delete-action" title="Delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#64748b', fontWeight: 500 }}>No customer found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

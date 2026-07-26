'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { getCurrentFY } from '@/lib/financial-year';
import { daysUntilExpiry, formatDate } from '@/lib/utils';
import { Customer } from '@/types';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function MonthlyReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('service_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);
  useEffect(() => { if (session) fetchReport(); }, [selectedFY, month, year, session]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(`/dashboard?fy=${selectedFY}`);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [router, selectedFY]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?fy=${selectedFY}&month=${month}&year=${year}&type=${filterType}&status=${filterStatus}&event=${filterEvent}&search=${search}`);
      if (res.ok) { const d = await res.json(); setAllCustomers(d.customers); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const customers = useMemo(() => {
    let result = [...allCustomers];
    if (sortBy === 'expiry_date') {
      result.sort((a, b) => sortOrder === 'asc' ? new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() : new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime());
    } else if (sortBy === 'customer_name') {
      result.sort((a, b) => sortOrder === 'asc' ? a.customer_name.localeCompare(b.customer_name) : b.customer_name.localeCompare(a.customer_name));
    } else {
      result.sort((a, b) => sortOrder === 'asc' ? new Date(a.service_date).getTime() - new Date(b.service_date).getTime() : new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
    }
    return result;
  }, [allCustomers, sortBy, sortOrder]);

  const fyDisplay = selectedFY === 'all' ? 'All Time' : `${2000 + parseInt(selectedFY.split('-')[0])}-${2000 + parseInt(selectedFY.split('-')[1])}`;

  const newCount = allCustomers.filter(c => !allCustomers.some(x => x.mobile === c.mobile && x.id < c.id)).length;
  const renewCount = allCustomers.length - newCount;
  const activeCount = allCustomers.filter(c => daysUntilExpiry(c.expiry_date) > 30).length;
  const dueCount = allCustomers.filter(c => { const d = daysUntilExpiry(c.expiry_date); return d >= 0 && d <= 30; }).length;
  const expiredCount = allCustomers.filter(c => daysUntilExpiry(c.expiry_date) < 0).length;
  const totalRevenue = allCustomers.reduce((sum, c) => sum + (c.refilling_price || 0) + (c.new_bottle_price || 0), 0);

  const monthName = new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });

  const monthOverMonth = allCustomers.length;
  const expiringNext = allCustomers.filter(c => {
    const d = daysUntilExpiry(c.expiry_date);
    return d >= 0 && d <= 7;
  });

  if (status === 'loading' || !session) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  const toggleSelect = (id: number) => {
    const u = new Set(selected);
    if (u.has(id)) u.delete(id); else u.add(id);
    setSelected(u);
  };

  const toggleAll = () => {
    if (selected.size === customers.length) setSelected(new Set());
    else setSelected(new Set(customers.map(c => c.id)));
  };

  const exportToExcel = (onlySelected = false) => {
    const dataToExport = onlySelected
      ? customers.filter(c => selected.has(c.id))
      : customers;

    const rows = dataToExport.map(c => {
      const days = daysUntilExpiry(c.expiry_date);
      const isRenew = allCustomers.some(x => x.mobile === c.mobile && x.id < c.id);
      return {
        'Certificate No.': c.certificate_no,
        'Customer Name': c.customer_name,
        'Type': isRenew ? 'Renew' : 'New',
        'Mobile': c.mobile,
        'Address': c.address,
        'Issue Date': new Date(c.service_date).toLocaleDateString('en-GB'),
        'Expiry Date': new Date(c.expiry_date).toLocaleDateString('en-GB'),
        'Days Left': days < 0 ? `Expired ${Math.abs(days)}d` : `${days} Days`,
        'Status': days < 0 ? 'Expired' : days <= 30 ? 'Due' : 'Active',
        'Qty': c.total_qty,
        'Payment Status': c.payment_status || 'pending',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    const filename = onlySelected
      ? `Selected_${monthName}_${year}.xls`
      : `Monthly_Service_Report_${month}_${year}.xls`;
    XLSX.writeFile(wb, filename);
  };

  const exportToCSV = () => {
    const headers = ['Certificate No', 'Customer Name', 'Type', 'Mobile', 'Address', 'Issue Date', 'Expiry Date', 'Days Left', 'Status'];
    const rows = customers.map(c => {
      const days = daysUntilExpiry(c.expiry_date);
      const isRenew = allCustomers.some(x => x.mobile === c.mobile && x.id < c.id);
      return [
        c.certificate_no,
        c.customer_name,
        isRenew ? 'Renew' : 'New',
        c.mobile,
        c.address,
        new Date(c.service_date).toLocaleDateString('en-GB'),
        new Date(c.expiry_date).toLocaleDateString('en-GB'),
        days < 0 ? `Expired ${Math.abs(days)}d` : `${days}d`,
        days < 0 ? 'Expired' : days <= 30 ? 'Due' : 'Active',
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monthly_Report_${month}_${year}.csv`;
    a.click();
  };

  const sendWhatsAppSelected = () => {
    const selectedCustomers = customers.filter(c => selected.has(c.id));
    if (selectedCustomers.length === 0) {
      alert('Select customers first');
      return;
    }
    router.push(`/reports/whatsapp?days=60`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <div className="report-container">
          <div className="header-section">
            <div>
              <h2>📅 MONTHLY SERVICE REPORT</h2>
              <p>RAKESH GAS SUPPLIERS — Fire Extinguisher Infrastructure Portal</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCompare(!showCompare)} className="back-dash-btn">📊 {showCompare ? 'Hide' : 'Show'} Compare</button>
              <Link href={`/dashboard?fy=${selectedFY}`} className="back-dash-btn">← Dashboard</Link>
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-form" style={{ flexWrap: 'wrap' }}>
              <div className="input-group">
                <label>Month</label>
                <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Year</label>
                <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
                  {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Event</label>
                <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                  <option value="all">All Events</option>
                  <option value="service">Serviced This Month</option>
                  <option value="expiry">Expiring This Month</option>
                </select>
              </div>
              <div className="input-group">
                <label>Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="new">New Only</option>
                  <option value="renew">Renewal Only</option>
                </select>
              </div>
              <div className="input-group">
                <label>Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="due">Due (30d)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="input-group">
                <label>Sort</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="service_date">Issue Date</option>
                  <option value="expiry_date">Expiry Date</option>
                  <option value="customer_name">Customer Name</option>
                </select>
                <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="btn-style" style={{ background: '#64748b', color: 'white', padding: '6px 10px' }}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, mobile, cert..."
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div className="btn-actions-group">
                <button onClick={fetchReport} className="btn-style btn-view">🔍 Filter</button>
                <button onClick={() => window.print()} className="btn-style btn-print">🖨 Print</button>
                <button onClick={() => exportToExcel(false)} className="btn-style btn-excel">📊 Excel</button>
                <button onClick={exportToCSV} className="btn-style" style={{ background: '#16a34a', color: 'white' }}>📄 CSV</button>
              </div>
            </div>
            <div className="fy-badge">{monthName} {year} • {customers.length} records</div>
          </div>

          {showCompare && (
            <div className="bg-white rounded-xl shadow-card p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Quick Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8 }}>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-700">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8 }}>
                  <p className="text-xs text-gray-500">Avg per Customer</p>
                  <p className="text-2xl font-bold text-green-700">₹{Math.round(totalRevenue / (customers.length || 1)).toLocaleString()}</p>
                </div>
                <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8 }}>
                  <p className="text-xs text-gray-500">Expiring in 7 Days</p>
                  <p className="text-2xl font-bold text-amber-700">{expiringNext.length}</p>
                </div>
                <div style={{ padding: 16, background: '#fce7f3', borderRadius: 8 }}>
                  <p className="text-xs text-gray-500">Renewal Rate</p>
                  <p className="text-2xl font-bold text-pink-700">{customers.length > 0 ? Math.round((renewCount / customers.length) * 100) : 0}%</p>
                </div>
                <div style={{ padding: 16, background: '#e0e7ff', borderRadius: 8 }}>
                  <p className="text-xs text-gray-500">Total Qty</p>
                  <p className="text-2xl font-bold text-indigo-700">{customers.reduce((sum, c) => sum + c.total_qty, 0)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="report-stats-grid">
            <div className="report-stat-card total"><h3>Total</h3><p>{String(customers.length).padStart(2, '0')}</p></div>
            <div className="report-stat-card new-type"><h3>New</h3><p>{String(newCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card renew-type"><h3>Renewed</h3><p>{String(renewCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card active"><h3>Active</h3><p>{String(activeCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card due"><h3>Due</h3><p>{String(dueCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card expired"><h3>Expired</h3><p>{String(expiredCount).padStart(2, '0')}</p></div>
          </div>

          {selected.size > 0 && (
            <div className="bg-white rounded-xl shadow-card p-4 mb-4" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-gray-900">{selected.size} customer(s) selected</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => exportToExcel(true)} className="btn-style btn-excel">📊 Export Selected</button>
                  <button onClick={sendWhatsAppSelected} className="btn-style" style={{ background: '#25d366', color: 'white' }}>📱 Send WhatsApp</button>
                  <button onClick={() => setSelected(new Set())} className="btn-style" style={{ background: '#64748b', color: 'white' }}>Clear</button>
                </div>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table className="report-table" id="reportTable">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.size === customers.length && customers.length > 0} onChange={toggleAll} />
                  </th>
                  <th>Certificate No.</th>
                  <th>Customer Name</th>
                  <th>Type</th>
                  <th>Mobile</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                  <th className="btn-action" style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                ) : customers.length > 0 ? customers.map(c => {
                  const days = daysUntilExpiry(c.expiry_date);
                  const statusClass = days < 0 ? 'status-expired' : days <= 30 ? 'status-due' : 'status-active';
                  const statusText = days < 0 ? '🔴 Expired' : days <= 30 ? '🟡 Due' : '🟢 Active';
                  const daysText = days < 0 ? `Expired` : `${days} Days`;
                  const isRenew = allCustomers.some(x => x.mobile === c.mobile && x.id < c.id);
                  const typeClass = isRenew ? 'type-renew' : 'type-new';
                  const typeText = isRenew ? 'Renew 🔄' : 'New ➕';

                  const svcDate = new Date(c.service_date);
                  const expDate = new Date(c.expiry_date);
                  const isServiceThisMonth = svcDate.getMonth() + 1 === month && svcDate.getFullYear() === year;
                  const isExpiryThisMonth = expDate.getMonth() + 1 === month && expDate.getFullYear() === year;

                  let typeNote = null;
                  if (isServiceThisMonth && isExpiryThisMonth) {
                    typeNote = <span className="job-tag" style={{ background: '#faf5ff', color: '#7e22ce' }}>🔄 Done & Expiring</span>;
                  } else if (isServiceThisMonth) {
                    typeNote = <span className="job-tag" style={{ background: '#ecfdf5', color: '#047857' }}>✨ Job Done This Month</span>;
                  } else if (isExpiryThisMonth) {
                    typeNote = <span className="job-tag" style={{ background: '#fff5f5', color: '#e11d48' }}>⚠️ Expiring This Month</span>;
                  }

                  const renewLink = `https://wa.me/91${c.mobile}?text=${encodeURIComponent(`Dear ${c.customer_name}, your certificate ${c.certificate_no} is expiring on ${formatDate(c.expiry_date)}. Please contact us for renewal. - Rakesh Gas Suppliers, 9377548793`)}`;

                  return (
                    <tr key={c.id} style={{ background: selected.has(c.id) ? '#eff6ff' : '' }}>
                      <td>
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                      </td>
                      <td className="cert-bold">📄 {c.certificate_no}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.customer_name}</span>
                        {typeNote && <><br />{typeNote}</>}
                      </td>
                      <td><span className={`type-tag ${typeClass}`}>{typeText}</span></td>
                      <td style={{ fontWeight: 500, color: '#475569' }}>📞 {c.mobile}</td>
                      <td>📅 {new Date(c.service_date).toLocaleDateString('en-GB')}</td>
                      <td>📅 {new Date(c.expiry_date).toLocaleDateString('en-GB')}</td>
                      <td style={{ fontWeight: 600 }}>{daysText}</td>
                      <td><span className={`status-tag ${statusClass}`}>{statusText}</span></td>
                      <td className="btn-action" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Link href={`/customers/${c.id}/certificate`} target="_blank" className="print-btn-link" title="Print Certificate">🖨️</Link>
                          <Link href={`/customers/${c.id}/edit`} className="print-btn-link" title="Edit">✏️</Link>
                          <Link href={`/customers/${c.id}/history`} className="print-btn-link" title="History">📜</Link>
                          {days <= 30 && <Link href={`/customers/${c.id}/renew`} className="print-btn-link" title="Renew" style={{ background: '#fee2e2', color: '#b91c1c' }}>🔄</Link>}
                          <a href={renewLink} target="_blank" className="print-btn-link" title="WhatsApp" style={{ background: '#dcfce7', color: '#15803d', textDecoration: 'none' }}>📱</a>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={10} style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>No data found for {monthName} {year}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

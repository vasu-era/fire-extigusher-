'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { getCurrentFY } from '@/lib/financial-year';
import { daysUntilExpiry } from '@/lib/utils';
import { Customer } from '@/types';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function MonthlyReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

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
      const res = await fetch(`/api/reports/monthly?fy=${selectedFY}&month=${month}&year=${year}`);
      if (res.ok) { const d = await res.json(); setCustomers(d.customers); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fyDisplay = selectedFY === 'all' ? 'All Time' : selectedFY === 'others' ? 'Unassigned' : `${2000 + parseInt(selectedFY.split('-')[0])}-${2000 + parseInt(selectedFY.split('-')[1])}`;
  const newCount = customers.filter((c, i) => customers.findIndex(x => x.mobile === c.mobile) === i).length;
  const renewCount = customers.length - newCount;
  const activeCount = customers.filter(c => daysUntilExpiry(c.expiry_date) > 30).length;
  const dueCount = customers.filter(c => { const d = daysUntilExpiry(c.expiry_date); return d >= 0 && d <= 30; }).length;
  const expiredCount = customers.filter(c => daysUntilExpiry(c.expiry_date) < 0).length;

  if (status === 'loading' || !session) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  const exportToExcel = () => {
    const rows = customers.map(c => {
      const days = daysUntilExpiry(c.expiry_date);
      const isRenew = customers.findIndex(x => x.mobile === c.mobile) !== customers.indexOf(c);
      return {
        'Certificate No.': c.certificate_no,
        'Customer Name': c.customer_name,
        'Type': isRenew ? 'Renew' : 'New',
        'Mobile': c.mobile,
        'Issue Date': new Date(c.service_date).toLocaleDateString('en-GB'),
        'Expiry Date': new Date(c.expiry_date).toLocaleDateString('en-GB'),
        'Days Left': days < 0 ? 'Expired' : `${days} Days`,
        'Status': days < 0 ? 'Expired' : days <= 30 ? 'Due' : 'Active',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, `Monthly_Service_Report_${month}_${year}.xls`);
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
            <Link href={`/dashboard?fy=${selectedFY}`} className="back-dash-btn">← Dashboard</Link>
          </div>

          <div className="filter-section">
            <div className="filter-form">
              <div className="input-group"><label>Month</label>
                <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>)}
                </select>
              </div>
              <div className="input-group"><label>Year</label>
                <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="btn-actions-group">
                <button type="button" className="btn-style btn-view" onClick={fetchReport}>🔍 Filter Report</button>
                <button type="button" className="btn-style btn-print" onClick={() => window.print()}>🖨 Print</button>
                <button type="button" className="btn-style btn-excel" onClick={() => exportToExcel()}>📊 Export Excel</button>
              </div>
            </div>
            <div className="fy-badge">Financial Year: {fyDisplay}</div>
          </div>

          <div className="report-stats-grid">
            <div className="report-stat-card total"><h3>Total Records</h3><p>{String(customers.length).padStart(2, '0')}</p></div>
            <div className="report-stat-card new-type"><h3>New Cust.</h3><p>{String(newCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card renew-type"><h3>Renewed</h3><p>{String(renewCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card active"><h3>Active</h3><p>{String(activeCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card due"><h3>Expiry Due</h3><p>{String(dueCount).padStart(2, '0')}</p></div>
            <div className="report-stat-card expired"><h3>Expired</h3><p>{String(expiredCount).padStart(2, '0')}</p></div>
          </div>

          <div className="table-wrapper">
            <table className="report-table" id="reportTable">
              <thead><tr><th>Certificate No.</th><th>Customer Name</th><th>Type</th><th>Mobile</th><th>Issue Date</th><th>Expiry Date</th><th>Days Left</th><th>Status</th><th className="btn-action" style={{ textAlign: 'center' }}>Action</th></tr></thead>
              <tbody>
                {customers.length > 0 ? customers.map(c => {
                  const days = daysUntilExpiry(c.expiry_date);
                  const statusClass = days < 0 ? 'status-expired' : days <= 30 ? 'status-due' : 'status-active';
                  const statusText = days < 0 ? '🔴 Expired' : days <= 30 ? '🟡 Due' : '🟢 Active';
                  const daysText = days < 0 ? 'Expired' : `${days} Days`;
                  const isRenew = customers.findIndex(x => x.mobile === c.mobile) !== customers.indexOf(c);
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

                  return (
                    <tr key={c.id}>
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
                        <Link href={`/customers/${c.id}/certificate`} target="_blank" className="print-btn-link">🖨️ Print</Link>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Is month me koi data nahi mila.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

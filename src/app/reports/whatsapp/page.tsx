'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { formatDate } from '@/lib/utils';

interface ExpiringCustomer {
  id: number;
  customer_name: string;
  mobile: string;
  certificate_no: string;
  expiry_date: string;
  days_left: number;
}

const DEFAULT_TEMPLATE = `Dear {customer_name},

Your fire extinguisher service certificate {certificate_no} is expiring on {expiry_date}.

Please contact us to renew your fire extinguisher service to maintain fire safety compliance.

Rakesh Gas Suppliers
📞 93775 48793
🌐 Junagadh, Gujarat`;

function buildMessage(template: string, c: ExpiringCustomer): string {
  return template
    .replace(/\{customer_name\}/g, c.customer_name)
    .replace(/\{certificate_no\}/g, c.certificate_no)
    .replace(/\{expiry_date\}/g, formatDate(c.expiry_date))
    .replace(/\{days_left\}/g, String(c.days_left));
}

function whatsappLink(mobile: string, message: string): string {
  let cleanMobile = mobile.replace(/[^0-9]/g, '');
  if (cleanMobile.length === 10) cleanMobile = '91' + cleanMobile;
  return `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [customers, setCustomers] = useState<ExpiringCustomer[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) fetchCustomers();
  }, [days, session]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/expiring?days=${days}`);
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.customers);
        setSelected(new Set(d.customers.map((c: ExpiringCustomer) => c.id)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    const u = new Set(selected);
    if (u.has(id)) u.delete(id); else u.add(id);
    setSelected(u);
  };

  const toggleAll = () => {
    if (selected.size === customers.length) setSelected(new Set());
    else setSelected(new Set(customers.map(c => c.id)));
  };

  const sendTo = (c: ExpiringCustomer) => {
    const msg = buildMessage(template, c);
    const link = whatsappLink(c.mobile, msg);
    window.open(link, '_blank');
    setSent(new Set(sent).add(c.id));
  };

  const sendToAll = () => {
    customers.filter(c => selected.has(c.id) && !sent.has(c.id)).forEach((c, i) => {
      setTimeout(() => sendTo(c), i * 1500);
    });
  };

  if (status === 'loading' || !session) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <div className="report-container">
          <div className="header-section">
            <div>
              <h2>📱 WHATSAPP EXPIRY REMINDERS</h2>
              <p>Send bulk WhatsApp messages to customers with expiring certificates</p>
            </div>
            <Link href="/dashboard" className="back-dash-btn">← Dashboard</Link>
          </div>

          <div className="filter-section">
            <div className="filter-form">
              <div className="input-group">
                <label>Expiring in next</label>
                <select value={days} onChange={e => setDays(parseInt(e.target.value))}>
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
                <label>days</label>
              </div>
              <div className="btn-actions-group">
                <button onClick={fetchCustomers} className="btn-style btn-view">🔄 Refresh</button>
                <button onClick={sendToAll} disabled={selected.size === 0} className="btn-style btn-print" style={{ background: '#25d366' }}>
                  📤 Send All ({selected.size})
                </button>
              </div>
            </div>
            <div className="fy-badge">Customers found: {customers.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">✏️ Message Template</h3>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-500">Variables: {'{customer_name}'}, {'{certificate_no}'}, {'{expiry_date}'}, {'{days_left}'}</p>
              <button onClick={() => setTemplate(DEFAULT_TEMPLATE)} className="text-sm text-blue-600 hover:underline">Reset to Default</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">👥 Customers to Remind</h3>
              <button onClick={toggleAll} className="text-sm font-semibold text-blue-600">
                {selected.size === customers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="p-10 text-center text-gray-500">✅ No customers expiring in next {days} days</div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}><input type="checkbox" checked={selected.size === customers.length} onChange={toggleAll} /></th>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Certificate</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                      <td><b>{c.customer_name}</b></td>
                      <td>📞 {c.mobile}</td>
                      <td>📄 {c.certificate_no}</td>
                      <td>📅 {formatDate(c.expiry_date)}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: c.days_left < 0 ? '#fee2e2' : c.days_left <= 7 ? '#fef3c7' : '#dbeafe',
                          color: c.days_left < 0 ? '#b91c1c' : c.days_left <= 7 ? '#b45309' : '#1e40af'
                        }}>
                          {c.days_left < 0 ? `${Math.abs(c.days_left)}d ago` : c.days_left === 0 ? 'Today' : `${c.days_left}d`}
                        </span>
                      </td>
                      <td>
                        {sent.has(c.id) ? <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Opened</span> : <span style={{ color: '#64748b' }}>Pending</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => sendTo(c)}
                          style={{
                            background: '#25d366', color: 'white', border: 'none', padding: '8px 16px',
                            borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13
                          }}
                        >
                          📤 Send
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-card p-4 mt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                <b>Total:</b> {customers.length} customers | <b>Selected:</b> {selected.size} | <b>Sent:</b> {sent.size} | <b>Pending:</b> {selected.size - sent.size}
              </p>
              <p className="text-xs text-gray-400">💡 Click "Send All" to open WhatsApp for each customer (1.5s delay between each)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

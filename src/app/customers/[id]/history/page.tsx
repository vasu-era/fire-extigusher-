'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { formatDate, daysUntilExpiry } from '@/lib/utils';

interface Service {
  id: number;
  certificate_no: string;
  customer_name: string;
  service_date: string;
  expiry_date: string;
  total_qty: number;
  address: string;
  mobile: string;
  service_revenue: number;
  ext_count: number;
  extinguisher_details: any[];
  is_active: boolean;
}

export default function CustomerHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) fetchData();
  }, [id, session]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/customers/${id}/history`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading history...</div>;
  }

  if (!data) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Customer not found</div>;
  }

  const { current, all_services, total_revenue, total_services, first_service_date } = data;

  const getStatusBadge = (service: Service) => {
    if (service.is_active === false) return { text: '🔄 Renewed / Closed', color: '#1d4ed8', bg: '#dbeafe' };
    const days = daysUntilExpiry(service.expiry_date);
    if (days < 0) return { text: '🔴 Expired', color: '#b91c1c', bg: '#fee2e2' };
    if (days <= 30) return { text: '🟡 Expiring Soon', color: '#b45309', bg: '#fef3c7' };
    return { text: '🟢 Active', color: '#15803d', bg: '#dcfce7' };
  };

  const getTypeBadge = (idx: number, total: number) => {
    if (idx === 0) return { text: '⭐ Original', color: '#6b7280', bg: '#f3f4f6' };
    if (idx === total - 1) return { text: '✨ Latest', color: '#0f172a', bg: '#e0f2fe' };
    return { text: '🔄 Renewed', color: '#3b82f6', bg: '#dbeafe' };
  };

  const latestService = all_services[all_services.length - 1];
  const latestDays = daysUntilExpiry(latestService.expiry_date);
  const needsRenewal = latestService.is_active !== false && latestDays <= 30;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <div className="custlist-container">
          <div className="header-panel">
            <div>
              <h2>Renewal History</h2>
              <p>{current.customer_name} • {current.mobile} • Total Services: {total_services} • Total Revenue: ₹{total_revenue.toLocaleString()}</p>
            </div>
            <div className="top-nav-btns" style={{ gap: 8 }}>
              {needsRenewal && (
                <a
                  href={`/customers/${latestService.id}/renew`}
                  className="nav-btn"
                  style={{ background: '#dc2626', color: 'white' }}
                >
                  🔄 Renew Customer
                </a>
              )}
              <a href={`/customers/${id}/edit`} className="nav-btn btn-back">✏️ Edit</a>
              <a href="/customers" className="nav-btn btn-back">← Back</a>
            </div>
          </div>

          {first_service_date && (
            <div className="bg-white rounded-xl shadow-card p-4 mb-4">
              <p className="text-sm text-gray-600">
                🎉 <b>{current.customer_name}</b> has been our customer since <b>{formatDate(first_service_date)}</b> ({Math.ceil((new Date().getTime() - new Date(first_service_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years)
              </p>
            </div>
          )}

          {needsRenewal && (
            <div className="bg-white rounded-xl shadow-card p-4 mb-4" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">
                    ⚠️ Latest certificate ({latestService.certificate_no}) {latestDays < 0 ? `expired ${Math.abs(latestDays)} days ago` : 'is expiring soon'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Expiry date: {formatDate(latestService.expiry_date)}</p>
                </div>
                <a
                  href={`/customers/${latestService.id}/renew`}
                  style={{ background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}
                >
                  🔄 Renew Now
                </a>
              </div>
            </div>
          )}

          <div className="history-summary-grid">
            <div className="history-summary-card">
              <span>Total Services</span>
              <strong>{total_services}</strong>
            </div>
            <div className="history-summary-card">
              <span>Total Revenue</span>
              <strong>₹{total_revenue.toLocaleString()}</strong>
            </div>
            <div className="history-summary-card">
              <span>Latest Certificate</span>
              <strong>{latestService.certificate_no}</strong>
            </div>
            <div className="history-summary-card">
              <span>Latest Expiry</span>
              <strong>{formatDate(latestService.expiry_date)}</strong>
            </div>
          </div>

          <div className="history-table-card">
            <div className="history-table-header">
              <div>
                <h3>Service History</h3>
                <p>All original and renewed certificates for this customer.</p>
              </div>
              <span>{all_services.length} records</span>
            </div>

            <div className="history-table-scroll">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Certificate</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Extinguishers</th>
                    <th>Revenue</th>
                    <th>Link</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {all_services.map((service: Service, idx: number) => {
                    const status = getStatusBadge(service);
                    const typeBadge = getTypeBadge(idx, all_services.length);
                    const isLatest = idx === all_services.length - 1;
                    const isOldest = idx === 0;
                    const prevService = idx > 0 ? all_services[idx - 1] : null;
                    const nextService = !isLatest ? all_services[idx + 1] : null;

                    return (
                      <tr key={service.id} className={isLatest ? 'history-row-latest' : ''}>
                        <td>
                          <span className="history-service-number">#{idx + 1}</span>
                          <span className="history-service-type" style={{ background: typeBadge.bg, color: typeBadge.color }}>{typeBadge.text}</span>
                        </td>
                        <td>
                          <div className="history-cert-cell">
                            <strong>{service.certificate_no}</strong>
                            <small>{service.customer_name}</small>
                          </div>
                        </td>
                        <td>
                          <div className="history-date-stack">
                            <span>Issued: <b>{formatDate(service.service_date)}</b></span>
                            <span>Expiry: <b>{formatDate(service.expiry_date)}</b></span>
                          </div>
                        </td>
                        <td>
                          <span className="history-status-pill" style={{ background: status.bg, color: status.color }}>{status.text}</span>
                        </td>
                        <td>
                          <div className="history-ext-stack">
                            <b>{service.ext_count} type(s), {service.total_qty} total</b>
                            <div className="history-ext-chips">
                              {(service.extinguisher_details || []).map((ext: any) => (
                                <span key={ext.id}>{ext.ext_type} {ext.ext_capacity} x {ext.ext_qty}</span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="history-revenue">₹{service.service_revenue.toLocaleString()}</td>
                        <td>
                          <div className="history-flow-cell">
                            {isOldest && <span className="history-flow-chip start">First service</span>}
                            {prevService && <span className="history-flow-chip">From {prevService.certificate_no}</span>}
                            {nextService && <span className="history-flow-chip next">Renewed to {nextService.certificate_no}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="history-actions">
                            <a href={`/customers/${service.id}/certificate`} target="_blank" className="action-btn btn-view-print">Certificate</a>
                            {isLatest && needsRenewal && <a href={`/customers/${service.id}/renew`} className="action-btn btn-renew-action">Renew</a>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

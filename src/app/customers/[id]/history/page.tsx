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
  const needsRenewal = latestDays <= 30;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <div className="custlist-container">
          <div className="header-panel">
            <div>
              <h2>📜 RENEWAL TIMELINE</h2>
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

          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">🔄 Service History Timeline</h3>

            <div style={{ position: 'relative', paddingLeft: 30 }}>
              <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }}></div>

              {all_services.map((service: Service, idx: number) => {
                const status = getStatusBadge(service);
                const typeBadge = getTypeBadge(idx, all_services.length);
                const isLatest = idx === all_services.length - 1;
                const isOldest = idx === 0;
                const prevService = idx > 0 ? all_services[idx - 1] : null;

                return (
                  <div key={service.id} style={{ position: 'relative', marginBottom: 30, paddingLeft: 25 }}>
                    <div style={{
                      position: 'absolute', left: -22, top: 0, width: 20, height: 20,
                      borderRadius: '50%', background: isLatest ? '#dc2626' : '#3b82f6',
                      border: '3px solid white', boxShadow: '0 0 0 2px ' + (isLatest ? '#dc2626' : '#3b82f6')
                    }}></div>

                    <div className="bg-gray-50 rounded-lg p-4 border-l-4" style={{ borderLeftColor: isLatest ? '#dc2626' : '#3b82f6' }}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 text-lg">📄 {service.certificate_no}</h4>
                            <span style={{
                              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                              background: typeBadge.bg, color: typeBadge.color
                            }}>
                              {typeBadge.text}
                            </span>
                            <span style={{
                              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                              background: status.bg, color: status.color
                            }}>
                              {status.text}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Service Date: <b>{formatDate(service.service_date)}</b> • Expires: <b>{formatDate(service.expiry_date)}</b>
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <a
                            href={`/customers/${service.id}/certificate`}
                            target="_blank"
                            className="action-btn btn-view-print"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            👁️ View Certificate
                          </a>
                          {isLatest && needsRenewal && (
                            <a
                              href={`/customers/${service.id}/renew`}
                              style={{
                                background: '#dc2626', color: 'white', fontSize: 12, padding: '4px 10px',
                                borderRadius: 6, fontWeight: 600, textDecoration: 'none'
                              }}
                            >
                              🔄 Renew
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p style={{ color: status.color, fontWeight: 600 }}>{status.text}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Extinguishers</p>
                          <p className="font-semibold">{service.ext_count} items ({service.total_qty} total)</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Service Revenue</p>
                          <p className="font-semibold">₹{service.service_revenue.toLocaleString()}</p>
                        </div>
                      </div>

                      {service.extinguisher_details && service.extinguisher_details.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Extinguisher Details:</p>
                          <div className="flex flex-wrap gap-2">
                            {service.extinguisher_details.map((ext: any) => (
                              <span key={ext.id} className="inline-block bg-white border border-gray-200 rounded px-2 py-1 text-xs">
                                {ext.ext_type} {ext.ext_capacity} × {ext.ext_qty}
                                {parseFloat(ext.ext_refilling_price) > 0 && <span style={{ color: '#15803d' }}> (₹{ext.ext_refilling_price})</span>}
                                {parseFloat(ext.ext_new_price) > 0 && <span style={{ color: '#3b82f6' }}> (₹{ext.ext_new_price})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {isOldest && (
                        <div className="mt-3 text-xs text-green-600 font-semibold">
                          ⭐ First service — Customer started here
                        </div>
                      )}

                      {!isOldest && prevService && (
                        <div className="mt-3 text-xs flex items-center gap-2 flex-wrap">
                          <span className="text-gray-500 italic">↑ Renewed from</span>
                          <a
                            href={`/customers/${prevService.id}/history`}
                            style={{
                              background: '#eff6ff', color: '#1e40af', padding: '2px 8px',
                              borderRadius: 4, fontWeight: 600, textDecoration: 'none', fontFamily: 'monospace'
                            }}
                          >
                            {prevService.certificate_no}
                          </a>
                          <span className="text-gray-400">on {formatDate(service.service_date)}</span>
                        </div>
                      )}

                      {!isLatest && (
                        <div className="mt-2 text-xs flex items-center gap-2 flex-wrap">
                          <span className="text-gray-500 italic">↓ Superseded by</span>
                          <a
                            href={`/customers/${all_services[idx + 1].id}/history`}
                            style={{
                              background: '#f0fdf4', color: '#15803d', padding: '2px 8px',
                              borderRadius: 4, fontWeight: 600, textDecoration: 'none', fontFamily: 'monospace'
                            }}
                          >
                            {all_services[idx + 1].certificate_no}
                          </a>
                          <span className="text-gray-400">on {formatDate(all_services[idx + 1].service_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

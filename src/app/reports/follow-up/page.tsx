'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { formatDate, getWhatsAppRenewalLink } from '@/lib/utils';

interface FollowUpCustomer {
  id: number;
  certificate_no: string;
  customer_name: string;
  mobile: string;
  address: string;
  service_date: string;
  expiry_date: string;
  total_qty: number;
  days_left: number;
}

const CONTACTED_KEY = 'followup-contacted-v1';

function loadContactedSet(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(CONTACTED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const today = new Date().toDateString();
    if (parsed._day !== today) return new Set();
    return new Set(parsed.ids || []);
  } catch {
    return new Set();
  }
}

function saveContactedSet(set: Set<number>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    CONTACTED_KEY,
    JSON.stringify({ _day: new Date().toDateString(), ids: [...set] })
  );
}
export default function FollowUpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<FollowUpCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacted, setContacted] = useState<Set<number>>(new Set());
  const [showContacted, setShowContacted] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    setContacted(loadContactedSet());
  }, []);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/follow-up');
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.customers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleContacted = useCallback((id: number) => {
    setContacted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveContactedSet(next);
      return next;
    });
  }, []);

  if (status === 'loading' || !session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  const expired = customers.filter((c) => c.days_left < 0);
  const dueToday = customers.filter((c) => c.days_left === 0);
  const dueSoon = customers.filter((c) => c.days_left > 0 && c.days_left <= 30);

  const pendingCustomers = showContacted
    ? customers
    : customers.filter((c) => !contacted.has(c.id));

  const contactedCustomers = customers.filter((c) => contacted.has(c.id));

  const getUrgency = (c: FollowUpCustomer) => {
    if (c.days_left < 0) return { label: `+${Math.abs(c.days_left)}d`, className: 'urgency-expired' };
    if (c.days_left === 0) return { label: 'Today', className: 'urgency-today' };
    return { label: `${c.days_left}d`, className: 'urgency-due' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div className="main-content">
        <div className="followup-container">
          <div className="followup-page-header">
            <div>
              <h2>Daily Renewal Follow-up</h2>
              <p>Track and contact customers who need renewal today</p>
            </div>
            <div className="followup-actions-bar">
              <button onClick={fetchData} className="followup-nav-btn">
                Refresh
              </button>
              <a href="/customers" className="followup-nav-btn followup-nav-secondary">
                Customer List
              </a>
            </div>
          </div>

          <div className="followup-stats-grid">
            <div className="followup-stat expired">
              <span>Expired</span>
              <strong>{expired.length}</strong>
              <small>Past expiry date</small>
            </div>
            <div className="followup-stat today">
              <span>Due Today</span>
              <strong>{dueToday.length}</strong>
              <small>Expires today</small>
            </div>
            <div className="followup-stat due">
              <span>Due in 30 Days</span>
              <strong>{dueSoon.length}</strong>
              <small>Need attention</small>
            </div>
            <div className="followup-stat contacted">
              <span>Contacted Today</span>
              <strong>{contactedCustomers.length}</strong>
              <small>{contactedCustomers.length > 0 ? `${Math.round((contactedCustomers.length / (customers.length || 1)) * 100)}% done` : 'Start calling'}</small>
            </div>
          </div>

          {loading ? (
            <div className="followup-loading">Loading follow-up list...</div>
          ) : (
            <>
              <div className="followup-toolbar">
                <div className="followup-toolbar-left">
                  <span className="followup-count">
                    {showContacted
                      ? `${customers.length} total customers`
                      : `${pendingCustomers.length} pending / ${customers.length} total`}
                  </span>
                  {contactedCustomers.length > 0 && (
                    <button
                      onClick={() => setShowContacted(!showContacted)}
                      className="followup-toggle-btn"
                    >
                      {showContacted ? 'Hide contacted' : 'Show contacted'}
                    </button>
                  )}
                  {!showContacted && contactedCustomers.length > 0 && (
                    <span className="followup-contacted-count">
                      {contactedCustomers.length} contacted hidden
                    </span>
                  )}
                </div>
              </div>

              {pendingCustomers.length === 0 && !showContacted ? (
                <div className="followup-all-done">
                  <strong>All done for today!</strong>
                  <p>All {customers.length} customers have been contacted. Check back tomorrow.</p>
                  {contactedCustomers.length > 0 && (
                    <button onClick={() => setShowContacted(true)} className="followup-toggle-btn">
                      Show contacted list
                    </button>
                  )}
                </div>
              ) : (
                <div className="followup-table-card">
                  <div className="followup-table-scroll">
                    <table className="followup-table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>Urgency</th>
                          <th>Customer</th>
                          <th>Certificate</th>
                          <th>Expiry</th>
                          <th>Contact</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showContacted ? customers : pendingCustomers).map((c) => {
                          const urgency = getUrgency(c);
                          const isContacted = contacted.has(c.id);

                          return (
                            <tr key={c.id} className={isContacted ? 'followup-row-contacted' : ''}>
                              <td>
                                <span className={`followup-urgency-badge ${urgency.className}`}>
                                  {urgency.label}
                                </span>
                              </td>
                              <td>
                                <div className="followup-customer-name">{c.customer_name}</div>
                                <div className="followup-customer-address">{c.address || 'No address'}</div>
                              </td>
                              <td>
                                <span className="followup-cert">{c.certificate_no}</span>
                              </td>
                              <td>
                                <div className="followup-expiry-date">
                                  {new Date(c.expiry_date).toLocaleDateString('en-GB')}
                                </div>
                              </td>
                              <td>
                                <div className="followup-contact-stack">
                                  <a href={`tel:${c.mobile}`} className="followup-phone-link">
                                    {c.mobile}
                                  </a>
                                </div>
                              </td>
                              <td>
                                <div className="followup-row-actions">
                                  <a
                                    href={`tel:${c.mobile}`}
                                    className="followup-action-btn followup-call-btn"
                                    title="Call"
                                  >
                                    Call
                                  </a>
                                  <a
                                    href={getWhatsAppRenewalLink({ customer_name: c.customer_name, certificate_no: c.certificate_no, mobile: c.mobile, expiry_date: c.expiry_date, days_left: c.days_left })}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="followup-action-btn followup-wa-btn"
                                    title="WhatsApp"
                                  >
                                    WhatsApp
                                  </a>
                                  <a
                                    href={`/customers/${c.id}/renew`}
                                    className="followup-action-btn followup-renew-btn"
                                    title="Renew"
                                  >
                                    Renew
                                  </a>
                                  <button
                                    onClick={() => toggleContacted(c.id)}
                                    className={`followup-action-btn followup-contact-btn ${isContacted ? 'contacted' : ''}`}
                                    title={isContacted ? 'Undo' : 'Mark contacted'}
                                  >
                                    {isContacted ? 'Undo' : 'Done'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

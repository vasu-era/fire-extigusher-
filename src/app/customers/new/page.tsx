'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { calculateExpiryDate, generateId } from '@/lib/utils';
import { ExtinguisherFormRow, CAPACITY_OPTIONS } from '@/types';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';

function createEmptyRow(): ExtinguisherFormRow {
  return { id: generateId(), ext_type: '', ext_capacity: '', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 0, ext_new_price: 0 };
}

export default function NewCustomerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useFormKeyboard();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '', mobile: '', address: '', certificate_no: '',
    service_date: new Date().toISOString().split('T')[0], expiry_duration: 12, expiry_date: '', total_qty: 1,
  });
  const [extinguishers, setExtinguishers] = useState<ExtinguisherFormRow[]>([createEmptyRow()]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (formData.service_date) fetchCertNo();
  }, [formData.service_date]);

  useEffect(() => {
    if (formData.service_date && formData.expiry_duration) {
      setFormData(prev => ({ ...prev, expiry_date: calculateExpiryDate(formData.service_date, formData.expiry_duration) }));
    }
  }, [formData.service_date, formData.expiry_duration]);

  const fetchCertNo = async () => {
    try {
      const res = await fetch(`/api/next-certificate?service_date=${formData.service_date}`);
      if (res.ok) { const d = await res.json(); setFormData(prev => ({ ...prev, certificate_no: d.certificate_no })); }
    } catch (e) { console.error(e); }
  };

  const updateExt = (i: number, field: keyof ExtinguisherFormRow, val: any) => {
    const u = [...extinguishers]; u[i] = { ...u[i], [field]: val }; setExtinguishers(u);
    setFormData(prev => ({ ...prev, total_qty: u.reduce((s, e) => s + e.ext_qty, 0) }));
  };

  const removeExt = (i: number) => {
    if (extinguishers.length > 1) {
      const u = extinguishers.filter((_, idx) => idx !== i); setExtinguishers(u);
      setFormData(prev => ({ ...prev, total_qty: u.reduce((s, e) => s + e.ext_qty, 0) }));
    }
  };

  const [gstin, setGstin] = useState('');
  const [loadingGst, setLoadingGst] = useState(false);
  const [gstFeedback, setGstFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleGstLookup = async (gstToSearch?: string) => {
    const target = (gstToSearch || gstin).trim().toUpperCase();
    if (!target) return;
    if (target.length !== 15) {
      setGstFeedback({ type: 'error', message: 'GST number must be 15 characters long' });
      return;
    }
    setLoadingGst(true);
    setGstFeedback({ type: 'info', message: '🔍 Searching GST details...' });
    try {
      const res = await fetch(`/api/gst-lookup?gstin=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data.found) {
        setFormData(prev => ({
          ...prev,
          customer_name: data.customer_name || prev.customer_name,
          mobile: data.mobile || prev.mobile,
          address: data.address || prev.address,
        }));
        setGstFeedback({
          type: 'success',
          message: data.source === 'database'
            ? '✅ Existing customer found! Name, Mobile & Address auto-filled.'
            : '✅ GST details found! Name & Address auto-filled. Please check Mobile Number.'
        });
      } else {
        setGstFeedback({
          type: 'info',
          message: data.message || 'GST number verified. Please fill details once to save.'
        });
      }
    } catch (err) {
      console.error(err);
      setGstFeedback({ type: 'error', message: 'Failed to look up GST number' });
    } finally {
      setLoadingGst(false);
    }
  };

  const handleGstChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^0-9A-Z]/g, '');
    setGstin(upper);
    if (upper.length === 15) {
      handleGstLookup(upper);
    } else {
      setGstFeedback(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      // calculateExpiryDate returns "DD-MM-YYYY" — convert to "YYYY-MM-DD" for Supabase
      const expiryParts = formData.expiry_date.split('-');
      const expiryFormatted = `${expiryParts[2]}-${expiryParts[1]}-${expiryParts[0]}`;
      const res = await fetch('/api/customers/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, gst_number: gstin, expiry_date: expiryFormatted, extinguishers }),
      });
      if (res.ok) { const d = await res.json(); router.push(`/customers/${d.customer.id}/certificate`); }
      else { const err = await res.json(); alert(`Error: ${err.error || 'Failed to create customer'}`); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (status === 'loading' || !session) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="logo-title">
          <h1>RAKESH GAS SUPPLIERS</h1>
          <p>Fire Extinguisher Service Management System</p>
        </div>

        <form id="customerForm" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0, fontWeight: 700, color: '#166534', fontSize: '14px' }}>
                  🏢 GST Number <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#15803d' }}>(Enter 15-digit GST to auto-fill Name, Address & Mobile)</span>
                </label>
                {loadingGst && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>⏳ Searching...</span>}
              </div>
              <input
                type="text"
                value={gstin}
                onChange={e => handleGstChange(e.target.value)}
                placeholder="e.g. 24AAAAA0000A1Z5"
                maxLength={15}
                style={{
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  width: '100%',
                  background: '#ffffff'
                }}
              />
              {gstFeedback && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: gstFeedback.type === 'success' ? '#15803d' : gstFeedback.type === 'error' ? '#b91c1c' : '#1d4ed8'
                }}>
                  {gstFeedback.message}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Customer Name <span className="required">*</span></label>
              <input type="text" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Mobile Number <span className="required">*</span></label>
              <input type="tel" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="Enter 10 Digit no." pattern="[0-9]{10}" maxLength={10} required />
            </div>
            <div className="form-group full-width">
              <label>Address <span className="required">*</span></label>
              <textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Certificate Number <span className="required">*</span> <span style={{ fontSize: '0.8em', color: '#6b7280', fontWeight: 'normal' }}>(Auto / Manual)</span></label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.certificate_no}
                  onChange={e => setFormData({ ...formData, certificate_no: e.target.value })}
                  required
                  placeholder="e.g. RGS/26-27/1"
                  style={{ fontWeight: 'bold', color: '#1f2937', flex: 1 }}
                />
                <button
                  type="button"
                  onClick={fetchCertNo}
                  title="Auto Generate Next Certificate Number"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  🔄 Auto
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Issue Date <span className="required">*</span></label>
              <input type="date" value={formData.service_date} onChange={e => setFormData({ ...formData, service_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Validity Duration <span className="required">*</span></label>
              <select value={formData.expiry_duration} onChange={e => setFormData({ ...formData, expiry_duration: parseInt(e.target.value) })}>
                <option value="12">1 Year (Standard)</option>
                <option value="6">6 Months</option>
                <option value="24">2 Years</option>
                <option value="36">3 Years</option>
                <option value="60">5 Years</option>
              </select>
            </div>
            <div className="form-group">
              <label>Expiry Date <span className="required">*</span></label>
              <input type="text" value={formData.expiry_date} readOnly required placeholder="DD-MM-YYYY" />
            </div>

            <div className="form-group full-width">
              <h3>Extinguisher Details <span className="required">*</span></h3>
              <table id="extinguisherTable">
                <thead>
                  <tr><th>Type</th><th>Capacity</th><th>Qty</th><th>Service Type</th><th>Amount</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {extinguishers.map((row, i) => {
                    const caps = CAPACITY_OPTIONS.find(o => o.type === row.ext_type)?.capacities || [];
                    return (
                      <tr key={row.id}>
                        <td>
                          <select value={row.ext_type} onChange={e => updateExt(i, 'ext_type', e.target.value)} required>
                            <option value="">Select Type</option>
                            <option value="ABC">ABC Powder</option><option value="CO2">CO2</option>
                            <option value="Water">Water</option><option value="Foam">Foam</option>
                          </select>
                        </td>
                        <td>
                          <select value={row.ext_capacity} onChange={e => updateExt(i, 'ext_capacity', e.target.value)} required>
                            <option value="">Select Capacity</option>
                            {caps.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td><input type="number" value={row.ext_qty} min={1} onChange={e => updateExt(i, 'ext_qty', parseInt(e.target.value) || 1)} required /></td>
                        <td>
                          <select value={row.service_action_type} onChange={e => updateExt(i, 'service_action_type', e.target.value)}>
                            <option value="refilling">Refilling Only</option><option value="new">New Bottle/Sale</option>
                          </select>
                        </td>
                        <td>
                          {row.service_action_type === 'refilling' ? (
                            <input type="number" className="ref-input" placeholder="Refill Rate" value={row.ext_refilling_price || ''} min={0} step={0.01} onChange={e => updateExt(i, 'ext_refilling_price', parseFloat(e.target.value) || 0)} />
                          ) : (
                            <input type="number" className="new-input" placeholder="New Bottle Rate" value={row.ext_new_price || ''} min={0} step={0.01} onChange={e => updateExt(i, 'ext_new_price', parseFloat(e.target.value) || 0)} />
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" className="remove-btn" onClick={() => removeExt(i)} disabled={extinguishers.length <= 1} style={extinguishers.length <= 1 ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button type="button" className="add-btn" onClick={() => setExtinguishers([...extinguishers, createEmptyRow()])}>+ Add Extinguisher</button>
            </div>

            <div className="form-group">
              <label>Total Qty. <span className="required">*</span></label>
              <input type="text" value={formData.total_qty} readOnly required />
            </div>
          </div>

          <button type="submit" className="save-btn" disabled={loading}>{loading ? 'SAVING...' : 'SAVE CUSTOMER'}</button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { calculateExpiryDate, generateId } from '@/lib/utils';
import { ExtinguisherFormRow, ExtinguisherDetail, CAPACITY_OPTIONS } from '@/types';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';

export default function EditCustomerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  useFormKeyboard();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({ customer_name: '', mobile: '', address: '', certificate_no: '', service_date: '', expiry_duration: 12, expiry_date: '', total_qty: 1 });
  const [extinguishers, setExtinguishers] = useState<ExtinguisherFormRow[]>([]);

  const [gstin, setGstin] = useState('');
  const [loadingGst, setLoadingGst] = useState(false);
  const [gstFeedback, setGstFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);
  useEffect(() => { if (session) fetchCustomer(); }, [id, session]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const d = await res.json();
        const rawAddr = d.customer.address || '';
        const matchGst = rawAddr.match(/GSTIN:\s*([0-9A-Z]{15})/i) || rawAddr.match(/GST:\s*([0-9A-Z]{15})/i);
        const cleanAddr = rawAddr
          .replace(/GSTIN:\s*[0-9A-Z]{15}/gi, '')
          .replace(/GST:\s*[0-9A-Z]{15}/gi, '')
          .trim();
        if (matchGst) setGstin(matchGst[1].toUpperCase());

        setFormData({ customer_name: d.customer.customer_name, mobile: d.customer.mobile, address: cleanAddr, certificate_no: d.customer.certificate_no, service_date: d.customer.service_date, expiry_duration: 12, expiry_date: d.customer.expiry_date, total_qty: d.customer.total_qty });
        setExtinguishers(d.extinguishers.map((ext: ExtinguisherDetail) => ({ id: String(ext.id), ext_type: ext.ext_type, ext_capacity: ext.ext_capacity, ext_qty: ext.ext_qty, service_action_type: ext.service_action_type, ext_refilling_price: ext.ext_refilling_price, ext_new_price: ext.ext_new_price })));
      }
    } catch (e) { console.error(e); } finally { setFetching(false); }
  };

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

  useEffect(() => { if (formData.service_date && formData.expiry_duration) { setFormData(prev => ({ ...prev, expiry_date: calculateExpiryDate(formData.service_date, formData.expiry_duration) })); } }, [formData.service_date, formData.expiry_duration]);

  const updateExt = (i: number, field: keyof ExtinguisherFormRow, val: any) => { const u = [...extinguishers]; u[i] = { ...u[i], [field]: val }; setExtinguishers(u); setFormData(prev => ({ ...prev, total_qty: u.reduce((s, e) => s + e.ext_qty, 0) })); };
  const removeExt = (i: number) => { if (extinguishers.length > 1) { const u = extinguishers.filter((_, idx) => idx !== i); setExtinguishers(u); setFormData(prev => ({ ...prev, total_qty: u.reduce((s, e) => s + e.ext_qty, 0) })); } };

  const fetchCertNo = async () => {
    if (!formData.service_date) return;
    try {
      const res = await fetch(`/api/next-certificate?service_date=${formData.service_date}`);
      if (res.ok) { const d = await res.json(); setFormData(prev => ({ ...prev, certificate_no: d.certificate_no })); }
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      // expiry_date from calculateExpiryDate() is DD-MM-YYYY; convert to YYYY-MM-DD for DB
      const expParts = formData.expiry_date.split('-');
      const expFormatted = expParts.length === 3
        ? `${expParts[2]}-${expParts[1]}-${expParts[0]}`
        : formData.expiry_date;
      const res = await fetch(`/api/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, gst_number: gstin, expiry_date: expFormatted, extinguishers }) });
      if (res.ok) {
        router.push('/customers');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error: ${errData.error || res.statusText || 'Failed to update customer'}`);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (status === 'loading' || !session || fetching) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="logo-title"><h1>RAKESH GAS SUPPLIERS</h1><p>Fire Extinguisher Service Management System (Edit Mode)</p>
        <div style={{ marginTop: 10 }}>
          <a href={`/customers/${id}/history`} className="add-btn">📜 View Service History</a>
        </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0, fontWeight: 700, color: '#166534', fontSize: '14px' }}>
                  🏢 GST Number <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#15803d' }}>(Enter 15-digit GST to auto-fill Name, Address & Mobile)</span>
                </label>
                {loadingGst && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>⏳ Searching...</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                    flex: 1,
                    background: '#ffffff'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleGstLookup()}
                  disabled={loadingGst || !gstin}
                  style={{
                    padding: '8px 16px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: loadingGst || !gstin ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🔍 Auto-Fill
                </button>
              </div>
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

            <div className="form-group"><label>Customer Name <span className="required">*</span></label><input type="text" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} required /></div>
            <div className="form-group"><label>Mobile Number <span className="required">*</span></label><input type="tel" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} pattern="[0-9]{10}" maxLength={10} required /></div>
            <div className="form-group full-width"><label>Address <span className="required">*</span></label><textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required /></div>
            <div className="form-group">
              <label>Certificate Number <span className="required">*</span> <span style={{ fontSize: '0.8em', color: '#6b7280', fontWeight: 'normal' }}>(Auto / Manual)</span></label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.certificate_no}
                  onChange={e => setFormData({ ...formData, certificate_no: e.target.value })}
                  required
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
            <div className="form-group"><label>Issue Date <span className="required">*</span></label><input type="date" value={formData.service_date} onChange={e => setFormData({ ...formData, service_date: e.target.value })} required /></div>
            <div className="form-group"><label>Validity Duration <span className="required">*</span></label>
              <select value={formData.expiry_duration} onChange={e => setFormData({ ...formData, expiry_duration: parseInt(e.target.value) })}>
                <option value="12">1 Year (Standard)</option><option value="6">6 Months</option><option value="24">2 Years</option><option value="36">3 Years</option><option value="60">5 Years</option>
              </select>
            </div>
            <div className="form-group"><label>Expiry Date <span className="required">*</span></label><input type="text" value={formData.expiry_date} readOnly /></div>

            <div className="form-group full-width">
              <h3>Extinguisher Details <span className="required">*</span></h3>
              <table id="extinguisherTable">
                <thead><tr><th>Type</th><th>Capacity</th><th>Qty</th><th>Service Type</th><th>Amount</th><th>Action</th></tr></thead>
                <tbody>
                  {extinguishers.map((row, i) => {
                    const caps = CAPACITY_OPTIONS.find(o => o.type === row.ext_type)?.capacities || [];
                    return (
                      <tr key={row.id}>
                        <td><select value={row.ext_type} onChange={e => updateExt(i, 'ext_type', e.target.value)} required><option value="">Select</option><option value="ABC">ABC Powder</option><option value="CO2">CO2</option><option value="Water">Water</option><option value="Foam">Foam</option></select></td>
                        <td><select value={row.ext_capacity} onChange={e => updateExt(i, 'ext_capacity', e.target.value)} required><option value="">Select</option>{caps.map(c => <option key={c} value={c}>{c}</option>)}</select></td>
                        <td><input type="number" value={row.ext_qty} min={1} onChange={e => updateExt(i, 'ext_qty', parseInt(e.target.value) || 1)} required /></td>
                        <td><select value={row.service_action_type} onChange={e => updateExt(i, 'service_action_type', e.target.value)}><option value="refilling">Refilling Only</option><option value="new">New Bottle/Sale</option></select></td>
                        <td>{row.service_action_type === 'refilling' ? <input type="number" placeholder="Refill Rate" value={row.ext_refilling_price || ''} min={0} step={0.01} onChange={e => updateExt(i, 'ext_refilling_price', parseFloat(e.target.value) || 0)} /> : <input type="number" placeholder="New Rate" value={row.ext_new_price || ''} min={0} step={0.01} onChange={e => updateExt(i, 'ext_new_price', parseFloat(e.target.value) || 0)} />}</td>
                        <td style={{ textAlign: 'center' }}><button type="button" className="remove-btn" onClick={() => removeExt(i)} disabled={extinguishers.length <= 1}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button type="button" className="add-btn" onClick={() => setExtinguishers([...extinguishers, { id: generateId(), ext_type: '', ext_capacity: '', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 0, ext_new_price: 0 }])}>+ Add Extinguisher</button>
            </div>
            <div className="form-group"><label>Total Qty. <span className="required">*</span></label><input type="text" value={formData.total_qty} readOnly required /></div>
          </div>
          <button type="submit" className="save-btn" disabled={loading}>{loading ? 'UPDATING...' : 'UPDATE CUSTOMER DETAILS'}</button>
        </form>
      </div>
    </div>
  );
}

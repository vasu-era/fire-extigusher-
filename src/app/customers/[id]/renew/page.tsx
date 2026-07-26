'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { calculateExpiryDate, generateId } from '@/lib/utils';
import { ExtinguisherFormRow, ExtinguisherDetail, CAPACITY_OPTIONS } from '@/types';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';

export default function RenewCustomerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  useFormKeyboard();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [oldCertNo, setOldCertNo] = useState('');
  const [formData, setFormData] = useState({ customer_name: '', mobile: '', address: '', certificate_no: '', service_date: new Date().toISOString().split('T')[0], expiry_duration: 12, expiry_date: '', total_qty: 1 });
  const [extinguishers, setExtinguishers] = useState<ExtinguisherFormRow[]>([]);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);
  useEffect(() => { if (session) fetchOld(); }, [id, session]);

  const fetchOld = async () => {
    try {
      const res = await fetch(`/api/customers/${id}/renew`);
      if (res.ok) {
        const d = await res.json();
        setOldCertNo(d.oldCustomer.certificate_no);
        const todayStr = new Date().toISOString().split('T')[0];
        setFormData({ customer_name: d.oldCustomer.customer_name, mobile: d.oldCustomer.mobile, address: d.oldCustomer.address || '', certificate_no: d.newCertificateNo, service_date: todayStr, expiry_duration: 12, expiry_date: calculateExpiryDate(todayStr, 12), total_qty: d.oldCustomer.total_qty });
        setExtinguishers(d.oldExtinguishers.map((ext: ExtinguisherDetail) => ({ id: String(ext.id), ext_type: ext.ext_type, ext_capacity: ext.ext_capacity, ext_qty: ext.ext_qty, service_action_type: ext.service_action_type, ext_refilling_price: ext.ext_refilling_price, ext_new_price: ext.ext_new_price })));
      }
    } catch (e) { console.error(e); } finally { setFetching(false); }
  };

  useEffect(() => { if (formData.service_date && formData.expiry_duration) { setFormData(prev => ({ ...prev, expiry_date: calculateExpiryDate(formData.service_date, formData.expiry_duration) })); } }, [formData.service_date, formData.expiry_duration]);

  const updateExt = (i: number, field: keyof ExtinguisherFormRow, val: any) => { const u = [...extinguishers]; u[i] = { ...u[i], [field]: val }; setExtinguishers(u); setFormData(prev => ({ ...prev, total_qty: u.reduce((s, e) => s + e.ext_qty, 0) })); };
  const removeExt = (i: number) => { if (extinguishers.length > 1) { const u = extinguishers.filter((_, idx) => idx !== i); setExtinguishers(u); setFormData(prev => ({ ...prev, total_qty: u.reduce((s, e) => s + e.ext_qty, 0) })); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const expParts = formData.expiry_date.split('/');
      const expFormatted = `${expParts[2]}-${expParts[0]}-${expParts[1]}`;
      const res = await fetch(`/api/customers/${id}/renew`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, expiry_date: expFormatted, extinguishers, old_certificate_no: oldCertNo }) });
      if (res.ok) { const d = await res.json(); router.push(`/customers/${d.customer.id}/certificate`); } else alert('Error');
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (status === 'loading' || !session || fetching) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="logo-title"><h1>RAKESH GAS SUPPLIERS</h1><p>Fire Extinguisher Service Management System (New Renewal Mode)</p><p style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 14 }}>✅ Last year&apos;s data is fully safe in history.</p></div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label>Customer Name <span className="required">*</span></label><input type="text" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} required /></div>
            <div className="form-group"><label>Mobile Number <span className="required">*</span></label><input type="tel" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} pattern="[0-9]{10}" maxLength={10} required /></div>
            <div className="form-group full-width"><label>Address <span className="required">*</span></label><textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required /></div>
            <div className="form-group"><label>New Certificate Number <span className="required">*</span></label><input type="text" value={formData.certificate_no} readOnly required style={{ backgroundColor: '#f1f3f5', fontWeight: 'bold' }} /></div>
            <div className="form-group"><label>New Issue Date <span className="required">*</span></label><input type="date" value={formData.service_date} onChange={e => setFormData({ ...formData, service_date: e.target.value })} required /></div>
            <div className="form-group"><label>Validity Duration <span className="required">*</span></label>
              <select value={formData.expiry_duration} onChange={e => setFormData({ ...formData, expiry_duration: parseInt(e.target.value) })}>
                <option value="12">1 Year (Standard)</option><option value="6">6 Months</option><option value="24">2 Years</option><option value="36">3 Years</option><option value="60">5 Years</option>
              </select>
            </div>
            <div className="form-group"><label>New Expiry Date <span className="required">*</span></label><input type="text" value={formData.expiry_date} readOnly required /></div>

            <div className="form-group full-width">
              <h3>Extinguisher Details (Carried Forward) <span className="required">*</span></h3>
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
          <button type="submit" className="save-btn" disabled={loading}>{loading ? 'PROCESSING...' : '🚀 GENERATE RENEWED CERTIFICATE'}</button>
        </form>
      </div>
    </div>
  );
}

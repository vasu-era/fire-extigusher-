'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCert(); }, [id]);

  const fetchCert = async () => {
    try {
      const res = await fetch(`/api/certificate/${id}`);
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading certificate...</div>;
  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>Certificate not found</div>;

  const { customer, extinguishers, qrCodeUrl } = data;

  return (
    <div className="certificate-page">
      <div className="certificate">
        <img src="/water.jpg" className="watermark" />

        <div className="cert-header">
          <div className="logo-area"><img src="/logo.png" className="logo" /></div>
          <div className="cert-company">
            <h1>RAKESH GAS SUPPLIERS</h1>
            <p>Opp. Reliance Petrol Pump,<br />Rajkot Road, Dolatpara,<br />Junagadh - 362001</p>
            <p>Mobile : 93775 48793 | GST : 24AFVPA4036L1ZB</p>
          </div>
          <div className="qr">{qrCodeUrl && <img src={qrCodeUrl} />}</div>
        </div>

        <div className="cert-title">FIRE EXTINGUISHER CERTIFICATE</div>

        <div className="remarks">
          <h3>Service Remarks</h3>
          <p>All Fire Extinguishers have been inspected, serviced, refilled and tested as per Fire Safety Standards.</p>
        </div>

        <table className="cert-info">
          <tbody>
            <tr>
              <td style={{ width: '20%' }}><b>Certificate No</b></td>
              <td style={{ width: '30%' }}>{customer.certificate_no}</td>
              <td style={{ width: '20%' }}><b>Issue Date</b></td>
              <td style={{ width: '30%' }}>{new Date(customer.service_date).toLocaleDateString('en-GB')}</td>
            </tr>
            <tr>
              <td><b>Customer Name</b></td>
              <td>{customer.customer_name}</td>
              <td><b>Expiry Date</b></td>
              <td>{new Date(customer.expiry_date).toLocaleDateString('en-GB')}</td>
            </tr>
            <tr>
              <td><b>Mobile</b></td>
              <td colSpan={3}>{customer.mobile}</td>
            </tr>
            <tr>
              <td><b>Address</b></td>
              <td colSpan={3}>{customer.address}</td>
            </tr>
          </tbody>
        </table>

        <table className="cert-details">
          <thead><tr><th style={{ width: '50%' }}>Type</th><th style={{ width: '25%' }}>Capacity</th><th style={{ width: '25%' }}>Qty</th></tr></thead>
          <tbody>
            {extinguishers.map((ext: any) => (
              <tr key={ext.id}>
                <td>{ext.ext_type}</td><td>{ext.ext_capacity}</td><td>{ext.ext_qty} Nos</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-box">TOTAL QUANTITY : {customer.total_qty} Nos</div>

        <div className="cert-footer">
          <div className="signature"><img src="/sign.png" /><b>Authorized Signature</b></div>
        </div>

        <div className="cert-bottom"><b>THANK YOU FOR CHOOSING RAKESH GAS SUPPLIERS</b></div>
      </div>

      <div className="no-print no-print-btn" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: '#64748b', color: 'white', border: 'none', padding: '12px 30px', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={() => router.push('/customers')}
          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 30px', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}
        >
          👥 Customer List
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: '#0D47A1', color: 'white', border: 'none', padding: '12px 30px', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}
        >
          🖨️ Print Certificate
        </button>
      </div>
    </div>
  );
}

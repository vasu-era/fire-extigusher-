'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

type Customer = {
  certificate_no: string;
  customer_name: string;
  mobile: string;
  address?: string | null;
  service_date: string;
  expiry_date: string;
  total_qty: number;
};

type Extinguisher = {
  id: number;
  ext_type: string;
  ext_capacity: string;
  ext_qty: number;
};

type CertificateData = {
  customer: Customer;
  extinguishers: Extinguisher[];
  qrCodeUrl: string;
};

export default function PublicCertificatePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const fetchCert = useCallback(async () => {
    try {
      const res = await fetch(`/api/c/${token}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setInvalid(true);
      }
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCert(); }, [fetchCert]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      Loading certificate...
    </div>
  );

  if (invalid || !data) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', gap: 16 }}>
      <div style={{ fontSize: 64 }}>🔒</div>
      <h2 style={{ color: '#ef4444', margin: 0 }}>Invalid or Expired Link</h2>
      <p style={{ color: '#64748b', textAlign: 'center', maxWidth: 300 }}>
        This certificate link is not valid. Please contact Rakesh Gas Suppliers for a new link.
      </p>
    </div>
  );

  const { customer, extinguishers, qrCodeUrl } = data;

  return (
    <div className="certificate-page">
      {/* Print button — only shown on screen */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#0D47A1', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 'bold' }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="certificate">
        <img src="/water.jpg" className="watermark" alt="" />

        <div className="cert-header">
          <div className="logo-area"><img src="/logo.png" className="logo" alt="Rakesh Gas Suppliers" /></div>
          <div className="cert-company">
            <h1>RAKESH GAS SUPPLIERS</h1>
            <p>Opp. Reliance Petrol Pump,<br />Rajkot Road, Dolatpara,<br />Junagadh - 362001</p>
            <p>Mobile : 93775 48793 | GST : 24AFVPA4036L1ZB</p>
          </div>
          <div className="qr">{qrCodeUrl && <img src={qrCodeUrl} alt="Certificate QR code" />}</div>
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
              <td style={{ width: '30%' }}>{customer.service_date ? (customer.service_date.includes('-') ? customer.service_date.split('T')[0].split('-').reverse().join('/') : customer.service_date) : ''}</td>
            </tr>
            <tr>
              <td><b>Customer Name</b></td>
              <td>{customer.customer_name}</td>
              <td><b>Expiry Date</b></td>
              <td>{customer.expiry_date ? (customer.expiry_date.includes('-') ? customer.expiry_date.split('T')[0].split('-').reverse().join('/') : customer.expiry_date) : ''}</td>
            </tr>
            <tr>
              <td><b>Mobile</b></td>
              <td colSpan={3}>{customer.mobile}</td>
            </tr>
            <tr>
              <td><b>Address</b></td>
              <td colSpan={3}>{customer.address || '-'}</td>
            </tr>
          </tbody>
        </table>

        <table className="cert-details">
          <thead>
            <tr>
              <th style={{ width: '50%', textAlign: 'left', paddingLeft: '16px' }}>Type</th>
              <th style={{ width: '25%', textAlign: 'center' }}>Capacity</th>
              <th style={{ width: '25%', textAlign: 'center' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {extinguishers.map((ext: Extinguisher) => (
              <tr key={ext.id}>
                <td style={{ textAlign: 'left', paddingLeft: '16px' }}>{ext.ext_type}</td>
                <td style={{ textAlign: 'center' }}>{ext.ext_capacity}</td>
                <td style={{ textAlign: 'center' }}>{ext.ext_qty} Nos</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-box">TOTAL QUANTITY : {customer.total_qty} Nos</div>

        <div className="cert-footer">
          <div className="signature"><img src="/sign.png" alt="Authorized signature" /><b>Authorized Signature</b></div>
        </div>

        <div className="cert-bottom"><b>THANK YOU FOR CHOOSING RAKESH GAS SUPPLIERS</b></div>
      </div>
    </div>
  );
}

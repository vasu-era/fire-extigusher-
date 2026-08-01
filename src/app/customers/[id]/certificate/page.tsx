'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

type StickerPrintRow = {
  id: number;
  type: string;
  capacity: string;
  quantity: number;
  refillDate: string;
  expiryDate: string;
  certificateNo: string;
  customerName: string;
};

const PRINT_SERVICE_URL = (
  process.env.NEXT_PUBLIC_PRINT_SERVICE_URL || 'http://localhost:10000'
).replace(/\/$/, '');

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isPrinting, setIsPrinting] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [stickerQuantities, setStickerQuantities] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCert = useCallback(async () => {
    try {
      const res = await fetch(`/api/certificate/${id}`);
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [id]);

  // Data fetch happens after route params are available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCert(); }, [fetchCert]);

  const handlePrintSticker = () => {
    const extinguishers = data?.extinguishers || [];
    if (extinguishers.length === 0) {
      setToast({ type: 'error', message: 'No extinguisher details found for sticker printing' });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    const initialQuantities = extinguishers.reduce((acc: Record<string, number>, ext: Extinguisher) => {
      acc[String(ext.id)] = Math.max(1, Number(ext.ext_qty) || 1);
      return acc;
    }, {});

    setStickerQuantities(initialQuantities);
    setPrintDialogOpen(true);
  };

  const submitStickerPrint = async () => {
    setIsPrinting(true);
    setToast(null);
    try {
      const customer = data?.customer;
      const extinguishers = data?.extinguishers || [];
      const stickers = extinguishers
        .map((ext: Extinguisher): StickerPrintRow => ({
          id: ext.id,
          type: ext.ext_type,
          capacity: ext.ext_capacity,
          quantity: Math.max(0, Number(stickerQuantities[String(ext.id)]) || 0),
          refillDate: customer?.service_date || new Date().toISOString(),
          expiryDate: customer?.expiry_date || new Date().toISOString(),
          certificateNo: customer?.certificate_no || '',
          customerName: customer?.customer_name || '',
        }))
        .filter((sticker: StickerPrintRow) => sticker.quantity > 0);

      if (stickers.length === 0) {
        setToast({ type: 'error', message: 'Please enter at least one sticker quantity' });
        setIsPrinting(false);
        setTimeout(() => setToast(null), 5000);
        return;
      }

      const firstSticker = stickers[0];
      const payload = {
        certificateId: id,
        certificateNo: customer?.certificate_no,
        customerName: customer?.customer_name,
        type: firstSticker.type,
        capacity: firstSticker.capacity,
        refillDate: customer?.service_date || new Date().toISOString(),
        expiryDate: customer?.expiry_date || new Date().toISOString(),
        quantity: stickers.reduce((total: number, sticker: StickerPrintRow) => total + sticker.quantity, 0),
        stickers,
      };

      const res = await fetch(`${PRINT_SERVICE_URL}/api/certificates/${id}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success !== false) {
        setToast({ type: 'success', message: result.message || 'Sticker Printed Successfully' });
        setPrintDialogOpen(false);
      } else {
        setToast({ type: 'error', message: result.message ? `Printing Failed: ${result.message}` : 'Printing Failed' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setToast({ type: 'error', message: `Printing Failed: ${message}` });
    } finally {
      setIsPrinting(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading certificate...</div>;
  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>Certificate not found</div>;

  const { customer, extinguishers, qrCodeUrl } = data;

  return (
    <div className="certificate-page">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {printDialogOpen && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: 'min(620px, 100%)',
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Print Sticker Quantity</h2>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
                Enter how many stickers to print for each extinguisher.
              </p>
            </div>

            <div style={{ padding: 22, maxHeight: '55vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Capacity</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>DB Qty</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Print Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {extinguishers.map((ext: Extinguisher) => (
                    <tr key={ext.id}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{ext.ext_type}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{ext.ext_capacity}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{ext.ext_qty}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={stickerQuantities[String(ext.id)] ?? 0}
                          onChange={(event) => {
                            const value = Math.max(0, Math.floor(Number(event.target.value) || 0));
                            setStickerQuantities(prev => ({ ...prev, [String(ext.id)]: value }));
                          }}
                          style={{
                            width: 96,
                            padding: '8px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            fontSize: 15,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setPrintDialogOpen(false)}
                disabled={isPrinting}
                style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 18px', borderRadius: 6, cursor: isPrinting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStickerPrint}
                disabled={isPrinting}
                style={{ background: isPrinting ? '#93C5FD' : '#059669', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 6, cursor: isPrinting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {isPrinting ? 'Printing...' : 'Print Stickers'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {extinguishers.map((ext: Extinguisher) => (
              <tr key={ext.id}>
                <td>{ext.ext_type}</td><td>{ext.ext_capacity}</td><td>{ext.ext_qty} Nos</td>
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
        <button
          onClick={handlePrintSticker}
          disabled={isPrinting}
          style={{
            background: isPrinting ? '#93C5FD' : '#059669',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: 8,
            cursor: isPrinting ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {isPrinting ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
              </svg>
              Printing...
            </>
          ) : (
            '🏷️ Print Sticker'
          )}
        </button>
      </div>
    </div>
  );
}


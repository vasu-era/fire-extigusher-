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
  process.env.NEXT_PUBLIC_PRINT_SERVICE_URL || ''
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
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);

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

  const handleWhatsApp = async () => {
    if (!data) return;
    const { customer } = data;

    // Clean the mobile number — remove spaces, dashes, keep only digits and leading +
    const rawMobile = (customer.mobile || '').replace(/[\s\-()]/g, '');
    // Add India country code if not already present
    const mobile = rawMobile.startsWith('+') ? rawMobile.replace('+', '') : `91${rawMobile}`;

    const message = `Dear ${customer.customer_name}, please find your Fire Extinguisher Service Certificate (${customer.certificate_no}) attached. Thank you for choosing Rakesh Gas Suppliers.`;

    setIsWhatsAppLoading(true);
    setToast({ type: 'success', message: '📄 Generating PDF, please wait...' });

    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      const element = document.querySelector('.certificate') as HTMLElement;
      if (!element) throw new Error('Certificate element not found');

      const opt = {
        margin: 0,
        filename: `Certificate_${customer.certificate_no || customer.customer_name}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();

      setToast({ type: 'success', message: '✅ PDF downloaded! Now opening WhatsApp — please attach the PDF.' });
      setTimeout(() => setToast(null), 6000);

      // Open WhatsApp Web with pre-filled message
      const waUrl = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate PDF';
      setToast({ type: 'error', message: `WhatsApp Error: ${message}` });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsWhatsAppLoading(false);
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

        {/* WhatsApp Share Button */}
        <button
          onClick={handleWhatsApp}
          disabled={isWhatsAppLoading}
          title={`Send certificate to ${data?.customer?.mobile} on WhatsApp`}
          style={{
            background: isWhatsAppLoading ? '#86efac' : '#25D366',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: 8,
            cursor: isWhatsAppLoading ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: isWhatsAppLoading ? 'none' : '0 2px 8px rgba(37,211,102,0.35)',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        >
          {isWhatsAppLoading ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              {/* WhatsApp SVG Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Send on WhatsApp
            </>
          )}
        </button>
      </div>
    </div>
  );
}


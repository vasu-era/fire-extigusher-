'use client';

import { useState } from 'react';
import { ExtinguisherDetail } from '@/types';

interface CertificateTemplateProps {
  customer: any;
  extinguishers: ExtinguisherDetail[];
  qrCodeUrl: string;
}

export function CertificateTemplate({ customer, extinguishers, qrCodeUrl }: CertificateTemplateProps) {
  return (
    <div className="certificate-wrapper">
      <div className="certificate">
        {/* Watermark */}
        <img src="/water.jpg" alt="" className="watermark" />

        {/* Header */}
        <div className="header">
          <div className="logo-area">
            <img src="/logo.png" alt="Logo" className="logo" />
          </div>

          <div className="company">
            <h1>RAKESH GAS SUPPLIERS</h1>
            <p>
              Opp. Reliance Petrol Pump,<br />
              Rajkot Road, Dolatpara,<br />
              Junagadh - 362001
            </p>
            <p>Mobile : 93775 48793 | GST : 24AFVPA4036L1ZB</p>
          </div>

          <div className="qr">
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
          </div>
        </div>

        {/* Title */}
        <div className="title">FIRE EXTINGUISHER CERTIFICATE</div>

        {/* Remarks */}
        <div className="remarks">
          <h3>Service Remarks</h3>
          <p>
            All Fire Extinguishers have been inspected, serviced, refilled and tested as per Fire
            Safety Standards.
          </p>
        </div>

        {/* Customer Info Table */}
        <table className="info">
          <tbody>
            <tr>
              <td style={{ width: '20%' }}><strong>Certificate No</strong></td>
              <td style={{ width: '30%' }}>{customer.certificate_no}</td>
              <td style={{ width: '20%' }}><strong>Issue Date</strong></td>
              <td style={{ width: '30%' }}>
                {new Date(customer.service_date).toLocaleDateString('en-IN')}
              </td>
            </tr>
            <tr>
              <td><strong>Customer Name</strong></td>
              <td>{customer.customer_name}</td>
              <td><strong>Expiry Date</strong></td>
              <td>{new Date(customer.expiry_date).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Mobile</strong></td>
              <td colSpan={3}>{customer.mobile}</td>
            </tr>
            <tr>
              <td><strong>Address</strong></td>
              <td colSpan={3}>{customer.address}</td>
            </tr>
          </tbody>
        </table>

        {/* Equipment Table */}
        <table className="details">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Type</th>
              <th style={{ width: '25%' }}>Capacity</th>
              <th style={{ width: '25%' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {extinguishers.map((ext) => (
              <tr key={ext.id}>
                <td>{ext.ext_type}</td>
                <td>{ext.ext_capacity}</td>
                <td>{ext.ext_qty} Nos</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Box */}
        <div className="total-box">
          TOTAL QUANTITY : {customer.total_qty} Nos
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="signature">
            <img src="/sign.png" alt="Signature" />
            <strong>Authorized Signature</strong>
          </div>
        </div>

        <div className="bottom">
          <strong>THANK YOU FOR CHOOSING RAKESH GAS SUPPLIERS</strong>
        </div>
      </div>
    </div>
  );
}

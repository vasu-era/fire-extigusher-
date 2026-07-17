'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate';

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      const res = await fetch(`/api/certificate/${id}`);
      if (res.ok) {
        const certificateData = await res.json();
        setData(certificateData);
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading certificate...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Certificate not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6">
      <CertificateTemplate
        customer={data.customer}
        extinguishers={data.extinguishers}
        qrCodeUrl={data.qrCodeUrl}
      />

      <button
        onClick={() => window.print()}
        className="no-print block mx-auto mt-6 bg-blue-900 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-800"
      >
        🖨️ Print Certificate
      </button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ExtinguisherRow, createEmptyRow } from '@/components/customers/ExtinguisherRow';
import { calculateExpiryDate } from '@/lib/utils';
import { ExtinguisherFormRow } from '@/types';

export default function NewCustomerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile: '',
    address: '',
    certificate_no: '',
    service_date: new Date().toISOString().split('T')[0],
    expiry_duration: 12,
    expiry_date: '',
    total_qty: 1,
  });
  const [extinguishers, setExtinguishers] = useState<ExtinguisherFormRow[]>([createEmptyRow()]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (formData.service_date) {
      fetchCertificateNo();
      updateExpiryDate();
    }
  }, [formData.service_date, formData.expiry_duration]);

  const fetchCertificateNo = async () => {
    try {
      const res = await fetch(`/api/next-certificate?service_date=${formData.service_date}`);
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, certificate_no: data.certificate_no }));
      }
    } catch (error) {
      console.error('Error fetching certificate number:', error);
    }
  };

  const updateExpiryDate = () => {
    if (formData.service_date && formData.expiry_duration) {
      const expiryDate = calculateExpiryDate(formData.service_date, formData.expiry_duration);
      setFormData((prev) => ({ ...prev, expiry_date: expiryDate }));
    }
  };

  const handleExtinguisherChange = (index: number, field: keyof ExtinguisherFormRow, value: any) => {
    const updated = [...extinguishers];
    updated[index] = { ...updated[index], [field]: value };
    setExtinguishers(updated);
    updateTotalQty(updated);
  };

  const handleExtinguisherRemove = (index: number) => {
    if (extinguishers.length > 1) {
      const updated = extinguishers.filter((_, i) => i !== index);
      setExtinguishers(updated);
      updateTotalQty(updated);
    }
  };

  const addExtinguisherRow = () => {
    setExtinguishers([...extinguishers, createEmptyRow()]);
  };

  const updateTotalQty = (exts: ExtinguisherFormRow[]) => {
    const total = exts.reduce((sum, ext) => sum + ext.ext_qty, 0);
    setFormData((prev) => ({ ...prev, total_qty: total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, extinguishers }),
      });

      if (res.ok) {
        router.push('/customers');
      } else {
        alert('Error creating customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <Sidebar />
      <div className="ml-[260px] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-card p-8">
            <h1 className="text-2xl font-bold text-center text-primary mb-6">
              RAKESH GAS SUPPLIERS
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Fire Extinguisher Service Management System
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Customer Name"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />

                <Input
                  label="Mobile Number"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Enter 10 digit number"
                />

                <div className="col-span-2">
                  <Input
                    label="Address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <Input
                  label="Certificate Number"
                  required
                  value={formData.certificate_no}
                  readOnly
                  className="bg-gray-100 font-bold"
                />

                <Input
                  label="Issue Date"
                  type="date"
                  required
                  value={formData.service_date}
                  onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                />

                <Select
                  label="Validity Duration"
                  required
                  value={formData.expiry_duration}
                  onChange={(e) => setFormData({ ...formData, expiry_duration: parseInt(e.target.value) })}
                >
                  <option value="12">1 Year (Standard)</option>
                  <option value="6">6 Months</option>
                  <option value="24">2 Years</option>
                  <option value="36">3 Years</option>
                  <option value="60">5 Years</option>
                </Select>

                <Input
                  label="Expiry Date"
                  type="text"
                  required
                  value={formData.expiry_date}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Extinguisher Details</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="border border-gray-300 px-3 py-2">Type</th>
                      <th className="border border-gray-300 px-3 py-2">Capacity</th>
                      <th className="border border-gray-300 px-3 py-2">Qty</th>
                      <th className="border border-gray-300 px-3 py-2">Service Type</th>
                      <th className="border border-gray-300 px-3 py-2">Amount</th>
                      <th className="border border-gray-300 px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extinguishers.map((row, index) => (
                      <ExtinguisherRow
                        key={row.id}
                        row={row}
                        index={index}
                        onChange={handleExtinguisherChange}
                        onRemove={handleExtinguisherRemove}
                        canRemove={extinguishers.length > 1}
                      />
                    ))}
                  </tbody>
                </table>

                <button
                  type="button"
                  onClick={addExtinguisherRow}
                  className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  + Add Extinguisher
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Total Quantity"
                  required
                  value={formData.total_qty}
                  readOnly
                  className="bg-gray-100 font-bold"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                SAVE CUSTOMER
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

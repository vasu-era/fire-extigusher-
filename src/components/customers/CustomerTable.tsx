'use client';

import { useState } from 'react';
import { Customer } from '@/types';
import { daysUntilExpiry } from '@/lib/utils';

interface CustomerTableProps {
  customers: Customer[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onViewCertificate?: (id: number) => void;
  onRenew?: (id: number) => void;
  selectable?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onViewCertificate,
  onRenew,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: CustomerTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? customers.map(c => c.id) : []);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter(i => i !== id));
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === customers.length && customers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Certificate No</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Customer Name</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mobile</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Service Date</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Expiry Date</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Qty</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const days = daysUntilExpiry(customer.expiry_date);
            const status = days < 0 ? 'expired' : days <= 30 ? 'due' : 'active';
            
            return (
              <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onChange={(e) => handleSelectOne(customer.id, e.target.checked)}
                      className="rounded"
                    />
                  </td>
                )}
                <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                  {customer.certificate_no}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {customer.customer_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{customer.mobile}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(customer.service_date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(customer.expiry_date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">{customer.total_qty}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : status === 'due'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {status === 'active' ? 'Active' : status === 'due' ? `Due (${days}d)` : 'Expired'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {onViewCertificate && (
                      <button
                        onClick={() => onViewCertificate(customer.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Certificate"
                      >
                        📄
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(customer.id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    )}
                    {onRenew && (
                      <button
                        onClick={() => onRenew(customer.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Renew"
                      >
                        🔄
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(customer.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

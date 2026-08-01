'use client';

import { Customer } from '@/types';

interface RecentCustomersProps {
  customers: Customer[];
  onViewAll: () => void;
  fy: string;
}

export function RecentCustomers({ customers, onViewAll, fy }: RecentCustomersProps) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">
          ➕ Recently Added (FY {fy})
        </h3>
        <button
          onClick={onViewAll}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View All Customers →
        </button>
      </div>

      {customers.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr>
              <th className="bg-gray-50 text-xs font-bold text-gray-500 uppercase px-3 py-2 text-left">
                Customer Name
              </th>
              <th className="bg-gray-50 text-xs font-bold text-gray-500 uppercase px-3 py-2 text-left">
                Certificate No.
              </th>
              <th className="bg-gray-50 text-xs font-bold text-gray-500 uppercase px-3 py-2 text-left">
                Expiry Date
              </th>
              <th className="bg-gray-50 text-xs font-bold text-gray-500 uppercase px-3 py-2 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-100">
                <td className="px-3 py-3 text-sm font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-gray-100 p-1 rounded-full">👤</span>
                    {customer.customer_name}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs font-semibold">
                    📄 {customer.certificate_no}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">
                  📅 {new Date(customer.expiry_date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-3 py-3 text-center">
                  <a
                    href={`/customers/${customer.id}/certificate`}
                    target="_blank"
                    className="inline-block bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-600"
                  >
                    👁️ View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No customers in this financial year
        </div>
      )}
    </div>
  );
}

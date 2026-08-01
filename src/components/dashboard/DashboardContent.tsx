'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardStats, Notification } from '@/types';

interface DashboardContentProps {
  stats: DashboardStats;
  notifications: Notification[];
  recentCustomers: any[];
  selectedFY: string;
}

export function DashboardContent({ stats, notifications, recentCustomers, selectedFY }: DashboardContentProps) {
  return (
    <div className="ml-[260px] p-8 min-h-screen bg-bg-main">
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Customers (FY)" value={stats.total} color="blue" />
        <StatCard title="Expiry Due (30 Days)" value={stats.expiryDue} color="amber" />
        <StatCard title="Expired Customers" value={stats.expired} color="red" />
        <StatCard title="Monthly Report Count" value={stats.monthlyCount} color="green" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Recently Added (FY {selectedFY})</h3>
            <a href="/customers" className="text-sm text-blue-500 font-semibold hover:underline">
              View All Customers →
            </a>
          </div>
          
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase py-3 px-2 bg-gray-50">Customer Name</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase py-3 px-2 bg-gray-50">Certificate No.</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase py-3 px-2 bg-gray-50">Expiry Date</th>
                <th className="text-center text-xs font-bold text-gray-500 uppercase py-3 px-2 bg-gray-50">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.map((customer: any) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-gray-100 p-1 rounded-full">👤</span>
                      <b className="text-sm">{customer.customer_name}</b>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                      📄 {customer.certificate_no}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-sm">
                     {new Date(customer.expiry_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-4 px-2 text-center">
                    <a
                      href={`/customers/${customer.id}/certificate`}
                      target="_blank"
                      className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-600"
                    >
                      👁️ View
                    </a>
                  </td>
                </tr>
              ))}
              {recentCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    Is financial year me koi customer nahi hai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <div className="bg-gray-900 p-4 flex justify-between items-center">
            <h3 className="text-white text-sm font-semibold">
              Notifications (FY {selectedFY} - {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})
            </h3>
            {notifications.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const daysLeft = notif.days_left;
                let itemClass = '';
                let msgText = '';
                
                if (daysLeft < 0) {
                  itemClass = 'expired-item';
                  msgText = `Expired: ${notif.customer_name}`;
                } else if (daysLeft === 0) {
                  itemClass = 'today-item';
                  msgText = `Expiring Today: ${notif.customer_name}`;
                } else {
                  itemClass = 'pending-item';
                  msgText = `${notif.customer_name} (${daysLeft} Days left)`;
                }

                return (
                  <div key={notif.id} className={`flex justify-between items-center p-4 border-b border-gray-100 ${itemClass}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                      <p className="text-sm text-gray-700 font-medium truncate" title={msgText}>
                        {msgText}
                      </p>
                    </div>
                    <a
                      href={`/customers/${notif.id}/renew`}
                      className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-50"
                      title="Renew Customer"
                    >
                      ️
                    </a>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                ✅ Is FY me is mahine ka koi pending notification nahi hai.
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
            <a href="/reports/monthly" className="text-blue-500 text-sm font-semibold hover:underline">
              Show All
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

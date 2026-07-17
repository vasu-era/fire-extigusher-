'use client';

import { Notification } from '@/types';
import { daysUntilExpiry } from '@/lib/utils';

interface NotificationPortalProps {
  notifications: Notification[];
  onRenew: (id: number) => void;
  onViewAll: () => void;
  fy: string;
}

export function NotificationPortal({
  notifications,
  onRenew,
  onViewAll,
  fy,
}: NotificationPortalProps) {
  const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white text-sm font-semibold">
          Notifications (FY {fy} - {currentMonth})
        </h3>
        {notifications.length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const days = daysUntilExpiry(notif.expiry_date);
            const status = days < 0 ? 'expired' : days === 0 ? 'today' : 'pending';
            const msgText =
              days < 0
                ? `Expired: ${notif.customer_name}`
                : days === 0
                ? `Expiring Today: ${notif.customer_name}`
                : `${notif.customer_name} (${days} Days left)`;

            return (
              <div
                key={notif.id}
                className="flex justify-between items-center px-4 py-3 border-b border-gray-100"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'expired'
                        ? 'bg-red-500'
                        : status === 'today'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <p className="text-sm text-gray-800 font-medium truncate" title={msgText}>
                    {msgText}
                  </p>
                </div>
                <button
                  onClick={() => onRenew(notif.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                  title="Renew Customer"
                >
                  ⚙️
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            ✅ No pending notifications for this month
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <button
          onClick={onViewAll}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Show All
        </button>
      </div>
    </div>
  );
}

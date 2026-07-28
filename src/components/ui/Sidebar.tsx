'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers/new', label: '➕ New Customer' },
  { href: '/customers', label: '👥 Customer List' },
  { href: '/reports/follow-up', label: '📋 Daily Follow-up' },
  { href: '/reports/expiry', label: '⏰ Expiry Due' },
  { href: '/reports/monthly', label: '📅 Monthly Report' },
  { href: '/reports/revenue', label: '💰 Revenue Dashboard' },
  { href: '/reports/whatsapp', label: '📱 WhatsApp Reminders' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <div className="sidebar-header">🔥 RGS Admin</div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link href={item.href} className={isActive ? 'active' : ''}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

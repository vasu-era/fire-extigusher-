'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '' },
  { href: '/customers/new', label: 'New Customer', icon: '' },
  { href: '/customers', label: 'Customer List', icon: '👥' },
  { href: '/reports/expiry', label: 'Expiry Due', icon: '⏰' },
  { href: '/reports/monthly', label: 'Monthly Report', icon: '📅' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[260px] bg-sidebar text-white fixed h-screen left-0 top-0 z-100 flex flex-col">
      <div className="p-6 text-lg font-bold tracking-wide border-b border-white/10">
        🔥 RGS Admin
      </div>
      
      <ul className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-sidebar-hover text-white' 
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { FYOption } from '@/lib/financial-year';

interface TopNavbarProps {
  selectedFY: string;
  onFYChange: (fy: string) => void;
}

export function TopNavbar({ selectedFY, onFYChange }: TopNavbarProps) {
  const [fyOptions, setFyOptions] = useState<FYOption[]>([]);

  useEffect(() => {
    fetch('/api/reports/fy-options')
      .then(r => r.json())
      .then(d => setFyOptions(d.options || []))
      .catch(() => {});
  }, []);

  return (
    <div className="top-navbar">
      <h1>RAKESH GAS SUPPLIERS</h1>
      <div className="header-right-actions">
        <select
          className="fy-selector"
          value={selectedFY}
          onChange={(e) => onFYChange(e.target.value)}
        >
          {fyOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          <option value="all">All Time</option>
          <option value="others">Others/Unassigned</option>
        </select>
        <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/login' })}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

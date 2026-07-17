'use client';

import { signOut } from 'next-auth/react';

interface TopNavbarProps {
  selectedFY: string;
  onFYChange: (fy: string) => void;
}

export function TopNavbar({ selectedFY, onFYChange }: TopNavbarProps) {
  return (
    <div className="top-navbar">
      <h1>RAKESH GAS SUPPLIERS</h1>
      <div className="header-right-actions">
        <select
          className="fy-selector"
          value={selectedFY}
          onChange={(e) => onFYChange(e.target.value)}
        >
          <option value="26-27">FY 2026-27</option>
          <option value="25-26">FY 2025-26</option>
          <option value="all">All Time</option>
        </select>
        <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/login' })}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

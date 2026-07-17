'use client';

import { useState, useEffect } from 'react';
import { getCurrentFY, getFYDates } from '@/lib/financial-year';
import { signOut, useSession } from 'next-auth/react';

export function TopNavbar({ 
  selectedFY, 
  onFYChange 
}: { 
  selectedFY: string;
  onFYChange: (fy: string) => void;
}) {
  const { data: session } = useSession();
  const currentFY = getCurrentFY();
  
  const fyOptions = [
    { value: currentFY, label: `FY 20${currentFY}` },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex justify-between items-center mb-8 bg-white px-6 py-4 rounded-xl shadow-card">
      <h1 className="text-2xl font-bold text-gray-900">RAKESH GAS SUPPLIERS</h1>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedFY}
          onChange={(e) => onFYChange(e.target.value)}
          className="px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer outline-none focus:border-blue-500"
        >
          {fyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

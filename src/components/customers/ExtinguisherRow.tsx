'use client';

import { useState } from 'react';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { CAPACITY_OPTIONS, ExtinguisherFormRow } from '@/types';
import { generateId } from '@/lib/utils';

interface ExtinguisherRowProps {
  row: ExtinguisherFormRow;
  index: number;
  onChange: (index: number, field: keyof ExtinguisherFormRow, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function ExtinguisherRow({ row, index, onChange, onRemove, canRemove }: ExtinguisherRowProps) {
  const capacities = CAPACITY_OPTIONS.find(opt => opt.type === row.ext_type)?.capacities || [];

  return (
    <tr>
      <td>
        <Select
          value={row.ext_type}
          onChange={(e) => onChange(index, 'ext_type', e.target.value)}
          required
        >
          <option value="">Select Type</option>
          <option value="ABC">ABC Powder</option>
          <option value="CO2">CO2</option>
          <option value="Water">Water</option>
          <option value="Foam">Foam</option>
        </Select>
      </td>
      <td>
        <Select
          value={row.ext_capacity}
          onChange={(e) => onChange(index, 'ext_capacity', e.target.value)}
          required
        >
          <option value="">Select Capacity</option>
          {capacities.map(cap => (
            <option key={cap} value={cap}>{cap}</option>
          ))}
        </Select>
      </td>
      <td>
        <Input
          type="number"
          value={row.ext_qty}
          onChange={(e) => onChange(index, 'ext_qty', parseInt(e.target.value) || 1)}
          min={1}
          required
        />
      </td>
      <td>
        <Select
          value={row.service_action_type}
          onChange={(e) => onChange(index, 'service_action_type', e.target.value)}
        >
          <option value="refilling">Refilling Only</option>
          <option value="new">New Bottle/Sale</option>
        </Select>
      </td>
      <td>
        {row.service_action_type === 'refilling' ? (
          <Input
            type="number"
            placeholder="Refill Rate"
            value={row.ext_refilling_price}
            onChange={(e) => onChange(index, 'ext_refilling_price', parseFloat(e.target.value) || 0)}
            min={0}
            step={0.01}
          />
        ) : (
          <Input
            type="number"
            placeholder="New Bottle Rate"
            value={row.ext_new_price}
            onChange={(e) => onChange(index, 'ext_new_price', parseFloat(e.target.value) || 0)}
            min={0}
            step={0.01}
          />
        )}
      </td>
      <td className="text-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            canRemove
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export function createEmptyRow(): ExtinguisherFormRow {
  return {
    id: generateId(),
    ext_type: '',
    ext_capacity: '',
    ext_qty: 1,
    service_action_type: 'refilling',
    ext_refilling_price: 0,
    ext_new_price: 0,
  };
}

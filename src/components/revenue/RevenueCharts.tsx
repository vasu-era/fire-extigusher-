'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b'];

const formatCurrency = (v: any) => `₹${Number(v).toLocaleString()}`;

export function MonthlyTrendChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Monthly Revenue Trend</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
            <Tooltip formatter={formatCurrency} />
            <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} dot={{ r: 5, fill: '#dc2626' }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-10 text-gray-500">No data available</div>
      )}
    </div>
  );
}

export function TypeBreakdownChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 Type Breakdown</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => `${props.type} ${props.percentage}%`}
              outerRadius={90}
              dataKey="revenue"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatCurrency} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-10 text-gray-500">No data</div>
      )}
    </div>
  );
}

export function TypeBarChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Type-wise Revenue</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="type" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
            <Tooltip formatter={formatCurrency} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-10 text-gray-500">No data</div>
      )}
    </div>
  );
}

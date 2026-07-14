/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700/60 p-2.5 rounded-lg shadow-xl text-xs font-mono">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-emerald-400 font-semibold font-sans">
          Value: {typeof payload[0].value === 'number' ? `$${payload[0].value.toFixed(2)}` : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// 1. Revenue Over Time Area Chart
export function RevenueChart({ data, color = '#d4af37' }: { data: any[]; color?: string }) {
  const chartData = data && data.length > 0 ? data : [
    { name: 'Mon', revenue: 420 },
    { name: 'Tue', revenue: 580 },
    { name: 'Wed', revenue: 490 },
    { name: 'Thu', revenue: 640 },
    { name: 'Fri', revenue: 1100 },
    { name: 'Sat', revenue: 1450 },
    { name: 'Sun', revenue: 1200 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" opacity={0.15} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Popular Items Bar Chart
export function PopularItemsChart({ data, color = '#38bdf8' }: { data: any[]; color?: string }) {
  const chartData = data && data.length > 0 ? data : [
    { name: 'Truffle Pasta', sales: 48 },
    { name: 'Dragon Roll', sales: 42 },
    { name: 'Double Smash', sales: 38 },
    { name: 'Margherita', sales: 31 },
    { name: 'Truffle Fries', sales: 29 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" opacity={0.15} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(51, 65, 85, 0.1)' }} />
          <Bar dataKey="sales" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Category Share Pie Chart
export function CategoryShareChart() {
  const data = [
    { name: 'Fresh Pastas', value: 400 },
    { name: 'Pizzas', value: 300 },
    { name: 'Desserts', value: 150 },
    { name: 'Beverages', value: 100 },
  ];

  const COLORS = ['#d4af37', '#38bdf8', '#fb7185', '#34d399'];

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center">
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center text-[10px] text-slate-400">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Peak Hours Distribution Line Chart
export function PeakHoursChart() {
  const data = [
    { time: '12 PM', orders: 12 },
    { time: '1 PM', orders: 25 },
    { time: '2 PM', orders: 18 },
    { time: '3 PM', orders: 8 },
    { time: '4 PM', orders: 5 },
    { time: '5 PM', orders: 15 },
    { time: '6 PM', orders: 32 },
    { time: '7 PM', orders: 58 },
    { time: '8 PM', orders: 64 },
    { time: '9 PM', orders: 40 },
    { time: '10 PM', orders: 15 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" opacity={0.15} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="orders" stroke="#e03e52" strokeWidth={2} fill="rgba(224, 62, 82, 0.1)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 5. Branch comparison
export function BranchComparisonChart() {
  const data = [
    { name: 'Downtown Branch', revenue: 14500, orders: 480 },
    { name: 'Uptown Lakeside', revenue: 11200, orders: 310 },
  ];

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
          <Tooltip />
          <Legend fontSize={10} />
          <Bar dataKey="revenue" name="Revenue ($)" fill="#d4af37" radius={[4, 4, 0, 0]} />
          <Bar dataKey="orders" name="Orders (qty)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

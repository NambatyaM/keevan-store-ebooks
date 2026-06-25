"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SalesPoint = {
  label: string;
  earnings: number;
};

export function SalesChart({ data = [] }: { data?: SalesPoint[] }) {
  if (!data.length) {
    return (
      <div className="grid h-72 place-items-center rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-600">
        No verified sales data is available yet.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-lg border border-neutral-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="earnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#008751" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#008751" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="earnings" stroke="#008751" fillOpacity={1} fill="url(#earnings)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
type ThroughputPoint = { day: string; validated: number; manual: number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const validated = payload.find((item) => item.dataKey === "validated")?.value ?? 0;
  const manual = payload.find((item) => item.dataKey === "manual")?.value ?? 0;
  return (
    <div className="rounded-md border border-line-strong bg-surface px-3 py-2 shadow-card">
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-pine" /> {validated} validated</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ochre" /> {manual} manual</span>
      </div>
    </div>
  );
}

export function ThroughputChart({ data = [] }: { data?: ThroughputPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[214px] w-full flex-col items-center justify-center rounded-md border border-dashed border-line bg-paper/40 p-4 text-center">
        <p className="text-[11px] font-medium text-ink">No throughput data recorded</p>
        <p className="mt-1 text-[9px] text-muted">Weekly throughput analytics will render here as applications are validated.</p>
      </div>
    );
  }

  return (
    <div className="h-[214px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="validatedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c5444" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#1c5444" stopOpacity={0.015} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e8e3d8" strokeDasharray="2 5" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} dy={8} />
          <YAxis axisLine={false} tickLine={false} width={36} tickCount={4} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#d7d1c2", strokeDasharray: "3 4" }} />
          <Area type="monotone" dataKey="validated" stroke="#1c5444" strokeWidth={1.8} fill="url(#validatedFill)" activeDot={{ r: 3, fill: "#1c5444", stroke: "#fbfaf6", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="manual" stroke="#98661c" strokeWidth={1.4} strokeDasharray="3 3" dot={false} activeDot={{ r: 3, fill: "#98661c", stroke: "#fbfaf6", strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

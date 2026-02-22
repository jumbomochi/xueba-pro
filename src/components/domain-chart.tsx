"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DomainScore } from "@/lib/scoring";

interface DomainChartProps {
  domainScores: Record<string, DomainScore>;
}

export function DomainChart({ domainScores }: DomainChartProps) {
  const data = Object.entries(domainScores).map(([name, score]) => ({
    name: name.length > 30 ? name.slice(0, 30) + "..." : name,
    fullName: name,
    score: score.percentage,
    correct: score.correct,
    total: score.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={data.length * 60 + 40}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 12 }} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, _name: string, props: any) => [
            `${props.payload.correct}/${props.payload.total} (${value}%)`,
            props.payload.fullName,
          ]) as never}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.score >= 70 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

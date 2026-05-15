"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatDate } from "@/lib/format";

type MoneyRow = {
  created_at: string;
  direction: "income" | "expense";
  amount: number;
  type: string;
};

export function ReportCharts({ data }: { data: MoneyRow[] }) {
  const chartData = useMemo(() => {
    // Group by date (YYYY-MM-DD)
    const grouped = data.reduce((acc, row) => {
      const date = new Date(row.created_at).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0, balance: 0 };
      }
      const amount = Number(row.amount);
      if (row.direction === "income") {
        acc[date].income += amount;
      } else {
        acc[date].expense += amount;
      }
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number; balance: number }>);

    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate running balance
    let currentBalance = 0;
    return sorted.map(day => {
      currentBalance += (day.income - day.expense);
      return { ...day, balance: currentBalance, displayDate: formatDate(day.date).split(',')[0] };
    });
  }, [data]);

  if (!chartData.length) return null;

  return (
    <div className="panel stack" style={{ height: 400, padding: 24, marginBottom: 24 }}>
      <h2 className="section-title">Kirim, Chiqim va Balans Dinamikasi</h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="displayDate" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            stroke="var(--muted)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => value > 1000 ? `${(value/1000).toFixed(0)}k` : value}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <Tooltip 
            formatter={(value: any) => formatCurrency(value)}
            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', borderRadius: 12, boxShadow: 'var(--shadow)' }}
            itemStyle={{ fontWeight: 700 }}
          />
          <Area type="monotone" dataKey="income" name="Kirim" stroke="var(--success)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
          <Area type="monotone" dataKey="expense" name="Chiqim" stroke="var(--danger)" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
          <Area type="monotone" dataKey="balance" name="Balans Trendi" stroke="var(--blue)" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

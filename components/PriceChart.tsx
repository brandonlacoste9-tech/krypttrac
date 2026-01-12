'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface PriceChartProps {
  data: Array<[number, number]> // [timestamp, price]
  color?: string
  height?: number
}

export function PriceChart({ data, color = '#a855f7', height = 200 }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map(([timestamp, price]) => ({
      time: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: price,
      fullTime: new Date(timestamp).toLocaleString(),
    }))
  }, [data])

  const formatTooltipValue = (value: number) => formatCurrency(value)

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #7c3aed',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Price']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

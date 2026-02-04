'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Legend,
} from 'recharts';

interface AnalyticsChartProps {
  type: 'area' | 'bar' | 'donut';
  title: string;
  description?: string;
  data: any[];
  categories?: string[];
  index?: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'];

export function AnalyticsChart({
  type,
  title,
  description,
  data,
  categories,
  index = 'date',
  colors,
  valueFormatter,
}: AnalyticsChartProps) {
  const defaultValueFormatter = (value: number) =>
    `${Intl.NumberFormat('us').format(value).toString()}`;

  const formatter = (value: number | undefined): string => {
    if (value === undefined) return '';
    return valueFormatter ? valueFormatter(value) : defaultValueFormatter(value);
  };
  const chartColors = colors || CHART_COLORS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={288}>
          {type === 'area' && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={index} />
              <YAxis width={48} tickFormatter={formatter} />
              <Tooltip formatter={formatter} />
              <Legend />
              {categories?.map((category, idx) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={chartColors[idx % chartColors.length]}
                  fill={chartColors[idx % chartColors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          )}

          {type === 'bar' && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={index} />
              <YAxis width={48} tickFormatter={formatter} />
              <Tooltip formatter={formatter} />
              <Legend />
              {categories?.map((category, idx) => (
                <Bar
                  key={category}
                  dataKey={category}
                  fill={chartColors[idx % chartColors.length]}
                />
              ))}
            </BarChart>
          )}

          {type === 'donut' && (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatter} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

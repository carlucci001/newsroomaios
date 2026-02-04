'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, BarChart, DonutChart } from '@tremor/react';

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

export function AnalyticsChart({
  type,
  title,
  description,
  data,
  categories,
  index,
  colors = ['blue', 'cyan', 'indigo'],
  valueFormatter,
}: AnalyticsChartProps) {
  const defaultValueFormatter = (value: number) =>
    `${Intl.NumberFormat('us').format(value).toString()}`;

  const formatter = valueFormatter || defaultValueFormatter;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {type === 'area' && (
          <AreaChart
            className="h-72"
            data={data}
            index={index || 'date'}
            categories={categories || []}
            colors={colors}
            valueFormatter={formatter}
            yAxisWidth={48}
          />
        )}

        {type === 'bar' && (
          <BarChart
            className="h-72"
            data={data}
            index={index || 'name'}
            categories={categories || []}
            colors={colors}
            valueFormatter={formatter}
            yAxisWidth={48}
          />
        )}

        {type === 'donut' && (
          <DonutChart
            className="h-72"
            data={data}
            category="value"
            index="name"
            valueFormatter={formatter}
            colors={colors}
          />
        )}
      </CardContent>
    </Card>
  );
}

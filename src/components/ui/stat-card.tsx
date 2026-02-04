import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number | React.ReactNode
  subValue?: string
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  color?: 'brand' | 'success' | 'warning' | 'danger' | 'gray'
}

const colorClasses = {
  brand: {
    icon: 'bg-brand-500',
    text: 'text-brand-600',
    trend: 'text-brand-600',
  },
  success: {
    icon: 'bg-success-500',
    text: 'text-success-600',
    trend: 'text-success-600',
  },
  warning: {
    icon: 'bg-warning-500',
    text: 'text-warning-600',
    trend: 'text-warning-600',
  },
  danger: {
    icon: 'bg-danger-500',
    text: 'text-danger-600',
    trend: 'text-danger-600',
  },
  gray: {
    icon: 'bg-gray-500',
    text: 'text-gray-600',
    trend: 'text-gray-600',
  },
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  icon,
  color = 'brand',
  className,
  children,
  ...props
}: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm p-6 transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            {typeof value === 'string' || typeof value === 'number' ? (
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            ) : (
              value
            )}
          </div>
          {subValue && (
            <p className="text-sm text-gray-500 mt-1">{subValue}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.value >= 0 ? "text-success-600" : "text-danger-600"
                )}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-lg shadow-sm", colors.icon)}>
            <div className="text-white w-6 h-6 flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

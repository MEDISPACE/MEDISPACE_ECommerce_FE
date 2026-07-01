import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

/**
 * MediSpace Stats Card System
 * Reusable stats card component với modern design, hover effects, và conditional badges
 */

export interface StatCardConfig {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'gray' | 'emerald' | 'cyan' | 'purple' | 'pink'
  badge?: {
    text: string
    icon?: LucideIcon
    show: boolean
    variant?: 'success' | 'warning' | 'danger' | 'info'
  }
  trend?: {
    value: string
    type: 'positive' | 'negative'
    label?: string
  }
}

interface StatsCardProps {
  config: StatCardConfig
  onClick?: () => void
}

// Color gradient mappings
export const colorGradients = {
  blue: {
    gradient: 'from-[#0A2463] to-[#1E40AF]',
    iconBg: 'from-[#0A2463]/10 to-[#1E40AF]/10',
    text: 'text-[#0A2463]',
    badgeBg: 'bg-[#F0F6FF]',
    badgeText: 'text-[#0A2463]',
  },
  green: {
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'from-green-500/10 to-emerald-500/10',
    text: 'text-green-600',
    badgeBg: 'bg-green-50',
    badgeText: 'text-green-600',
  },
  red: {
    gradient: 'from-red-500 to-rose-500',
    iconBg: 'from-red-500/10 to-rose-500/10',
    text: 'text-red-600',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-600',
  },
  yellow: {
    gradient: 'from-yellow-500 to-amber-500',
    iconBg: 'from-yellow-500/10 to-amber-500/10',
    text: 'text-yellow-600',
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-600',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-500',
    iconBg: 'from-orange-500/10 to-amber-500/10',
    text: 'text-orange-600',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-600',
  },
  gray: {
    gradient: 'from-gray-500 to-gray-700',
    iconBg: 'from-gray-500/10 to-gray-700/10',
    text: 'text-gray-600',
    badgeBg: 'bg-gray-50',
    badgeText: 'text-gray-600',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'from-emerald-500/10 to-teal-500/10',
    text: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
  },
  cyan: {
    gradient: 'from-[#0A2463] to-[#1E40AF]',
    iconBg: 'from-[#0A2463]/10 to-[#1E40AF]/10',
    text: 'text-[#1E40AF]',
    badgeBg: 'bg-[#F0F6FF]',
    badgeText: 'text-[#1E40AF]',
  },
  purple: {
    gradient: 'from-[#0A2463] to-[#1E40AF]',
    iconBg: 'from-[#0A2463]/10 to-[#1E40AF]/10',
    text: 'text-[#1E40AF]',
    badgeBg: 'bg-[#F0F6FF]',
    badgeText: 'text-[#1E40AF]',
  },
  pink: {
    gradient: 'from-[#1E40AF] to-[#3B82F6]',
    iconBg: 'from-[#1E40AF]/10 to-[#3B82F6]/10',
    text: 'text-[#1E40AF]',
    badgeBg: 'bg-[#F0F6FF]',
    badgeText: 'text-[#1E40AF]',
  },
}

export function StatsCard({ config, onClick }: StatsCardProps) {
  const colors = colorGradients[config.color]
  const Icon = config.icon
  const BadgeIcon = config.badge?.icon

  return (
    <Card
      className={`group relative h-full overflow-hidden bg-white backdrop-blur-lg shadow-lg border border-[#E8EDF5] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <CardContent className='p-4 relative z-10 h-full flex flex-col'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1'>
            <p className='text-xs text-gray-600 mb-1 uppercase tracking-wide'>{config.title}</p>
            <h3
              className={`text-2xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:${colors.gradient.split(' ')[0].replace('from-', 'from-')} group-hover:${colors.gradient.split(' ')[1].replace('to-', 'to-')} transition-all duration-300`}
            >
              {config.value}
            </h3>
          </div>

          {/* Icon with gradient background */}
          <div
            className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${colors.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
          >
            <div
              className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
            />
            <Icon className={`w-5 h-5 ${colors.text} relative z-10`} />
          </div>
        </div>

        {/* Trend indicator or Badge */}
        <div className='mt-auto'>
          {config.trend && (
            <div className='flex items-center gap-2'>
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${config.trend.type === 'positive' ? 'bg-green-50' : 'bg-red-50'}`}
              >
                {config.trend.type === 'positive' ? (
                  <ArrowUpRight className='w-3.5 h-3.5 text-green-600' />
                ) : (
                  <ArrowDownRight className='w-3.5 h-3.5 text-red-600' />
                )}
                <span className={`text-sm ${config.trend.type === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {config.trend.value}
                </span>
              </div>
              {config.trend.label && <span className='text-xs text-gray-500'>{config.trend.label}</span>}
            </div>
          )}

          {config.badge && config.badge.show && (
            <div className='flex items-center gap-1'>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${colors.badgeBg}`}>
                {BadgeIcon && <BadgeIcon className={`w-3 h-3 ${colors.badgeText}`} />}
                <span className={`text-xs ${colors.badgeText}`}>{config.badge.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom colored line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />
      </CardContent>
    </Card>
  )
}

/**
 * Helper function để tạo grid layout cho stats cards
 */
export function StatsCardGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) {
  const gridCols = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
  }

  return <div className={`grid grid-cols-2 md:grid-cols-${Math.min(cols, 4)} ${gridCols[cols]} gap-4 items-stretch`}>{children}</div>
}

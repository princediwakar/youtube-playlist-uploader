import React from 'react'

interface StatCardProps {
  title: string
  value: string
  description: string
  trend?: 'up' | 'down'
  trendValue?: string
  icon?: React.ReactNode
}

export function StatCard({ title, value, description, trend, trendValue, icon }: StatCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] shadow-lg relative overflow-hidden group hover:border-[#3a3a3a] transition-all duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex items-end gap-3 mb-2 relative z-10">
        <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-sm font-medium mb-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 relative z-10">{description}</p>
    </div>
  )
}

interface ProgressBarProps {
  label: string
  percentage: number
  color?: string
}

export function ProgressBar({ label, percentage, color = 'bg-red-600' }: ProgressBarProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-400 font-bold">{percentage}%</span>
      </div>
      <div className="w-full bg-[#111] rounded-full h-3 border border-[#222] overflow-hidden">
        <div 
          className={`h-3 rounded-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

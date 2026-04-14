'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalysisMetricsProps {
  documentsCount: number
}

export default function AnalysisMetrics({ documentsCount }: AnalysisMetricsProps) {
  const [metricsData, setMetricsData] = useState<any>(null)

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const response = await fetch('http://localhost:8000/analysis')
        const data = await response.json()
        if (data.metrics) {
          setMetricsData(data.metrics)
        }
      } catch (error) {
        console.error("Failed to fetch analysis metrics", error)
      }
    }
    fetchAnalysis()
  }, [])
  const metrics = metricsData ? [
    {
      title: 'Critical Issues',
      value: metricsData.critical_issues.toString(),
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      description: 'Requires immediate attention',
    },
    {
      title: 'Warnings',
      value: metricsData.warnings.toString(),
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      description: 'Review recommended',
    },
    {
      title: 'Compliant Sections',
      value: metricsData.compliant_sections.toString(),
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: 'Meeting standards',
    },
    {
      title: 'Avg Processing Time',
      value: metricsData.avg_processing_time,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Per document',
    },
  ] : []

  if (!metricsData) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-2">{metric.title}</p>
                  <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                </div>
                <div className={`${metric.bgColor} p-3 rounded-lg`}>
                  <Icon className={`${metric.color} w-6 h-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

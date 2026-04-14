'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface ComplianceIssue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  framework: string
  location: string
  recommendation: string
}

export default function ComplianceResults() {
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const response = await fetch('http://localhost:8000/analysis')
        const data = await response.json()
        if (data.issues) {
          setIssues(data.issues)
        }
      } catch (error) {
        console.error("Failed to fetch analysis issues", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalysis()
  }, [])
  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const warningCount = issues.filter(i => i.severity === 'warning').length

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertTriangle,
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          badgeBg: 'bg-red-100 dark:bg-red-900/30',
        }
      case 'warning':
        return {
          icon: AlertCircle,
          textColor: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
          badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        }
      default:
        return {
          icon: CheckCircle2,
          textColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          badgeBg: 'bg-green-100 dark:bg-green-900/30',
        }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Analysis Results</h2>
        <p className="text-muted-foreground">
          Found <span className="font-semibold text-red-600 dark:text-red-400">{criticalCount} critical issues</span> and{' '}
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">{warningCount} warnings</span> in your documents
        </p>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => {
          const severity = getSeverityStyles(issue.severity)
          const Icon = severity.icon

          return (
            <Collapsible key={issue.id}>
              <CollapsibleTrigger className={`w-full p-4 rounded-lg border border-border transition-colors hover:border-primary/50 ${severity.bgColor}`}>
                <div className="flex items-start gap-4 group">
                  <Icon className={`${severity.textColor} w-5 h-5 mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{issue.title}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${severity.badgeBg} ${severity.textColor}`}>
                        {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {issue.framework}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 pt-2 border-l-2 border-primary/20">
                <div className="space-y-3 bg-card/50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-foreground">Location</label>
                    <p className="text-sm text-muted-foreground">{issue.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Recommendation</label>
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      Request Clarification
                    </Button>
                    <Button size="sm" variant="outline">
                      Generate Fix
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Share your compliance analysis with stakeholders</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button variant="outline">Export as PDF</Button>
          <Button variant="outline">Export as CSV</Button>
          <Button variant="outline">Share Link</Button>
        </CardContent>
      </Card>
    </div>
  )
}

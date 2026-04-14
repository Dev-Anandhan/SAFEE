'use client'

import { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2, Clock, BarChart3, MessageCircle, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/header'
import Sidebar from '@/components/sidebar'
import DocumentUploadArea from '@/components/document-upload'
import ComplianceResults from '@/components/compliance-results'
import AnalysisMetrics from '@/components/analysis-metrics'
import ComplianceChatbot from '@/components/compliance-chatbot'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'chat' | 'reports'>('upload')
  const [documents, setDocuments] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  const handleDocumentUpload = async (files: File[]) => {
    const newDocs = files.map((file, idx) => ({
      id: Date.now() + idx,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      status: 'analyzing',
      progress: 0,
    }))
    setDocuments(prev => [...prev, ...newDocs])

    // Call the actual backend upload endpoint
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      setDocuments(prev =>
        prev.map(doc => ({ ...doc, status: 'complete', progress: 100 }))
      )
      setAnalysisComplete(true)
      // Auto-switch to analysis tab to show real scan results
      setActiveTab('analysis')
    } catch (error) {
      console.error('Error uploading documents:', error)
      setDocuments(prev =>
        prev.map(doc => ({ ...doc, status: 'error' }))
      )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Document Compliance Analysis</h1>
              <p className="text-muted-foreground">Upload and analyze legal documents for compliance violations and regulatory requirements</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
              {[
                { id: 'upload' as const, label: 'Upload & Analyze', icon: Upload },
                { id: 'analysis' as const, label: 'Analysis Results', icon: BarChart3 },
                { id: 'chat' as const, label: 'Chat Assistant', icon: MessageCircle },
                { id: 'reports' as const, label: 'Reports', icon: FileText },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <DocumentUploadArea onUpload={handleDocumentUpload} />

                {/* Recent Documents */}
                {documents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Uploads</CardTitle>
                      <CardDescription>Documents currently being processed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {documents.slice().reverse().map(doc => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">{doc.name}</p>
                                <p className="text-sm text-muted-foreground">{(doc.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              {doc.status === 'analyzing' && (
                                <>
                                  <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                                  <span className="text-sm text-muted-foreground">Analyzing...</span>
                                </>
                              )}
                              {doc.status === 'complete' && (
                                <>
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  <span className="text-sm text-green-600 dark:text-green-400">Complete</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Analysis Results Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {analysisComplete && documents.length > 0 ? (
                  <>
                    <AnalysisMetrics documentsCount={documents.length} />
                    <ComplianceResults />
                  </>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No analysis results yet. Upload documents to get started.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b border-border">
                  <CardTitle>Compliance Assistant Chat</CardTitle>
                  <CardDescription>Ask questions about your documents and compliance requirements</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ComplianceChatbot documentsUploaded={documents.length > 0 && analysisComplete} />
                </CardContent>
              </Card>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>Create a comprehensive compliance report for your analyzed documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button className="gap-2">
                        <FileText className="w-4 h-4" />
                        Generate PDF Report
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Export Analysis Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Previous Reports</CardTitle>
                    <CardDescription>Your historical compliance reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">No reports generated yet</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

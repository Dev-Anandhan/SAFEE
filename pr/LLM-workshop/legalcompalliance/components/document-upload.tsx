'use client'

import { useRef, useState } from 'react'
import { Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DocumentUploadProps {
  onUpload: (files: File[]) => void
}

export default function DocumentUploadArea({ onUpload }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    if (files.length > 0) {
      onUpload(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onUpload(files)
    }
  }

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Upload Legal Documents</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Supported formats: PDF, DOC, DOCX (Max 50MB per file)
            </p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="gap-2"
          >
            <FileText className="w-5 h-5" />
            Select Files
          </Button>

          <div className="mt-6 pt-6 border-t border-border w-full">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">99.8%</p>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">2M+</p>
                <p className="text-sm text-muted-foreground">Documents Analyzed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">&lt;30s</p>
                <p className="text-sm text-muted-foreground">Processing Time</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

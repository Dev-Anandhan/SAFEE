'use client'

import { useState } from 'react'
import { X, Upload, BarChart3, FileText, Settings, LifeBuoy, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const [complianceOpen, setComplianceOpen] = useState(true)

  const menuItems = [
    { icon: Upload, label: 'Upload Document', href: '#' },
    { icon: BarChart3, label: 'Dashboard', href: '#' },
    { icon: FileText, label: 'My Documents', href: '#' },
  ]

  const complianceOptions = [
    { label: 'GDPR Compliance', href: '#' },
    { label: 'HIPAA Requirements', href: '#' },
    { label: 'SOX Regulations', href: '#' },
    { label: 'CCPA Standards', href: '#' },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 z-40 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Close button (mobile) */}
        <div className="lg:hidden p-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Logo area */}
        <div className="px-6 py-4 hidden lg:block border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center font-bold text-sidebar-primary-foreground">
              CB
            </div>
            <h2 className="font-bold text-sidebar-foreground">ComplianceBot</h2>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent rounded-lg transition-colors group"
              >
                <Icon className="w-5 h-5 group-hover:text-sidebar-primary" />
                <span className="font-medium text-sm">{item.label}</span>
              </a>
            )
          })}

          {/* Compliance Framework Section */}
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <Collapsible open={complianceOpen} onOpenChange={setComplianceOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
                <span className="font-semibold text-sm">Compliance Frameworks</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${complianceOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {complianceOptions.map((option) => (
                  <a
                    key={option.label}
                    href={option.href}
                    className="flex items-center px-4 py-2 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground text-sm hover:bg-sidebar-accent rounded transition-colors"
                  >
                    {option.label}
                  </a>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <Button variant="outline" className="w-full gap-2 justify-start" size="sm">
            <LifeBuoy className="w-4 h-4" />
            Support
          </Button>
          <Button variant="ghost" className="w-full gap-2 justify-start text-sidebar-foreground" size="sm">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <div className="text-xs text-sidebar-foreground/60 px-4 py-2 text-center">
            <p>v0.1.0 - Beta</p>
          </div>
        </div>
      </aside>
    </>
  )
}

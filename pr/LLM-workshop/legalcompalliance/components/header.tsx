import { Menu, Bell, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">
              CB
            </div>
            <div>
              <h1 className="font-bold text-foreground">ComplianceBot</h1>
              <p className="text-xs text-muted-foreground">Government Division</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-medium text-secondary-foreground">
                  JD
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Compliance Officer</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="w-4 h-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Waves, AlertTriangle, BarChart3, Search, MapPin, Shield, Home, Menu, X, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { HybridService } from "@/lib/services/hybridService"
import { offlineStorage } from "@/lib/services/offlineStorage"

export default function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Initialize HybridService and setup online/offline listeners
  useEffect(() => {
    const initializeService = async () => {
      try {
        await HybridService.initialize()
        setIsInitialized(true)
        
        // Check for pending items
        const pending = await offlineStorage.getPendingSyncItems()
        setPendingCount(pending.length)
        console.log(`Found ${pending.length} pending sync items`)
      } catch (error) {
        console.warn('Failed to initialize offline service:', error)
      }
    }

    initializeService()
  }, [])

  useEffect(() => {
    const updateOnlineStatus = async () => {
      const wasOffline = !isOnline
      const nowOnline = navigator.onLine
      setIsOnline(nowOnline)
      
      // If we just came back online, trigger sync
      if (wasOffline && nowOnline && isInitialized) {
        console.log('Navbar: Back online, triggering sync...')
        await performSync()
      }
    }

    // Set initial status
    updateOnlineStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [isOnline, isInitialized])

  // Manual sync function
  const performSync = async () => {
    if (!isInitialized || isSyncing) return
    
    setIsSyncing(true)
    console.log('Manual sync triggered...')
    
    try {
      await HybridService.syncPendingChanges()
      // Refresh pending count after sync
      const pending = await offlineStorage.getPendingSyncItems()
      setPendingCount(pending.length)
      console.log('Manual sync completed successfully')
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getNavButtons = () => {
    switch (pathname) {
      case "/report":
        return [
          { href: "/", label: "Home", icon: Home, active: false, color: "text-primary" },
          { href: "/report", label: "Report Hazard", icon: AlertTriangle, active: true, color: "text-accent" },
        ]
      default:
        // For Home, Dashboard, Search, Map, and Admin pages - show all buttons
        return [
          { href: "/", label: "Home", icon: Home, active: pathname === "/", color: "text-primary" },
          {
            href: "/report",
            label: "Report Hazard",
            icon: AlertTriangle,
            active: pathname === "/report",
            color: "text-accent",
          },
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: BarChart3,
            active: pathname === "/dashboard",
            color: "text-primary",
          },
          { href: "/search", label: "Search", icon: Search, active: pathname === "/search", color: "text-warning" },
          { href: "/map", label: "Map", icon: MapPin, active: pathname === "/map", color: "text-success" },
          { href: "/admin", label: "Admin", icon: Shield, active: pathname === "/admin", color: "text-destructive" },
        ]
    }
  }

  const navButtons = getNavButtons()

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className={`mx-auto py-2 ${pathname === '/map' ? 'px-0' : 'container px-4'}`}>
        <div className={`flex items-center justify-between ${pathname === '/map' ? 'px-4' : ''}`}>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">CascadeVision</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navButtons.map((button) => (
              <Link key={button.href} href={button.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm transition-all duration-200 ${
                    button.active ? `${button.color} bg-current/10 shadow-sm` : `text-muted-foreground`
                  }`}
                >
                  <button.icon className={`h-4 w-4 mr-1 ${button.active ? button.color : ""}`} />
                  {button.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Manual Sync Button - Always visible when online and there's pending data or for manual sync */}
            {isOnline && (
              <button
                onClick={performSync}
                disabled={isSyncing}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                  isSyncing 
                    ? "bg-blue-500 text-white animate-spin" 
                    : pendingCount > 0
                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 shadow-md"
                    : "bg-gray-500 text-white hover:bg-gray-600 shadow-gray-500/20 shadow-md"
                }`}
                title={isSyncing ? "Syncing..." : pendingCount > 0 ? `Sync ${pendingCount} pending items` : "Manual sync"}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {/* Pending sync indicator */}
            {/* {pendingCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                <span>{pendingCount} pending</span>
              </div>
            )} */}
            
            {/* Online/Offline Status Indicator - Always visible on all screen sizes */}
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                isOnline 
                  ? "bg-green-500 text-white shadow-green-500/20 shadow-md" 
                  : "bg-red-500 text-white shadow-red-500/20 shadow-md"
              }`}
              title={isOnline ? "Online" : "Offline"}
            >
              {isOnline ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
            </div>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className={`md:hidden mt-4 pb-4 border-t border-border ${pathname === '/map' ? 'px-4' : ''}`}>
            <div className="flex flex-col gap-2 pt-4">
              {navButtons.map((button) => (
                <Link key={button.href} href={button.href} onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-sm transition-all duration-200 ${
                      button.active ? `${button.color} bg-current/10 shadow-sm` : `text-muted-foreground`
                    }`}
                  >
                    <button.icon className={`h-4 w-4 mr-2 ${button.active ? button.color : ""}`} />
                    {button.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

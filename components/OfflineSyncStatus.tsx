"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw, CheckCircle } from "lucide-react"
import { HybridService } from "@/lib/services/hybridService"
import { offlineStorage } from "@/lib/services/offlineStorage"

export default function OfflineSyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    const initializeService = async () => {
      try {
        await HybridService.initialize()
        setIsInitialized(true)
        
        // Get initial pending count
        const pending = await offlineStorage.getPendingSyncItems()
        setPendingCount(pending.length)
      } catch (error) {
        console.warn('Failed to initialize offline service:', error)
      }
    }

    initializeService()
  }, [])

  useEffect(() => {
    if (!isInitialized) return

    const updateOnlineStatus = async () => {
      const newIsOnline = navigator.onLine
      const wasOffline = !isOnline
      setIsOnline(newIsOnline)

      if (newIsOnline && wasOffline) {
        // Just came back online - start syncing
        setIsSyncing(true)
        try {
          await HybridService.syncPendingChanges()
          const pending = await offlineStorage.getPendingSyncItems()
          setPendingCount(pending.length)
          setLastSyncTime(new Date())
        } catch (error) {
          console.error('Sync failed:', error)
        } finally {
          setIsSyncing(false)
        }
      }

      if (!newIsOnline) {
        // Just went offline - check pending items
        const pending = await offlineStorage.getPendingSyncItems()
        setPendingCount(pending.length)
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
  }, [isInitialized, isOnline])

  if (!isInitialized) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* Online/Offline Status */}
      <div className="mb-2">
        <Badge
          variant={isOnline ? "default" : "secondary"}
          className={`flex items-center gap-1 ${
            isOnline ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"
          } text-white`}
        >
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Sync Status */}
      {isSyncing && (
        <Alert className="border-blue-500/20 bg-blue-500/5 mb-2">
          <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
          <AlertDescription className="text-blue-700 text-xs">
            Syncing pending data...
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Items */}
      {pendingCount > 0 && !isSyncing && (
        <Alert className="border-orange-500/20 bg-orange-500/5 mb-2">
          <WifiOff className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 text-xs">
            {pendingCount} item(s) pending sync
            {!isOnline && " (will sync when online)"}
          </AlertDescription>
        </Alert>
      )}

      {/* Successful Sync */}
      {lastSyncTime && pendingCount === 0 && isOnline && (
        <Alert className="border-green-500/20 bg-green-500/5 mb-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 text-xs">
            All data synced
            <div className="text-xs text-green-600 mt-1">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
"use client"

import { useEffect, useState } from 'react'

interface OfflineProviderProps {
  children: React.ReactNode
}

export default function OfflineProvider({ children }: OfflineProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Initialize offline storage
    const initOfflineStorage = async () => {
      try {
        const { HybridService } = await import('@/lib/services/hybridService')
        await HybridService.initialize()
        setIsInitialized(true)
        console.log('Offline storage initialized successfully')
      } catch (error) {
        console.error('Failed to initialize offline storage:', error)
        setIsInitialized(true) // Still allow app to work
      }
    }

    initOfflineStorage()
  }, [isClient])

  // Don't render anything on server side
  if (!isClient) {
    return <>{children}</>
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Initializing offline capabilities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {children}
    </div>
  )
}

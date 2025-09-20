"use client"

import { useEffect, useRef, useState } from 'react'
import { MapPin, AlertTriangle, Loader2, Shield, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    L: any
  }
}

interface OfflineMapProps {
  hazards: any[]
  onHazardSelect?: (hazard: any) => void
  selectedHazard?: any
  filters?: {
    status: string[]
    severity: string[]
    hazardType: string
  }
  className?: string
}

export default function OfflineMap({ hazards, onHazardSelect, selectedHazard, filters, className }: OfflineMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(true)

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      try {
        setIsMapLoading(true)
        setMapError(null)

        // Load Leaflet CSS and JS dynamically
        await loadLeafletResources()

        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!mapRef.current) return

        // Clear any existing content
        mapRef.current.innerHTML = ""

        // Initialize map
        const map = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5)

        // Add tile layer with offline fallback and caching configuration
        const tileLayer = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          // Enhanced offline fallback with better error handling
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHBhdGggZD0iTTAgMGwyNTYgMjU2TTI1NiAwTDAgMjU2IiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5PZmZsaW5lPC90ZXh0Pjwvc3ZnPg==',
          // Enable cross-origin for caching
          crossOrigin: true
        })

        tileLayer.addTo(map)

        // Enhanced tile error handling for offline mode
        tileLayer.on('tileerror', (e: any) => {
          console.warn('Map tile failed to load (offline mode):', e)
          // In offline mode, this is expected behavior
        })

        // Handle map loading events
        map.on('load', () => {
          console.log('Map loaded successfully')
        })

        mapInstanceRef.current = map
        setIsMapLoading(false)

        // Add markers if hazards are available
        if (hazards.length > 0) {
          updateMapMarkers(map, hazards)
        }
      } catch (error) {
        console.error('Map initialization error:', error)
        setMapError('Map service unavailable. Operating in offline mode.')
        setIsMapLoading(false)
      }
    }

    initMap()
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current && hazards.length > 0) {
      updateMapMarkers(mapInstanceRef.current, hazards)
    }
  }, [hazards, filters])

  const loadLeafletResources = async () => {
    return new Promise<void>((resolve, reject) => {
      // Check if Leaflet is already loaded
      if (window.L) {
        resolve()
        return
      }

      let cssLoaded = false
      let jsLoaded = false
      
      const checkBothLoaded = () => {
        if (cssLoaded && jsLoaded) {
          resolve()
        }
      }

      // Check if CSS already exists
      const existingCSS = document.querySelector('link[href*="leaflet.css"]')
      if (existingCSS) {
        cssLoaded = true
        checkBothLoaded()
      } else {
        // Load CSS
        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        cssLink.crossOrigin = 'anonymous'
        cssLink.onload = () => {
          cssLoaded = true
          checkBothLoaded()
        }
        cssLink.onerror = () => {
          console.warn('Failed to load Leaflet CSS, continuing with basic styling')
          cssLoaded = true // Continue even if CSS fails
          checkBothLoaded()
        }
        document.head.appendChild(cssLink)
      }

      // Check if JS already exists
      const existingScript = document.querySelector('script[src*="leaflet.js"]')
      if (existingScript || window.L) {
        jsLoaded = true
        checkBothLoaded()
      } else {
        // Load JS
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = 'anonymous'
        script.onload = () => {
          jsLoaded = true
          checkBothLoaded()
        }
        script.onerror = () => reject(new Error('Failed to load Leaflet JavaScript library'))
        document.head.appendChild(script)
      }
      
      // Fallback timeout
      setTimeout(() => {
        if (!jsLoaded || !window.L) {
          reject(new Error('Leaflet loading timeout'))
        }
      }, 10000)
    })
  }

  const updateMapMarkers = (map: any, hazardsData: any[]) => {
    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          map.removeLayer(marker)
        } catch (e) {
          console.warn('Error removing marker:', e)
        }
      })
      markersRef.current = []

      // Filter hazards based on current filters
      const filteredHazards = hazardsData.filter(hazard => {
        if (filters?.status && filters.status.length > 0 && !filters.status.includes(hazard.status)) {
          return false
        }
        if (filters?.severity && filters.severity.length > 0 && !filters.severity.includes(hazard.severity)) {
          return false
        }
        if (filters?.hazardType && filters.hazardType !== 'All types' && hazard.hazardType !== filters.hazardType) {
          return false
        }
        return true
      })

      // Add markers for each hazard with coordinates
      const hazardsWithCoordinates = filteredHazards.filter(hazard => 
        hazard.coordinates?.lat && hazard.coordinates?.lng
      )

      hazardsWithCoordinates.forEach(hazard => {
        try {
          const color = getSeverityColor(hazard.severity)
          const statusIcon = getStatusIcon(hazard.status)

          // Create custom icon matching the original implementation
          const icon = window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">${statusIcon}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = window.L.marker([hazard.coordinates.lat, hazard.coordinates.lng], { icon })

          // Enhanced popup content matching original implementation
          marker.bindPopup(`
            <div class="p-1 min-w-[160px]">
              <h3 class="font-medium text-xs mb-1">${hazard.title}</h3>
              <p class="text-xs text-gray-600 mb-1">${hazard.specificLocation || hazard.location}</p>
              <div class="flex gap-1 mb-1">
                <span class="text-xs px-1 py-0.5 rounded ${getSeverityBadgeClass(hazard.severity)}">${hazard.severity}</span>
                <span class="text-xs px-1 py-0.5 rounded ${getStatusBadgeClass(hazard.status)}">${hazard.status}</span>
              </div>
              <p class="text-xs text-gray-500">${hazard.hazardType}</p>
            </div>
          `)

          // Add click handler to select hazard
          marker.on('click', () => {
            if (onHazardSelect) {
              onHazardSelect(hazard)
            }
          })

          marker.addTo(map)
          markersRef.current.push(marker)
        } catch (error) {
          console.warn('Error adding marker for hazard:', hazard._id, error)
        }
      })

      // Fit map to show all markers if any exist
      if (hazardsWithCoordinates.length > 0) {
        try {
          const group = new window.L.featureGroup(markersRef.current)
          map.fitBounds(group.getBounds().pad(0.1))
        } catch (error) {
          console.warn('Error fitting map bounds:', error)
        }
      }
    } catch (error) {
      console.error('Error updating map markers:', error)
    }
  }

  // Helper functions matching the original implementation
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return "#22c55e"
      case "medium":
        return "#eab308"
      case "high":
        return "#f97316"
      case "critical":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
        return "✓"
      case "unverified":
        return "?"
      case "closed":
        return "×"
      default:
        return "?"
    }
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "unverified":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const retryMapLoad = () => {
    setMapError(null)
    setIsMapLoading(true)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
    if (mapRef.current) {
      mapRef.current.innerHTML = ""
    }
    // Retry initialization
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-background/90 rounded-lg ${className || 'h-96'}`}>
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
          <div className="text-xs text-muted-foreground mb-4">
            <p>• Operating in offline mode</p>
            <p>• Map tiles may be cached</p>
            <p>• Hazard data available below</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={retryMapLoad}
            className="bg-transparent"
          >
            Retry Loading Map
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className || ''}`}>
      {isMapLoading && (
        <div className="absolute inset-0 bg-background/90 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading offline map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        id="offline-map"
        className={`w-full rounded-lg border border-border ${className || 'h-96'}`}
        style={{ minHeight: className ? '100%' : '400px' }}
      />
      
      {/* Enhanced offline indicator */}
      <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground border border-border">
        <MapPin className="h-3 w-3 inline mr-1" />
        {hazards.filter(h => h.coordinates?.lat && h.coordinates?.lng).length} of {hazards.length} hazard{hazards.length !== 1 ? 's' : ''} with location
      </div>
      
      {/* Offline mode indicator */}
      <div className="absolute top-2 right-2 bg-warning/10 backdrop-blur-sm px-2 py-1 rounded text-xs text-warning border border-warning/20">
        📶 Offline Mode
      </div>
    </div>
  )
}

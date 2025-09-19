"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapPin, Shield, Clock, Calendar, User, Camera, Filter, X, AlertTriangle, Loader2, Eye } from "lucide-react"
import { type HazardReport, hazardTypes } from "@/lib/models/HazardReport"
import Navbar from "@/components/Navbar"

declare global {
  interface Window {
    L: any
  }
}

export default function MapPage() {
  const [hazards, setHazards] = useState<HazardReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null)
  const [filters, setFilters] = useState({
    status: [] as string[],
    severity: [] as string[],
    hazardType: "All types",
  })
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapInitialized, setMapInitialized] = useState(false)

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/hazards")
        if (!response.ok) {
          throw new Error("Failed to fetch hazards")
        }
        const data = await response.json()
        setHazards(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchHazards()
  }, [])

  useEffect(() => {
    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      initMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [mapInitialized, hazards.length])

  const initMap = async () => {
    if (typeof window !== "undefined" && !mapInitialized) {
      try {
        // Load CSS first
        const existingLink = document.querySelector('link[href*="leaflet.css"]')
        if (!existingLink) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          link.crossOrigin = ""
          document.head.appendChild(link)
          
          // Wait for CSS to load
          await new Promise((resolve, reject) => {
            link.onload = resolve
            link.onerror = () => reject(new Error("Failed to load map styles"))
          })
        }

        // Load JS
        const existingScript = document.querySelector('script[src*="leaflet.js"]')
        if (!existingScript && !window.L) {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          script.crossOrigin = ""
          document.head.appendChild(script)
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = () => reject(new Error("Failed to load map library"))
          })
        }

        // Initialize map
        const L = window.L
        if (!L) {
          throw new Error("Leaflet library not available")
        }

        // Wait for DOM to be ready and map container to exist
        const waitForContainer = () => {
          return new Promise<HTMLElement>((resolve, reject) => {
            const checkContainer = () => {
              const mapContainer = document.getElementById("map")
              if (mapContainer) {
                resolve(mapContainer)
              } else {
                setTimeout(checkContainer, 100)
              }
            }
            checkContainer()
            // Timeout after 5 seconds
            setTimeout(() => reject(new Error("Map container not found")), 5000)
          })
        }

        const mapContainer = await waitForContainer()
        mapContainer.innerHTML = "" // Clear any existing content

        const map = L.map("map").setView([20.5937, 78.9629], 5) // Center on India

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map)

        map.on("tileerror", (e: any) => {
          console.warn("Map tile failed to load:", e)
        })

        setMapInstance(map)
        setMapInitialized(true)

        // Add markers if hazards are available
        if (hazards.length > 0) {
          updateMapMarkers(map, L)
        }
      } catch (err) {
        console.error("Map initialization error:", err)
        setMapError(err instanceof Error ? err.message : "Failed to initialize map")
      }
    }
  }

  useEffect(() => {
    if (mapInstance && window.L && hazards.length > 0 && !mapError && mapInitialized) {
      updateMapMarkers(mapInstance, window.L)
    }
  }, [filters, mapInstance, hazards, mapError, mapInitialized])

  const updateMapMarkers = (map: any, L: any) => {
    try {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer)
        }
      })

      filteredHazards.forEach((hazard: any) => {
        if (!hazard.coordinates || !hazard.coordinates.lat || !hazard.coordinates.lng) {
          return
        }

        const color = getSeverityColor(hazard.severity)
        const statusIcon = getStatusIcon(hazard.status)

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">${statusIcon}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([hazard.coordinates.lat, hazard.coordinates.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 min-w-[200px]">
              <h3 class="font-semibold text-sm mb-1">${hazard.title}</h3>
              <p class="text-xs text-gray-600 mb-1">${hazard.specificLocation || hazard.location}</p>
              <div class="flex gap-1 mb-2">
                <span class="text-xs px-2 py-1 rounded ${getSeverityBadgeClass(hazard.severity)}">${hazard.severity}</span>
                <span class="text-xs px-2 py-1 rounded ${getStatusBadgeClass(hazard.status)}">${hazard.status}</span>
              </div>
              <p class="text-xs mb-2">${hazard.hazardType}</p>
              <a href="/hazard/${hazard._id}" class="text-xs text-blue-600 hover:text-blue-800 underline">View Details</a>
            </div>
          `)
          .on("click", () => setSelectedHazard(hazard))
      })
    } catch (err) {
      console.error("Error updating map markers:", err)
    }
  }

  const statusOptions = ["Verified", "Unverified", "Closed"]
  const severityLevels = ["Low", "Medium", "High", "Critical"]

  const filteredHazards = hazards.filter((hazard) => {
    if (filters.status.length > 0 && !filters.status.includes(hazard.status)) return false
    if (filters.severity.length > 0 && !filters.severity.includes(hazard.severity)) return false
    if (filters.hazardType !== "All types" && hazard.hazardType !== filters.hazardType) return false
    return true
  })

  const hazardsWithCoordinates = filteredHazards.filter(
    (hazard) => hazard.coordinates && hazard.coordinates.lat && hazard.coordinates.lng,
  )

  const clearFilters = () => {
    setFilters({
      status: [],
      severity: [],
      hazardType: "All types",
    })
  }

  const activeFilterCount = Object.values(filters).filter((value) =>
    Array.isArray(value) ? value.length > 0 : value !== "All types",
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-73px)] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading map data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-73px)] items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-500 mb-4">Error loading hazard data: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card/50 overflow-y-auto">
          <div className="p-4">
            {/* Header */}
            <div className="mb-3">
              <h1 className="text-lg font-bold text-balance mb-1">Ocean Hazard Map</h1>
              <p className="text-xs text-muted-foreground text-pretty">
                Interactive map showing ocean hazards and their current status
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Showing {hazardsWithCoordinates.length} of {filteredHazards.length} hazards with coordinates
              </p>
            </div>

            {/* Filters */}
            <Card className="border-border mb-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-3 w-3 text-primary" />
                    Filters
                  </CardTitle>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="bg-transparent text-xs px-2 py-1"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear ({activeFilterCount})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Status Filter */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Status</Label>
                  <div className="space-y-1">
                    {statusOptions.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({ ...prev, status: [...prev.status, status] }))
                            } else {
                              setFilters((prev) => ({ ...prev, status: prev.status.filter((s) => s !== status) }))
                            }
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-xs">
                          <Badge className={`text-xs ${getStatusColor(status)}`}>
                            {status === "Verified" && <Shield className="h-3 w-3 mr-1" />}
                            {status === "Unverified" && <Clock className="h-3 w-3 mr-1" />}
                            {status}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Severity Filter */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Severity</Label>
                  <div className="space-y-1">
                    {severityLevels.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`severity-${level}`}
                          checked={filters.severity.includes(level)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({ ...prev, severity: [...prev.severity, level] }))
                            } else {
                              setFilters((prev) => ({ ...prev, severity: prev.severity.filter((s) => s !== level) }))
                            }
                          }}
                        />
                        <Label htmlFor={`severity-${level}`} className="text-xs">
                          <Badge className={`text-xs ${getSeverityBadge(level)}`}>{level}</Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hazard Type Filter */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Hazard Type</Label>
                  <Select
                    value={filters.hazardType}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, hazardType: value }))}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All types" className="text-xs">
                        All types
                      </SelectItem>
                      {hazardTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Hazard List */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Hazards ({filteredHazards.length})</CardTitle>
                <CardDescription className="text-xs">
                  Click on a hazard to view details and location on map
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredHazards.map((hazard) => (
                  <Card
                    key={hazard._id?.toString()}
                    className={`border-muted cursor-pointer transition-all hover:shadow-md ${
                      selectedHazard?._id?.toString() === hazard._id?.toString() ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedHazard(hazard)}
                  >
                    <CardContent className="px-3">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-xs text-foreground line-clamp-2">{hazard.title}</h4>
                        <div className="flex items-center gap-1 ml-1">
                          <div
                            className="w-2 h-2 rounded-full border border-white"
                            style={{ backgroundColor: getSeverityColor(hazard.severity) }}
                          />
                          {hazard.status === "Verified" ? (
                            <Shield className="h-3 w-3 text-green-600" />
                          ) : hazard.status === "Unverified" ? (
                            <Clock className="h-3 w-3 text-yellow-600" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          {!hazard.coordinates && (
                            <span className="text-xs text-muted-foreground" title="No coordinates available">
                              📍
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{hazard.specificLocation || hazard.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(hazard.dateReported).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredHazards.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No hazards match current filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="h-full">
            <div id="map" className="w-full h-full"></div>
            {mapError && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-background/90 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Map unavailable</p>
                  <p className="text-sm text-muted-foreground">{mapError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      setMapError(null)
                      setMapInitialized(false)
                      // Try to reinitialize
                      const initMap = async () => {
                        try {
                          // Clear the map container
                          const mapContainer = document.getElementById("map")
                          if (mapContainer) {
                            mapContainer.innerHTML = ""
                          }
                          setMapInitialized(false)
                          // Wait a bit then reinitialize
                          setTimeout(() => {
                            window.location.reload()
                          }, 100)
                        } catch (err) {
                          console.error("Retry failed:", err)
                        }
                      }
                      initMap()
                    }}
                  >
                    Retry Loading Map
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Hazard Details */}
          {selectedHazard && (
            <div className="absolute bottom-4 right-8 w-72">
              <Card className="border-border bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm text-balance">{selectedHazard.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getSeverityBadge(selectedHazard.severity)}`}>
                          {selectedHazard.severity}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(selectedHazard.status)}`}>
                          {selectedHazard.status === "Verified" && <Shield className="h-3 w-3 mr-1" />}
                          {selectedHazard.status === "Unverified" && <Clock className="h-3 w-3 mr-1" />}
                          {selectedHazard.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedHazard(null)}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground text-pretty">{selectedHazard.description}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{selectedHazard.specificLocation || selectedHazard.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(selectedHazard.dateReported).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>Reported by {selectedHazard.reportedBy}</span>
                    </div>
                    {selectedHazard.mediaFiles && selectedHazard.mediaFiles.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Camera className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {selectedHazard.mediaFiles.length} media file
                          {selectedHazard.mediaFiles.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {!selectedHazard.coordinates && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>No coordinates available</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-1">
                    <Link href={`/hazard/${selectedHazard._id}`}>
                      <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View Full Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

const getSeverityBadge = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "low":
      return "bg-success/10 text-success border-success/20"
    case "medium":
      return "bg-warning/10 text-warning border-warning/20"
    case "high":
      return "bg-orange-500/10 text-orange-700 border-orange-200"
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/20"
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-200"
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "verified":
      return "bg-success/10 text-success border-success/20"
    case "unverified":
      return "bg-warning/10 text-warning border-warning/20"
    case "closed":
      return "bg-muted/10 text-muted-foreground border-muted/20"
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-200"
  }
}

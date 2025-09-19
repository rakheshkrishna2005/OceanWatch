"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import HazardDetailModal from "@/components/HazardDetailModal"
import Navbar from "@/components/Navbar"
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  AlertTriangle,
  Shield,
  Clock,
  Eye,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react"

interface HazardReport {
  _id: string
  title: string
  description: string
  location: string
  specificLocation: string
  hazardType: string
  severity: string
  status: string
  dateReported: string
  reportedBy: string
  coordinates?: { lat: number; lng: number }
  mediaFiles?: string[]
  createdAt: string
  updatedAt: string
}

export default function SearchPage() {
  const [hazards, setHazards] = useState<HazardReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    location: "",
    hazardType: "",
    dateFrom: "",
    dateTo: "",
    severity: [] as string[],
    status: [] as string[],
  })
  const [showFilters, setShowFilters] = useState(false)
  const [displayCount, setDisplayCount] = useState(10)
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

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
        setError(err instanceof Error ? err.message : "Failed to load hazards")
      } finally {
        setLoading(false)
      }
    }

    fetchHazards()
  }, [])

  const hazardTypes = [
    "Oil Spill",
    "Chemical Contamination",
    "Marine Debris",
    "Harmful Algal Bloom",
    "Dead Marine Life",
    "Coastal Erosion",
    "Pollution Discharge",
    "Abandoned Vessel",
    "Fishing Net Entanglement",
  ]

  const locations = [
    "Pacific Coast",
    "Atlantic Coast",
    "Gulf Coast",
    "Great Lakes",
    "San Francisco Bay",
    "Florida Keys",
  ]

  const severityLevels = ["Low", "Medium", "High", "Critical"]
  const statusOptions = ["Unverified", "Verified", "Closed"]

  const filteredHazards = useMemo(() => {
    const filtered = hazards.filter((hazard) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          hazard.title.toLowerCase().includes(query) ||
          hazard.description.toLowerCase().includes(query) ||
          hazard.location.toLowerCase().includes(query) ||
          hazard.hazardType.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Location filter
      if (filters.location && hazard.location !== filters.location) return false

      // Hazard type filter
      if (filters.hazardType && hazard.hazardType !== filters.hazardType) return false

      // Date filters
      if (filters.dateFrom && hazard.dateReported < filters.dateFrom) return false
      if (filters.dateTo && hazard.dateReported > filters.dateTo) return false

      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(hazard.severity)) return false

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(hazard.status)) return false

      return true
    })

    // Sort by severity (Critical > High > Medium > Low) and then by date
    const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    filtered.sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity as keyof typeof severityOrder] -
        severityOrder[a.severity as keyof typeof severityOrder]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime()
    })

    return filtered
  }, [hazards, searchQuery, filters])

  const displayedHazards = filteredHazards.slice(0, displayCount)

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      case "high":
        return "bg-orange-500/10 text-orange-700 border-orange-200"
      case "critical":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "unverified":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      case "closed":
        return "bg-gray-500/10 text-gray-700 border-gray-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  const clearFilters = () => {
    setFilters({
      location: "",
      hazardType: "",
      dateFrom: "",
      dateTo: "",
      severity: [],
      status: [],
    })
    setSearchQuery("")
  }

  const activeFilterCount =
    Object.values(filters).filter((value) => (Array.isArray(value) ? value.length > 0 : value !== "")).length +
    (searchQuery ? 1 : 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading hazard reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-balance mb-1">Search Ocean Hazards</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Find and filter hazard reports by location, type, date, and severity
          </p>
        </div>

        {/* Search and Filter Controls */}
        <Card className="border-border mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Search & Filter
              </CardTitle>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All ({activeFilterCount})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hazards by title, description, location, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-border">
                {/* Location Filter */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={filters.location}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hazard Type Filter */}
                <div className="space-y-2">
                  <Label>Hazard Type</Label>
                  <Select
                    value={filters.hazardType}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, hazardType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {hazardTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                      placeholder="From"
                    />
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                      placeholder="To"
                    />
                  </div>
                </div>

                {/* Severity Filter */}
                <div className="space-y-2">
                  <Label>Severity Level</Label>
                  <div className="space-y-2">
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
                        <Label htmlFor={`severity-${level}`} className="text-sm">
                          <Badge className={`text-xs ${getSeverityColor(level)}`}>{level}</Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="space-y-2">
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
                        <Label htmlFor={`status-${status}`} className="text-sm">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              Showing {displayedHazards.length} of {filteredHazards.length} hazards
            </p>
            {activeFilterCount > 0 && (
              <Badge variant="outline" className="px-2 py-1">
                {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            Sorted by severity & date
          </Badge>
        </div>

        {/* Hazard Cards */}
        <div className="space-y-4">
          {displayedHazards.map((hazard) => (
            <Card key={hazard._id} className="border-border transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{hazard.title}</h3>
                      <Badge className={`text-xs ${getSeverityColor(hazard.severity)}`}>{hazard.severity}</Badge>
                      <Badge className={`text-xs ${getStatusColor(hazard.status)}`}>
                        {hazard.status === "Verified" && <Shield className="h-3 w-3 mr-1" />}
                        {hazard.status === "Unverified" && <Clock className="h-3 w-3 mr-1" />}
                        {hazard.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-pretty mb-4">{hazard.description}</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{hazard.specificLocation || hazard.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(hazard.dateReported).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{hazard.hazardType}</span>
                      </div>
                      <span>Reported by {hazard.reportedBy}</span>
                      {hazard.mediaFiles && hazard.mediaFiles.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {hazard.mediaFiles.length} media file{hazard.mediaFiles.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4 bg-transparent"
                    onClick={() => {
                      setSelectedHazardId(hazard._id)
                      setIsDetailModalOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        {displayCount < filteredHazards.length && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDisplayCount((prev) => prev + 10)}
              className="bg-transparent"
            >
              Load More Hazards ({filteredHazards.length - displayCount} remaining)
            </Button>
          </div>
        )}

        {/* No Results */}
        {filteredHazards.length === 0 && (
          <Card className="border-border text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hazards found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters to find more results.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Hazard Detail Modal */}
        <HazardDetailModal
          hazardId={selectedHazardId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedHazardId(null)
          }}
        />
      </div>
    </div>
  )
}

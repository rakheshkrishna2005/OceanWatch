"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { AlertTriangle, Shield, Clock, MapPin, CheckCircle, Search, Eye, BarChart3, Loader2 } from "lucide-react"
import Navbar from "@/components/Navbar"
import HazardDetailModal from "@/components/HazardDetailModal"

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

interface KPIData {
  totalReports: number
  verifiedReports: number
  pendingVerification: number
  closedReports: number
  activeLocations: number
  criticalHazards: number
}

interface ChartData {
  hazardsByType: Array<{ name: string; value: number; fill: string }>
  hazardsByStatus: Array<{ name: string; value: number; fill: string }>
  hazardsBySeverity: Array<{ name: string; value: number; fill: string }>
}

export default function DashboardPage() {
  const [hazards, setHazards] = useState<HazardReport[]>([])
  const [recentHazards, setRecentHazards] = useState<HazardReport[]>([])
  const [kpis, setKPIs] = useState<KPIData | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch all hazards for KPIs and charts
        const hazardsRes = await fetch("/api/hazards")
        if (!hazardsRes.ok) {
          throw new Error("Failed to fetch hazards data")
        }
        const hazardsList = await hazardsRes.json()
        setHazards(hazardsList)
        
        // Fetch recent 5 hazards sorted by date (optimized query)
        const recentHazardsRes = await fetch("/api/hazards?limit=5&sortBy=dateReported&sortOrder=desc")
        if (!recentHazardsRes.ok) {
          throw new Error("Failed to fetch recent hazards")
        }
        const recentHazardsList = await recentHazardsRes.json()
        setRecentHazards(recentHazardsList)

        const totalReports = hazardsList.length
        const verifiedReports = hazardsList.filter((h: HazardReport) => h.status === "Verified").length
        const pendingVerification = hazardsList.filter((h: HazardReport) => h.status === "Unverified").length
        const closedReports = hazardsList.filter((h: HazardReport) => h.status === "Closed").length
        const activeLocations = new Set(hazardsList.map((h: HazardReport) => h.location)).size
        const criticalHazards = hazardsList.filter((h: HazardReport) => h.severity === "Critical").length

        setKPIs({
          totalReports,
          verifiedReports,
          pendingVerification,
          closedReports,
          activeLocations,
          criticalHazards,
        })

        // Generate chart data from hazards
        const typeCount = hazardsList.reduce((acc: any, hazard: HazardReport) => {
          acc[hazard.hazardType] = (acc[hazard.hazardType] || 0) + 1
          return acc
        }, {})

        const statusCount = hazardsList.reduce((acc: any, hazard: HazardReport) => {
          acc[hazard.status] = (acc[hazard.status] || 0) + 1
          return acc
        }, {})

        const severityCount = hazardsList.reduce((acc: any, hazard: HazardReport) => {
          acc[hazard.severity] = (acc[hazard.severity] || 0) + 1
          return acc
        }, {})

        // Define color palettes
        const hazardTypeColors = {
          "Oil Spill": "#ef4444", // Red
          "Chemical Contamination": "#f97316", // Orange
          "Marine Debris": "#eab308", // Yellow
          "Harmful Algal Bloom": "#22c55e", // Green
          "Dead Marine Life": "#6b7280", // Gray
          "Coastal Erosion": "#8b5cf6", // Purple
          "Sewage Discharge": "#ec4899", // Pink
          "Abandoned Vessel": "#06b6d4", // Cyan
          "Fishing Net Entanglement": "#84cc16", // Lime
          "Coral Bleaching": "#f59e0b", // Amber
          "Microplastic Contamination": "#10b981", // Emerald
          "Industrial Effluent": "#3b82f6", // Blue
        }

        setChartData({
          hazardsByType: Object.entries(typeCount).map(([name, value], index) => ({
            name,
            value: value as number,
            fill: hazardTypeColors[name as keyof typeof hazardTypeColors] || `hsl(${(index * 360) / Object.keys(typeCount).length}, 70%, 50%)`,
          })),
          hazardsByStatus: Object.entries(statusCount).map(([name, value]) => ({
            name,
            value: value as number,
            fill: name === "Verified" ? "#22c55e" : name === "Unverified" ? "#eab308" : "#6b7280",
          })),
          hazardsBySeverity: Object.entries(severityCount).map(([name, value]) => ({
            name,
            value: value as number,
            fill:
              name === "Critical" ? "#ef4444" : name === "High" ? "#f97316" : name === "Medium" ? "#eab308" : "#22c55e",
          })),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const locationData = hazards.reduce((acc: any[], hazard) => {
    const existing = acc.find((item) => item.name === hazard.location)
    if (existing) {
      existing.activeReports += 1
      if (hazard.status === "Verified") existing.verifiedReports += 1
      if (hazard.status === "Unverified") existing.unverifiedReports += 1
      existing.hazards.push(hazard)
    } else {
      acc.push({
        id: acc.length + 1,
        name: hazard.location,
        activeReports: 1,
        verifiedReports: hazard.status === "Verified" ? 1 : 0,
        unverifiedReports: hazard.status === "Unverified" ? 1 : 0,
        severity: hazard.severity,
        lastUpdated: new Date(hazard.dateReported).toLocaleDateString(),
        hazards: [hazard],
      })
    }
    return acc
  }, [])

  const filteredLocationData = locationData.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getSeverityBadge = (severity: string) => {
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
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-red-500 mb-4">Error loading dashboard: {error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!kpis || !chartData) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-balance mb-1">Ocean Hazard Dashboard</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Real-time monitoring and analytics for ocean safety incidents
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <Card className="border-border transition-shadow border-accent/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Reports</CardTitle>
                <AlertTriangle className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-accent">{kpis.totalReports}</div>
            </CardContent>
          </Card>

          <Card className="border-border transition-shadow border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Verified Reports</CardTitle>
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{kpis.verifiedReports}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs px-2 py-0">
                  {kpis.totalReports > 0 ? Math.round((kpis.verifiedReports / kpis.totalReports) * 100) : 0}% verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border transition-shadow border-yellow-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pending Verification</CardTitle>
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-yellow-600">{kpis.pendingVerification}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200 text-xs px-2 py-0">
                  Needs Review
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border transition-shadow border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Active Locations</CardTitle>
                <MapPin className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-primary">{kpis.activeLocations}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0">Monitoring</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border transition-shadow border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">Issues Closed</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{kpis.closedReports}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs px-2 py-0">Resolved</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Hazard Types Chart */}
          <Card className="border-border border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-primary">
                <BarChart3 className="h-5 w-5 text-primary" />
                Hazards by Type
              </CardTitle>
              <CardDescription className="text-xs">Distribution of different hazard types reported</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.hazardsByType}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-border border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-accent">
                <AlertTriangle className="h-5 w-5 text-accent" />
                Status Distribution
              </CardTitle>
              <CardDescription className="text-xs">Breakdown of hazard verification status</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.hazardsByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, payload }: any) => {
                      const total = chartData.hazardsByStatus.reduce((sum, item) => sum + item.value, 0)
                      const percent = ((value / total) * 100).toFixed(0)
                      return `${name} ${percent}%`
                    }}
                  >
                    {chartData.hazardsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Hazards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Recent Hazards */}
          <Card className="border-border border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-accent">
                <AlertTriangle className="h-5 w-5 text-accent" />
                Recent Hazards
              </CardTitle>
              <CardDescription className="text-xs">Latest reported hazards requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentHazards.map((hazard) => (
                  <Card key={hazard._id} className="border-muted transition-shadow hover:shadow-md cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-foreground truncate">{hazard.title}</h4>
                            <Badge className={`text-xs ${getSeverityBadge(hazard.severity)}`}>
                              {hazard.severity}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{hazard.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(hazard.dateReported).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 bg-transparent"
                          onClick={() => {
                            setSelectedHazardId(hazard._id)
                            setIsDetailModalOpen(true)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {recentHazards.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No hazards reported yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Cards */}
          <Card className="border-border border-green-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base text-green-600">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Active Hazard Locations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Locations with active reports and their current status
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      className="pl-7 w-full sm:w-48 text-xs"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {filteredLocationData.slice(0, 6).map((location) => (
                <Card key={location.id} className="border-muted transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm text-foreground truncate">{location.name}</h3>
                          <Badge className={`text-xs px-2 py-1 w-fit ${getSeverityBadge(location.severity)}`}>
                            {location.severity}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2 lg:gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            <span className="truncate">{location.activeReports} active</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                            <span className="truncate">{location.verifiedReports} verified</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-600 rounded-full flex-shrink-0" />
                            <span className="truncate">{location.unverifiedReports} unverified</span>
                          </div>
                          <span className="text-xs col-span-2 sm:col-span-3 lg:col-span-1">Updated {location.lastUpdated}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Verification Progress</span>
                            <span>{Math.round((location.verifiedReports / location.activeReports) * 100)}%</span>
                          </div>
                          <Progress value={(location.verifiedReports / location.activeReports) * 100} className="h-1.5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end lg:justify-center gap-2 lg:ml-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs bg-transparent h-8 px-3 sm:h-9 sm:px-4 whitespace-nowrap"
                          onClick={() => {
                            // Show the first hazard from this location
                            const firstHazard = location.hazards[0]
                            if (firstHazard) {
                              setSelectedHazardId(firstHazard._id)
                              setIsDetailModalOpen(true)
                            }
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredLocationData.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No locations found matching your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
        
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

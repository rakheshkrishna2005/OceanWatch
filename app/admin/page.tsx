"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import HazardDetailModal from "@/components/HazardDetailModal"
import Navbar from "@/components/Navbar"
import {
  Shield,
  Clock,
  CheckCircle,
  X,
  Search,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  Camera,
  FileText,
  Eye,
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
  contactEmail?: string
  contactPhone?: string
  coordinates?: { lat: number; lng: number }
  mediaFiles?: string[]
  priority?: string
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const [reports, setReports] = useState<HazardReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    status: "All",
    severity: "All",
    priority: "All",
  })
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/hazards")
        if (!response.ok) {
          throw new Error("Failed to fetch reports")
        }
        const data = await response.json()
        setReports(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const filteredReports = reports.filter((report) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.location.toLowerCase().includes(query) ||
        report.hazardType.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Status filter for tabs
    if (activeTab === "pending" && report.status !== "Unverified") return false
    if (activeTab === "verified" && report.status !== "Verified") return false
    if (activeTab === "closed" && report.status !== "Closed") return false

    // Additional filters
    if (filters.status !== "All" && report.status !== filters.status) return false
    if (filters.severity !== "All" && report.severity !== filters.severity) return false
    if (filters.priority !== "All" && report.priority !== filters.priority) return false

    return true
  })

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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "medium":
        return "bg-purple-500/10 text-purple-700 border-purple-200"
      case "high":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/hazards/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      // Update local state
      setReports((prev) => prev.map((report) => (report._id === reportId ? { ...report, status: newStatus } : report)))

      alert(`Report status changed to ${newStatus}`)
    } catch (err) {
      alert("Failed to update report status")
    }
  }

  const pendingCount = reports.filter((r) => r.status === "Unverified").length
  const verifiedCount = reports.filter((r) => r.status === "Verified").length
  const closedCount = reports.filter((r) => r.status === "Closed").length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
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

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Admin Verification Panel</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Review, verify, and manage ocean hazard reports from the community
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Verification</p>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verified Reports</p>
                  <p className="text-2xl font-bold text-foreground">{verifiedCount}</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Closed Issues</p>
                  <p className="text-2xl font-bold text-foreground">{closedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search & Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search Reports</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title, location, type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Severity</Label>
                <Select
                  value={filters.severity}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Severities</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Priorities</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Verified ({verifiedCount})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Closed ({closedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Alert className="border-warning/20 bg-warning/5">
              <Clock className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning-foreground">
                These reports are awaiting professional verification. Review each report carefully and update their
                status accordingly.
              </AlertDescription>
            </Alert>
            {filteredReports.map((report) => (
              <ReportCard 
                key={report._id} 
                report={report} 
                onStatusChange={handleStatusChange}
                onViewDetails={(id) => {
                  setSelectedHazardId(id)
                  setIsDetailModalOpen(true)
                }}
              />
            ))}
          </TabsContent>

          <TabsContent value="verified" className="space-y-4">
            <Alert className="border-success/20 bg-success/5">
              <Shield className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">
                These reports have been verified as legitimate hazards and are actively being monitored.
              </AlertDescription>
            </Alert>
            {filteredReports.map((report) => (
              <ReportCard 
                key={report._id} 
                report={report} 
                onStatusChange={handleStatusChange}
                onViewDetails={(id) => {
                  setSelectedHazardId(id)
                  setIsDetailModalOpen(true)
                }}
              />
            ))}
          </TabsContent>

          <TabsContent value="closed" className="space-y-4">
            <Alert className="border-muted-foreground/20 bg-muted/10">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription>
                These issues have been resolved or are no longer active threats to ocean safety.
              </AlertDescription>
            </Alert>
            {filteredReports.map((report) => (
              <ReportCard 
                key={report._id} 
                report={report} 
                onStatusChange={handleStatusChange}
                onViewDetails={(id) => {
                  setSelectedHazardId(id)
                  setIsDetailModalOpen(true)
                }}
              />
            ))}
          </TabsContent>
        </Tabs>

        {filteredReports.length === 0 && (
          <Card className="border-border text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
              <p className="text-muted-foreground">No reports match your current search criteria or tab selection.</p>
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

function ReportCard({
  report,
  onStatusChange,
  onViewDetails,
}: { 
  report: HazardReport; 
  onStatusChange: (id: string, status: string) => void;
  onViewDetails: (id: string) => void;
}) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "medium":
        return "bg-purple-500/10 text-purple-700 border-purple-200"
      case "high":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="border-border transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{report.title}</h3>
              <Badge className={`text-xs ${getSeverityColor(report.severity)}`}>{report.severity}</Badge>
              <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                {report.status === "Verified" && <Shield className="h-3 w-3 mr-1" />}
                {report.status === "Unverified" && <Clock className="h-3 w-3 mr-1" />}
                {report.status === "Closed" && <CheckCircle className="h-3 w-3 mr-1" />}
                {report.status}
              </Badge>
              {report.priority && (
                <Badge className={`text-xs ${getPriorityColor(report.priority)}`}>{report.priority} Priority</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-pretty mb-4">{report.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{report.specificLocation || report.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(report.dateReported).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{report.hazardType}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Reported by {report.reportedBy}</span>
                </div>
                {report.contactEmail && (
                  <div className="flex items-center gap-1">
                    <span>📧 {report.contactEmail}</span>
                  </div>
                )}
                {report.contactPhone && (
                  <div className="flex items-center gap-1">
                    <span>📞 {report.contactPhone}</span>
                  </div>
                )}
                {report.mediaFiles && report.mediaFiles.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Camera className="h-4 w-4" />
                    <span>
                      {report.mediaFiles.length} media file{report.mediaFiles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onViewDetails(report._id)}>
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {report.status === "Unverified" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onStatusChange(report._id, "Verified")}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Verify
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange(report._id, "Closed")}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {report.status === "Verified" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(report._id, "Closed")}
                className="text-gray-600 hover:text-gray-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Closed
              </Button>
            )}
            {report.status === "Closed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(report._id, "Verified")}
                className="text-green-600 hover:text-green-700"
              >
                <Shield className="h-4 w-4 mr-1" />
                Reopen
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

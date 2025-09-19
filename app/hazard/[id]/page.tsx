"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Camera,
  Video,
  Shield,
  Clock,
  CheckCircle,
  Waves,
  Loader2,
  Download,
  ExternalLink,
} from "lucide-react"
import dynamic from "next/dynamic"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

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
  createdAt: string
  updatedAt: string
}

export default function HazardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [hazard, setHazard] = useState<HazardReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    const fetchHazard = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/hazards/${params.id}`)
        if (!response.ok) {
          throw new Error("Hazard not found")
        }
        const data = await response.json()
        setHazard(data.hazard)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hazard details")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchHazard()
    }
  }, [params.id])

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

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()
    if (["mp4", "avi", "mov", "wmv"].includes(extension || "")) {
      return <Video className="h-4 w-4" />
    }
    return <Camera className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading hazard details...</p>
        </div>
      </div>
    )
  }

  if (error || !hazard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || "Hazard not found"}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.back()}>Go Back</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Waves className="h-6 w-6 text-primary" />
                <span className="font-semibold text-foreground">OceanGuard</span>
              </Link>
              <Badge variant="secondary" className="px-3 py-1">
                Hazard Details
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-balance">{hazard.title}</h1>
            <Badge className={`text-sm ${getSeverityColor(hazard.severity)}`}>{hazard.severity}</Badge>
            <Badge className={`text-sm ${getStatusColor(hazard.status)}`}>
              {hazard.status === "Verified" && <Shield className="h-4 w-4 mr-1" />}
              {hazard.status === "Unverified" && <Clock className="h-4 w-4 mr-1" />}
              {hazard.status === "Closed" && <CheckCircle className="h-4 w-4 mr-1" />}
              {hazard.status}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground text-pretty">{hazard.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Hazard Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Hazard Type</p>
                    <p className="text-foreground">{hazard.hazardType}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Severity Level</p>
                    <Badge className={getSeverityColor(hazard.severity)}>{hazard.severity}</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(hazard.status)}>
                      {hazard.status === "Verified" && <Shield className="h-3 w-3 mr-1" />}
                      {hazard.status === "Unverified" && <Clock className="h-3 w-3 mr-1" />}
                      {hazard.status === "Closed" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {hazard.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Date Reported</p>
                    <p className="text-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(hazard.dateReported).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">General Location</p>
                    <p className="text-foreground">{hazard.location}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Specific Location</p>
                    <p className="text-foreground">{hazard.specificLocation || "Not specified"}</p>
                  </div>
                  {hazard.coordinates && (
                    <div className="md:col-span-2 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Coordinates</p>
                      <p className="text-foreground font-mono">
                        {hazard.coordinates.lat.toFixed(6)}, {hazard.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Map */}
                {hazard.coordinates && !mapError ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Location on Map</p>
                    <div className="h-64 rounded-lg overflow-hidden border border-border">
                      <MapContainer
                        center={[hazard.coordinates.lat, hazard.coordinates.lng]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        onError={() => setMapError(true)}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[hazard.coordinates.lat, hazard.coordinates.lng]}>
                          <Popup>
                            <div className="text-center">
                              <p className="font-semibold">{hazard.title}</p>
                              <p className="text-sm text-muted-foreground">{hazard.specificLocation}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                ) : hazard.coordinates && mapError ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Location on Map</p>
                    <div className="h-64 rounded-lg border border-border bg-muted/10 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Map unavailable</p>
                        <p className="text-sm text-muted-foreground">
                          Coordinates: {hazard.coordinates.lat.toFixed(6)}, {hazard.coordinates.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Location on Map</p>
                    <div className="h-64 rounded-lg border border-border bg-muted/10 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No coordinates provided</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Files */}
            {hazard.mediaFiles && hazard.mediaFiles.length > 0 ? (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Media Files ({hazard.mediaFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hazard.mediaFiles.map((fileId, index) => (
                      <div key={fileId} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getFileIcon(`file-${index}`)}
                            <span className="text-sm font-medium">Media File {index + 1}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/api/files/${fileId}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/api/files/${fileId}?download=true`} download>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="bg-muted/10 rounded-md h-32 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">Media preview unavailable</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Media Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No media files attached to this report</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reporter Information */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Reporter Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Reported By</p>
                  <p className="text-foreground">{hazard.reportedBy}</p>
                </div>
                {hazard.contactEmail && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {hazard.contactEmail}
                    </p>
                  </div>
                )}
                {hazard.contactPhone && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-foreground flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {hazard.contactPhone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-foreground text-sm">{new Date(hazard.createdAt).toLocaleString()}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-foreground text-sm">{new Date(hazard.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/search">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View All Hazards
                  </Button>
                </Link>
                <Link href="/report">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report New Hazard
                  </Button>
                </Link>
                {hazard.coordinates && (
                  <Link href={`/map?lat=${hazard.coordinates.lat}&lng=${hazard.coordinates.lng}&zoom=13`}>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Map
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

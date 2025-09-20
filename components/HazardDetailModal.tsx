"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
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
  Loader2,
  Download,
  ExternalLink,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react"

interface HazardReport {
  _id: string
  title: string
  description: string
  location: string
  specificLocation?: string
  hazardType: string
  severity: string
  status: string
  dateReported: string
  reportedBy: string
  coordinates?: { lat: number; lng: number }
  mediaFiles?: string[]
  contactInfo?: {
    name: string
    email: string
    phone: string
  }
  createdAt: string
  updatedAt: string
}

interface HazardDetailModalProps {
  hazardId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function HazardDetailModal({ hazardId, isOpen, onClose }: HazardDetailModalProps) {
  const [hazard, setHazard] = useState<HazardReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [mediaMetadata, setMediaMetadata] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    const fetchHazard = async () => {
      if (!hazardId || !isOpen) return

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/hazards/${hazardId}`)
        if (!response.ok) {
          throw new Error("Hazard not found")
        }
        const data = await response.json()
        setHazard(data.hazard)
        
        // Fetch metadata for each media file
        if (data.hazard.mediaFiles && data.hazard.mediaFiles.length > 0) {
          const metadataPromises = data.hazard.mediaFiles.map(async (fileId: string) => {
            try {
              const metaResponse = await fetch(`/api/files/${fileId}/metadata`)
              if (metaResponse.ok) {
                const metadata = await metaResponse.json()
                return { [fileId]: metadata }
              }
            } catch (err) {
              console.warn(`Failed to fetch metadata for file ${fileId}:`, err)
            }
            return { [fileId]: null }
          })
          
          const metadataResults = await Promise.all(metadataPromises)
          const combinedMetadata = metadataResults.reduce((acc, curr) => ({ ...acc, ...curr }), {})
          setMediaMetadata(combinedMetadata)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hazard details")
        setHazard(null)
      } finally {
        setLoading(false)
      }
    }

    fetchHazard()
  }, [hazardId, isOpen])

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
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
    switch (status?.toLowerCase()) {
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

  const getFileIcon = (filename: string, contentType?: string) => {
    // Check content type first, then fall back to filename extension
    const isVideo = contentType?.startsWith('video/') || 
                   ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'flv', '3gp', 'm4v'].includes(
                     filename?.split('.').pop()?.toLowerCase() || ''
                   )
    
    const isImage = contentType?.startsWith('image/') || 
                   ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heic', 'raw'].includes(
                     filename?.split('.').pop()?.toLowerCase() || ''
                   )
    
    if (isVideo) {
      return <Video className="h-4 w-4" />
    }
    if (isImage) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <Camera className="h-4 w-4" />
  }

  const isVideoFile = (filename: string, contentType?: string) => {
    return contentType?.startsWith('video/') || 
           ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'flv', '3gp', 'm4v'].includes(
             filename?.split('.').pop()?.toLowerCase() || ''
           )
  }

  const isImageFile = (filename: string, contentType?: string) => {
    return contentType?.startsWith('image/') || 
           ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heic', 'raw'].includes(
             filename?.split('.').pop()?.toLowerCase() || ''
           )
  }

  const nextMedia = () => {
    if (hazard?.mediaFiles && currentMediaIndex < hazard.mediaFiles.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1)
    }
  }

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1)
    }
  }

  const goToMedia = (index: number) => {
    setCurrentMediaIndex(index)
  }

  const DataRow = ({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-foreground text-right">
        {value || <span className="text-muted-foreground italic">Data not found</span>}
      </span>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            Hazard Details
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading hazard details...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => setError(null)}>Try Again</Button>
            </div>
          </div>
        )}

        {hazard && !loading && !error && (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-balance">{hazard.title}</h2>
                <Badge className={`text-sm ${getSeverityColor(hazard.severity)}`}>
                  {hazard.severity || "Unknown Severity"}
                </Badge>
                <Badge className={`text-sm ${getStatusColor(hazard.status)}`}>
                  {hazard.status === "Verified" && <Shield className="h-3 w-3 mr-1" />}
                  {hazard.status === "Unverified" && <Clock className="h-3 w-3 mr-1" />}
                  {hazard.status === "Closed" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {hazard.status || "Unknown Status"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-pretty">
                {hazard.description || "No description provided"}
              </p>
            </div>

            {/* All Details in Row Format */}
            <Card className="border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Hazard Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <DataRow 
                  label="Hazard Type" 
                  value={hazard.hazardType} 
                  icon={<AlertTriangle className="h-4 w-4" />} 
                />
                <DataRow 
                  label="Severity Level" 
                  value={hazard.severity}
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
                <DataRow 
                  label="Current Status" 
                  value={hazard.status}
                  icon={hazard.status === "Verified" ? <Shield className="h-4 w-4" /> : 
                        hazard.status === "Unverified" ? <Clock className="h-4 w-4" /> : 
                        <CheckCircle className="h-4 w-4" />}
                />
                <DataRow 
                  label="Date Reported" 
                  value={hazard.dateReported ? new Date(hazard.dateReported).toLocaleDateString() : undefined}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DataRow 
                  label="Location" 
                  value={hazard.location} 
                  icon={<MapPin className="h-4 w-4" />} 
                />
                {hazard.coordinates ? (
                  <DataRow 
                    label="Coordinates" 
                    value={`${hazard.coordinates.lat.toFixed(6)}, ${hazard.coordinates.lng.toFixed(6)}`}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                ) : (
                  <DataRow 
                    label="Coordinates" 
                    value={undefined}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                )}
                <DataRow 
                  label="Reported By" 
                  value={hazard.reportedBy} 
                  icon={<User className="h-4 w-4" />} 
                />
                <DataRow 
                  label="Contact Name" 
                  value={hazard.contactInfo?.name} 
                  icon={<User className="h-4 w-4" />} 
                />
                <DataRow 
                  label="Contact Email" 
                  value={hazard.contactInfo?.email} 
                  icon={<Mail className="h-4 w-4" />} 
                />
                <DataRow 
                  label="Contact Phone" 
                  value={hazard.contactInfo?.phone} 
                  icon={<Phone className="h-4 w-4" />} 
                />
                <DataRow 
                  label="Created" 
                  value={hazard.createdAt ? new Date(hazard.createdAt).toLocaleString() : undefined}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DataRow 
                  label="Last Updated" 
                  value={hazard.updatedAt ? new Date(hazard.updatedAt).toLocaleString() : undefined}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </CardContent>
            </Card>

            {/* Media Files */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Media Files {hazard.mediaFiles?.length ? `(${hazard.mediaFiles.length})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hazard.mediaFiles && hazard.mediaFiles.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Media Display */}
                    <div className="relative">
                      <div className="bg-black rounded-lg overflow-hidden min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] flex items-center justify-center">
                        {(() => {
                          const currentFileId = hazard.mediaFiles[currentMediaIndex]
                          const metadata = mediaMetadata[currentFileId]
                          const filename = metadata?.filename || `media-${currentMediaIndex + 1}`
                          const contentType = metadata?.contentType
                          
                          if (isImageFile(filename, contentType)) {
                            return (
                              <img
                                src={`/api/files/${currentFileId}`}
                                alt={`Media ${currentMediaIndex + 1}`}
                                className="max-w-full max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh] object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            )
                          } else if (isVideoFile(filename, contentType)) {
                            return (
                              <video
                                src={`/api/files/${currentFileId}`}
                                controls
                                className="max-w-full max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh] w-auto"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            )
                          } else {
                            return (
                              <div className="text-center text-white p-4 sm:p-8">
                                <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-sm sm:text-lg mb-2">Media Preview Unavailable</p>
                                <p className="text-xs sm:text-sm opacity-75 break-all">{filename}</p>
                              </div>
                            )
                          }
                        })()}
                        
                        {/* Fallback error display */}
                        <div className="hidden text-center text-white p-8">
                          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg mb-2">Failed to Load Media</p>
                          <p className="text-sm opacity-75">File may be corrupted or unsupported</p>
                        </div>
                      </div>
                      
                      {/* Navigation arrows for multiple files */}
                      {hazard.mediaFiles.length > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70"
                            onClick={prevMedia}
                            disabled={currentMediaIndex === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70"
                            onClick={nextMedia}
                            disabled={currentMediaIndex === hazard.mediaFiles.length - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {/* Media counter */}
                      {hazard.mediaFiles.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                          {currentMediaIndex + 1} / {hazard.mediaFiles.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Media thumbnails for navigation */}
                    {hazard.mediaFiles.length > 1 && (
                      <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                        {hazard.mediaFiles.map((fileId, index) => {
                          const metadata = mediaMetadata[fileId]
                          const filename = metadata?.filename || `media-${index + 1}`
                          const contentType = metadata?.contentType
                          
                          return (
                            <button
                              key={fileId}
                              onClick={() => goToMedia(index)}
                              className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded border-2 overflow-hidden transition-colors ${
                                index === currentMediaIndex 
                                  ? 'border-primary' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              {isImageFile(filename, contentType) ? (
                                <img
                                  src={`/api/files/${fileId}`}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <div className="scale-75 sm:scale-100">
                                    {getFileIcon(filename, contentType)}
                                  </div>
                                </div>
                              )}
                              {/* Fallback for failed thumbnails */}
                              <div className="hidden w-full h-full bg-muted flex items-center justify-center">
                                <div className="scale-75 sm:scale-100">
                                  {getFileIcon(filename, contentType)}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Media actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground flex items-center gap-1 min-w-0">
                        {(() => {
                          const currentFileId = hazard.mediaFiles[currentMediaIndex]
                          const metadata = mediaMetadata[currentFileId]
                          const filename = metadata?.filename || `media-${currentMediaIndex + 1}`
                          const contentType = metadata?.contentType
                          return (
                            <>
                              <div className="flex-shrink-0">
                                {getFileIcon(filename, contentType)}
                              </div>
                              <span className="truncate" title={filename}>{filename}</span>
                            </>
                          )
                        })()}
                      </span>
                      <div className="flex gap-2 sm:ml-auto">
                        <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                          <a 
                            href={`/api/files/${hazard.mediaFiles[currentMediaIndex]}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                          <a 
                            href={`/api/files/${hazard.mediaFiles[currentMediaIndex]}?download=true`} 
                            download
                          >
                            <Download className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Download</span>
                            <span className="sm:hidden">Save</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-muted-foreground text-xs sm:text-sm">Media not found</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">No media files attached to this report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
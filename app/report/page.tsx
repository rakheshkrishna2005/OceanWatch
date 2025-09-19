"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Upload, AlertTriangle, Clock, Camera, User } from "lucide-react"
import Navbar from "@/components/Navbar"
import { hazardTypes, locations } from "@/lib/models/HazardReport"

export default function ReportPage() {
  const [formData, setFormData] = useState({
    hazardType: "",
    date: "",
    severity: "",
    description: "",
    location: "",
    customLocation: "",
    coordinates: { lat: "", lng: "" },
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    media: null as File[] | null,
  })

  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const severityLevels = [
    { value: "Low", label: "Low", color: "bg-green-500" },
    { value: "Medium", label: "Medium", color: "bg-yellow-500" },
    { value: "High", label: "High", color: "bg-orange-500" },
    { value: "Critical", label: "Critical", color: "bg-red-500" },
  ]

  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    setLocationError("")

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      setIsGettingLocation(false)
      return
    }

    // Check if the page is served over HTTPS (required for geolocation in many browsers)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setLocationError("Geolocation requires HTTPS connection. Please use HTTPS or localhost.")
      setIsGettingLocation(false)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 60000 // Accept a cached position up to 1 minute old
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', position.coords)
        setFormData((prev) => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          },
        }))
        setIsGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = "Unable to retrieve your location. "
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Permission denied. Please allow location access and try again."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable. Please check your GPS/network connection."
            break
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again."
            break
          default:
            errorMessage += "An unknown error occurred. Please enter coordinates manually."
            break
        }
        
        setLocationError(errorMessage)
        setIsGettingLocation(false)
      },
      options
    )
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        media: Array.from(e.target.files!),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      // First, create the hazard report
      const reportData = {
        title: `${formData.hazardType} - ${formData.location || formData.customLocation}`,
        description: formData.description,
        location: formData.location === "Other" ? formData.customLocation : formData.location,
        hazardType: formData.hazardType,
        severity: formData.severity,
        status: "Unverified",
        dateReported: formData.date,
        reportedBy: formData.contactName || "Anonymous",
        coordinates: {
          lat: Number.parseFloat(formData.coordinates.lat) || 0,
          lng: Number.parseFloat(formData.coordinates.lng) || 0,
        },
        mediaFiles: [],
        contactInfo: formData.contactName
          ? {
              name: formData.contactName,
              email: formData.contactEmail,
              phone: formData.contactPhone,
            }
          : undefined,
      }

      const reportResponse = await fetch("/api/hazards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })

      if (!reportResponse.ok) {
        throw new Error("Failed to submit report")
      }

      const newReport = await reportResponse.json()

      // If there are media files, upload them
      if (formData.media && formData.media.length > 0) {
        const formDataUpload = new FormData()
        formData.media.forEach((file) => {
          formDataUpload.append("files", file)
        })
        formDataUpload.append("reportId", newReport._id)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (!uploadResponse.ok) {
          console.warn("Failed to upload media files, but report was created")
          const errorData = await uploadResponse.json()
          console.error("Upload error:", errorData)
          alert(`Report submitted successfully, but some media files failed to upload: ${errorData.error || 'Unknown error'}`)
        } else {
          const uploadResult = await uploadResponse.json()
          console.log("Files uploaded successfully:", uploadResult.fileIds)
          alert("Hazard report and media files submitted successfully! It will be reviewed by our team.")
        }
      } else {
        alert("Hazard report submitted successfully! It will be reviewed by our team.")
      }

      // Reset form
      setFormData({
        hazardType: "",
        date: "",
        severity: "",
        description: "",
        location: "",
        customLocation: "",
        coordinates: { lat: "", lng: "" },
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        media: null,
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-balance mb-3">Report Ocean Hazard</h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Help us protect our marine environments by reporting hazards you've observed. All reports start as
              unverified and will be reviewed by our team.
            </p>
            <Alert className="mt-3 border-warning/20 bg-warning/5">
              <Clock className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning-foreground text-xs">
                <strong>Default Status:</strong> All new reports are marked as{" "}
                <Badge className="mx-1 bg-warning text-warning-foreground text-xs">Unverified</Badge> until reviewed by
                professionals.
              </AlertDescription>
            </Alert>
          </div>

          {/* Form */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-accent" />
                Hazard Details
              </CardTitle>
              <CardDescription className="text-xs">
                Please provide as much detail as possible to help our team assess and respond to the hazard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hazard Type */}
                <div className="space-y-2">
                  <Label htmlFor="hazardType" className="text-xs">
                    Hazard Type *
                  </Label>
                  <Select
                    value={formData.hazardType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, hazardType: value }))}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select hazard type" />
                    </SelectTrigger>
                    <SelectContent>
                      {hazardTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs">
                    Date Observed *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    className="text-xs"
                  />
                </div>

                {/* Severity Level */}
                <div className="space-y-2">
                  <Label className="text-xs">Severity Level *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {severityLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, severity: level.value }))}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          formData.severity === level.value ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${level.color} mx-auto mb-1`} />
                        <div className="text-xs font-medium">{level.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the hazard..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                    className="text-xs"
                  />
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs">
                      Location *
                    </Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select general location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location} className="text-xs">
                            {location}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other" className="text-xs">
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Location Input */}
                  {formData.location === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="customLocation" className="text-xs">
                        Specify Location *
                      </Label>
                      <Input
                        id="customLocation"
                        placeholder="Enter specific location details"
                        value={formData.customLocation}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customLocation: e.target.value }))}
                        required
                        className="text-xs"
                      />
                    </div>
                  )}

                  {/* GPS Coordinates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">GPS Coordinates</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="text-xs bg-transparent btn-colorful"
                        title="Click to get your current GPS coordinates"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {isGettingLocation ? "Getting Location..." : "Use Current Location"}
                      </Button>
                    </div>
                    {!navigator.geolocation && (
                      <div className="text-xs text-muted-foreground">
                        ⚠️ Geolocation not supported by this browser
                      </div>
                    )}
                    {typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                      <div className="text-xs text-amber-600">
                        ⚠️ HTTPS required for location access in production
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                          Latitude
                        </Label>
                        <Input
                          id="latitude"
                          placeholder="e.g., 18.922"
                          value={formData.coordinates.lat}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              coordinates: { ...prev.coordinates, lat: e.target.value },
                            }))
                          }
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                          Longitude
                        </Label>
                        <Input
                          id="longitude"
                          placeholder="e.g., 72.8347"
                          value={formData.coordinates.lng}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              coordinates: { ...prev.coordinates, lng: e.target.value },
                            }))
                          }
                          className="text-xs"
                        />
                      </div>
                    </div>
                    {locationError && <p className="text-xs text-destructive">{locationError}</p>}
                  </div>
                </div>

                {/* Media Upload */}
                <div className="space-y-2">
                  <Label htmlFor="media" className="text-xs">
                    Photos/Videos
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors">
                    <input
                      id="media"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                    <label htmlFor="media" className="cursor-pointer">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Click to upload photos or videos</p>
                      <p className="text-xs text-muted-foreground mt-1">Multiple files supported</p>
                    </label>
                    {formData.media && formData.media.length > 0 && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="px-2 py-1 text-xs">
                          <Camera className="h-3 w-3 mr-1" />
                          {formData.media.length} file(s) selected
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <Card className="border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Contact Information
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Optional but helpful for follow-up questions about your report.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="contactName" className="text-xs">
                        Full Name
                      </Label>
                      <Input
                        id="contactName"
                        placeholder="Your full name"
                        value={formData.contactName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactEmail" className="text-xs">
                        Email Address
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactPhone" className="text-xs">
                        Phone Number
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+91-9876543210"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="flex-1 bg-accent text-accent-foreground btn-colorful"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Hazard Report"}
                  </Button>
                </div>

                {submitError && (
                  <Alert className="border-destructive/20 bg-destructive/5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive text-xs">{submitError}</AlertDescription>
                  </Alert>
                )}

                <Alert className="border-info/20 bg-info/5">
                  <AlertTriangle className="h-4 w-4 text-info" />
                  <AlertDescription className="text-info-foreground text-xs">
                    Your report will be reviewed by our professional team and marked as verified once confirmed. Thank
                    you for helping protect our oceans!
                  </AlertDescription>
                </Alert>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

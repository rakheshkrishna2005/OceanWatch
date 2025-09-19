import type { ObjectId } from "mongodb"

export interface HazardReport {
  _id?: ObjectId
  title: string
  description: string
  location: string
  specificLocation?: string
  hazardType: string
  severity: "Low" | "Medium" | "High" | "Critical"
  status: "Unverified" | "Verified" | "Closed"
  dateReported: Date
  reportedBy: string
  coordinates?: { lat: number; lng: number }
  mediaFiles?: string[]
  contactInfo?: {
    name: string
    email: string
    phone: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface MediaFile {
  _id: ObjectId
  filename: string
  contentType: string
  size: number
  uploadDate: Date
}

export const hazardTypes = [
  "Oil Spill",
  "Chemical Contamination",
  "Marine Debris",
  "Harmful Algal Bloom",
  "Dead Marine Life",
  "Coastal Erosion",
  "Sewage Discharge",
  "Abandoned Vessel",
  "Fishing Net Entanglement",
  "Coral Bleaching",
  "Microplastic Contamination",
  "Industrial Effluent",
]

export const locations = [
  "Mumbai, Maharashtra",
  "Chennai, Tamil Nadu",
  "Kochi, Kerala",
  "Visakhapatnam, Andhra Pradesh",
  "Panaji, Goa",
  "Kolkata, West Bengal",
  "Bhubaneswar, Odisha",
  "Mangalore, Karnataka",
  "Puducherry",
  "Port Blair, Andaman & Nicobar",
  "Lakshadweep Islands",
  "Daman, Daman & Diu",
]

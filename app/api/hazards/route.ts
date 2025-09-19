import { type NextRequest, NextResponse } from "next/server"
import { HazardService } from "@/lib/services/hazardService"
import type { HazardReport } from "@/lib/models/HazardReport"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const sortBy = searchParams.get('sortBy') || 'dateReported'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const reports = await HazardService.getAllReports({
      limit: limit ? parseInt(limit) : undefined,
      sortBy,
      sortOrder
    })
    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching hazard reports:", error)
    return NextResponse.json({ error: "Failed to fetch hazard reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Convert dateReported string to Date object
    const reportData: Omit<HazardReport, "_id" | "createdAt" | "updatedAt"> = {
      ...body,
      dateReported: new Date(body.dateReported),
      mediaFiles: body.mediaFiles || [],
    }

    const newReport = await HazardService.createReport(reportData)
    return NextResponse.json(newReport, { status: 201 })
  } catch (error) {
    console.error("Error creating hazard report:", error)
    return NextResponse.json({ error: "Failed to create hazard report" }, { status: 500 })
  }
}

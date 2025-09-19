import { type NextRequest, NextResponse } from "next/server"
import { HazardService } from "@/lib/services/hazardService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const report = await HazardService.getReportById(params.id)

    if (!report) {
      return NextResponse.json({ error: "Hazard report not found" }, { status: 404 })
    }

    return NextResponse.json({ hazard: report })
  } catch (error) {
    console.error("Error fetching hazard report:", error)
    return NextResponse.json({ error: "Failed to fetch hazard report" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const updatedReport = await HazardService.updateReport(params.id, body)

    if (!updatedReport) {
      return NextResponse.json({ error: "Hazard report not found" }, { status: 404 })
    }

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Error updating hazard report:", error)
    return NextResponse.json({ error: "Failed to update hazard report" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const updatedReport = await HazardService.updateReport(params.id, body)

    if (!updatedReport) {
      return NextResponse.json({ error: "Hazard report not found" }, { status: 404 })
    }

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Error updating hazard report:", error)
    return NextResponse.json({ error: "Failed to update hazard report" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await HazardService.deleteReport(params.id)

    if (!deleted) {
      return NextResponse.json({ error: "Hazard report not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Hazard report deleted successfully" })
  } catch (error) {
    console.error("Error deleting hazard report:", error)
    return NextResponse.json({ error: "Failed to delete hazard report" }, { status: 500 })
  }
}

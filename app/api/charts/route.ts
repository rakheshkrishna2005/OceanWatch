import { NextResponse } from "next/server"
import { HazardService } from "@/lib/services/hazardService"

export async function GET() {
  try {
    const chartData = await HazardService.getChartData()
    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}

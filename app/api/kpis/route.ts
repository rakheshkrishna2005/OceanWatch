import { NextResponse } from "next/server"
import { HazardService } from "@/lib/services/hazardService"

export async function GET() {
  try {
    const kpis = await HazardService.getKPIs()
    return NextResponse.json(kpis)
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/fileService"
import { HazardService } from "@/lib/services/hazardService"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const reportId = formData.get("reportId") as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const uploadPromises = files.map((file) => FileService.uploadFile(file, { reportId }))

    const fileIds = await Promise.all(uploadPromises)
    const fileIdStrings = fileIds.map((id) => id.toString())

    // Update the hazard report with the uploaded file IDs
    await HazardService.updateReport(reportId, { 
      mediaFiles: fileIdStrings 
    })

    return NextResponse.json({
      message: "Files uploaded successfully",
      fileIds: fileIdStrings,
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}

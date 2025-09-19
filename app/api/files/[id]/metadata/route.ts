import { type NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/fileService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const metadata = await FileService.getFileMetadata(params.id)

    if (!metadata) {
      return NextResponse.json({ error: "File metadata not found" }, { status: 404 })
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error("Error getting file metadata:", error)
    return NextResponse.json({ error: "Failed to get file metadata" }, { status: 500 })
  }
}
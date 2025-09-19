import { type NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/fileService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fileData = await FileService.getFile(params.id)

    if (!fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const { stream, metadata } = fileData
    const url = new URL(request.url)
    const isDownload = url.searchParams.get('download') === 'true'

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    const headers: Record<string, string> = {
      "Content-Type": metadata.contentType || "application/octet-stream",
      "Content-Length": buffer.length.toString(),
    }

    if (isDownload) {
      headers["Content-Disposition"] = `attachment; filename="${metadata.filename}"`
    } else {
      headers["Content-Disposition"] = `inline; filename="${metadata.filename}"`
    }

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await FileService.deleteFile(params.id)

    if (!deleted) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

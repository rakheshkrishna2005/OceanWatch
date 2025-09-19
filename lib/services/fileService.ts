import { getGridFSBucket } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { Readable } from "stream"

export class FileService {
  static async uploadFile(file: File, metadata?: Record<string, any>): Promise<ObjectId> {
    const bucket = await getGridFSBucket()

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create readable stream from buffer
    const readableStream = new Readable({
      read() {
        this.push(buffer)
        this.push(null)
      },
    })

    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(file.name, {
        contentType: file.type,
        metadata: {
          ...metadata,
          originalName: file.name,
          size: file.size,
          uploadDate: new Date(),
        },
      })

      uploadStream.on("error", reject)
      uploadStream.on("finish", () => {
        resolve(uploadStream.id as ObjectId)
      })

      readableStream.pipe(uploadStream)
    })
  }

  static async getFile(fileId: string): Promise<{ stream: any; metadata: any } | null> {
    try {
      const bucket = await getGridFSBucket()
      const objectId = new ObjectId(fileId)

      const files = await bucket.find({ _id: objectId }).toArray()
      if (files.length === 0) {
        return null
      }

      const downloadStream = bucket.openDownloadStream(objectId)
      return {
        stream: downloadStream,
        metadata: files[0],
      }
    } catch (error) {
      console.error("Error getting file:", error)
      return null
    }
  }

  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      const bucket = await getGridFSBucket()
      await bucket.delete(new ObjectId(fileId))
      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      return false
    }
  }

  static async getFileMetadata(fileId: string) {
    try {
      const bucket = await getGridFSBucket()
      const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray()
      return files.length > 0 ? files[0] : null
    } catch (error) {
      console.error("Error getting file metadata:", error)
      return null
    }
  }
}

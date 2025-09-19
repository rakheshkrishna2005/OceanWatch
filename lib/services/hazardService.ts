import clientPromise from "@/lib/mongodb"
import type { HazardReport } from "@/lib/models/HazardReport"
import { ObjectId } from "mongodb"

const COLLECTION_NAME = "hazard_reports"

export class HazardService {
  static async getAllReports(options?: {
    limit?: number
    sortBy?: string
    sortOrder?: string
  }): Promise<HazardReport[]> {
    const client = await clientPromise
    const db = client.db("ocean_hazard_platform")
    const collection = db.collection<HazardReport>(COLLECTION_NAME)

    const sortField = options?.sortBy || 'dateReported'
    const sortDirection = options?.sortOrder === 'asc' ? 1 : -1
    
    const query = collection.find({})
      .sort({ [sortField]: sortDirection })
    
    if (options?.limit) {
      query.limit(options.limit)
    }
    
    return await query.toArray()
  }

  static async getReportById(id: string): Promise<HazardReport | null> {
    const client = await clientPromise
    const db = client.db("ocean_hazard_platform")
    const collection = db.collection<HazardReport>(COLLECTION_NAME)

    return await collection.findOne({ _id: new ObjectId(id) })
  }

  static async createReport(report: Omit<HazardReport, "_id" | "createdAt" | "updatedAt">): Promise<HazardReport> {
    const client = await clientPromise
    const db = client.db("ocean_hazard_platform")
    const collection = db.collection<HazardReport>(COLLECTION_NAME)

    const now = new Date()
    const newReport = {
      ...report,
      createdAt: now,
      updatedAt: now,
    }

    const result = await collection.insertOne(newReport)
    return { ...newReport, _id: result.insertedId }
  }

  static async updateReport(id: string, updates: Partial<HazardReport>): Promise<HazardReport | null> {
    const client = await clientPromise
    const db = client.db("ocean_hazard_platform")
    const collection = db.collection<HazardReport>(COLLECTION_NAME)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    return result
  }

  static async deleteReport(id: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db("ocean_hazard_platform")
    const collection = db.collection<HazardReport>(COLLECTION_NAME)

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }

  static async getKPIs() {
    const client = await clientPromise
    const db = client.db("ocean_hazard_platform")
    const collection = db.collection<HazardReport>(COLLECTION_NAME)

    const [totalReports, verifiedReports, pendingVerification, closedReports, criticalHazards, activeLocations] =
      await Promise.all([
        collection.countDocuments(),
        collection.countDocuments({ status: "Verified" }),
        collection.countDocuments({ status: "Unverified" }),
        collection.countDocuments({ status: "Closed" }),
        collection.countDocuments({ severity: "Critical", status: { $ne: "Closed" } }),
        collection.distinct("location", { status: { $ne: "Closed" } }),
      ])

    return {
      totalReports,
      verifiedReports,
      pendingVerification,
      closedReports,
      criticalHazards,
      activeLocations: activeLocations.length,
    }
  }

  static async getChartData() {
    const client = await clientPromise
    const db = client.db("ocean_hazard_platform")
    const collection = db.collection<HazardReport>(COLLECTION_NAME)

    const [hazardsByType, hazardsByStatus, hazardsBySeverity] = await Promise.all([
      collection
        .aggregate([
          { $group: { _id: "$hazardType", count: { $sum: 1 } } },
          { $project: { name: "$_id", value: "$count", _id: 0 } },
        ])
        .toArray(),
      collection
        .aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { name: "$_id", value: "$count", _id: 0 } },
        ])
        .toArray(),
      collection
        .aggregate([
          { $group: { _id: "$severity", count: { $sum: 1 } } },
          { $project: { name: "$_id", value: "$count", _id: 0 } },
        ])
        .toArray(),
    ])

    // Add colors to chart data
    const statusColors = {
      Verified: "hsl(142, 76%, 36%)",
      Unverified: "hsl(48, 96%, 53%)",
      Closed: "hsl(215, 20%, 65%)",
    }

    const severityColors = {
      Critical: "hsl(0, 84%, 60%)",
      High: "hsl(25, 95%, 53%)",
      Medium: "hsl(48, 96%, 53%)",
      Low: "hsl(142, 76%, 36%)",
    }

    return {
      hazardsByType: hazardsByType.map((item, index) => ({
        ...item,
        fill: `hsl(${(index * 360) / hazardsByType.length}, 70%, 50%)`,
      })),
      hazardsByStatus: hazardsByStatus.map((item) => ({
        ...item,
        fill: statusColors[item.name as keyof typeof statusColors] || "hsl(215, 20%, 65%)",
      })),
      hazardsBySeverity: hazardsBySeverity.map((item) => ({
        ...item,
        fill: severityColors[item.name as keyof typeof severityColors] || "hsl(215, 20%, 65%)",
      })),
    }
  }
}

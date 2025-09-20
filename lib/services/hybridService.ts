import { offlineStorage } from './offlineStorage'
import type { HazardReport } from '@/lib/models/HazardReport'

// Dynamic imports for server-side only services
let HazardService: any = null
let FileService: any = null

// Load server services only on server side
if (typeof window === 'undefined') {
  const hazardServiceModule = require('./hazardService')
  const fileServiceModule = require('./fileService')
  HazardService = hazardServiceModule.HazardService
  FileService = fileServiceModule.FileService
}

export class HybridService {
  private static isOnline(): boolean {
    return typeof window !== 'undefined' && navigator.onLine
  }

  // Hazard operations
  static async getAllHazards(options?: {
    limit?: number
    sortBy?: string
    sortOrder?: string
  }): Promise<HazardReport[]> {
    if (this.isOnline() && HazardService) {
      try {
        return await HazardService.getAllReports(options)
      } catch (error) {
        console.warn('Online service failed, falling back to offline:', error)
        if (typeof window !== 'undefined') {
          return await offlineStorage.getAllHazards(options)
        }
        return []
      }
    } else {
      if (typeof window !== 'undefined') {
        return await offlineStorage.getAllHazards(options)
      }
      return []
    }
  }

  static async getHazardById(id: string): Promise<HazardReport | null> {
    if (this.isOnline() && HazardService) {
      try {
        return await HazardService.getReportById(id)
      } catch (error) {
        console.warn('Online service failed, falling back to offline:', error)
        if (typeof window !== 'undefined') {
          return await offlineStorage.getHazardById(id)
        }
        return null
      }
    } else {
      if (typeof window !== 'undefined') {
        return await offlineStorage.getHazardById(id)
      }
      return null
    }
  }

  static async createHazard(report: Omit<HazardReport, "_id" | "createdAt" | "updatedAt">): Promise<HazardReport> {
    if (typeof window === 'undefined') {
      // Server-side: only use online service
      if (HazardService) {
        return await HazardService.createReport(report)
      }
      throw new Error('No service available')
    }

    // Client-side: use offline storage first
    const offlineResult = await offlineStorage.createHazard(report)
    
    if (this.isOnline()) {
      try {
        // Try to sync with online service by making direct API call
        const response = await fetch('/api/hazards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...report,
            dateReported: report.dateReported.toISOString(),
          }),
        })
        
        if (response.ok) {
          const onlineResult = await response.json()
          // Update offline storage with the online result (which has the real _id)
          await offlineStorage.updateHazard(offlineResult._id!.toString(), { 
            ...onlineResult, 
            _id: onlineResult._id 
          })
          
          // CRITICAL FIX: Mark all sync queue items for this offline ID as synced
          // to prevent duplicate uploads during background sync
          await this.markDuplicatesAsSynced(offlineResult._id!.toString())
          
          return { ...onlineResult, _id: onlineResult._id }
        } else {
          throw new Error('Failed to sync with online service')
        }
      } catch (error) {
        console.warn('Failed to sync with online service:', error)
        // Return offline result, it will be synced later
        return offlineResult
      }
    } else {
      return offlineResult
    }
  }

  static async updateHazard(id: string, updates: Partial<HazardReport>): Promise<HazardReport | null> {
    // Always update offline storage first
    const offlineResult = await offlineStorage.updateHazard(id, updates)
    
    if (this.isOnline() && HazardService) {
      try {
        // Try to sync with online service
        const onlineResult = await HazardService.updateReport(id, updates)
        
        // Mark any sync queue items for this update as synced
        await this.markUpdateDuplicatesAsSynced(id)
        
        return onlineResult
      } catch (error) {
        console.warn('Failed to sync with online service:', error)
        return offlineResult
      }
    } else {
      return offlineResult
    }
  }

  static async deleteHazard(id: string): Promise<boolean> {
    // Always delete from offline storage first
    const offlineResult = await offlineStorage.deleteHazard(id)
    
    if (this.isOnline() && HazardService) {
      try {
        // Try to sync with online service
        const onlineResult = await HazardService.deleteReport(id)
        
        // Mark any sync queue items for this delete as synced
        await this.markDeleteDuplicatesAsSynced(id)
        
        return onlineResult
      } catch (error) {
        console.warn('Failed to sync with online service:', error)
        return offlineResult
      }
    } else {
      return offlineResult
    }
  }

  // KPI operations
  static async getKPIs() {
    if (this.isOnline() && HazardService) {
      try {
        return await HazardService.getKPIs()
      } catch (error) {
        console.warn('Online service failed, falling back to offline:', error)
        return await offlineStorage.getKPIs()
      }
    } else {
      return await offlineStorage.getKPIs()
    }
  }

  // Chart data operations
  static async getChartData() {
    if (this.isOnline() && HazardService) {
      try {
        return await HazardService.getChartData()
      } catch (error) {
        console.warn('Online service failed, falling back to offline:', error)
        return await offlineStorage.getChartData()
      }
    } else {
      return await offlineStorage.getChartData()
    }
  }

  // File operations
  static async uploadFile(file: File, metadata?: Record<string, any>): Promise<string> {
    if (typeof window === 'undefined') {
      // Server-side: only use online service
      if (FileService) {
        const fileId = await FileService.uploadFile(file, metadata)
        return fileId.toString()
      }
      throw new Error('No file service available')
    }

    // Always save to offline storage first
    const offlineFileId = await offlineStorage.uploadFile(file, metadata)
    
    if (this.isOnline()) {
      try {
        // Try to sync with online service using direct API call
        const formData = new FormData()
        formData.append('files', file)
        if (metadata?.reportId) {
          formData.append('reportId', metadata.reportId)
        }
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // CRITICAL FIX: Mark all sync queue items for this file as synced
          // to prevent duplicate uploads during background sync
          await this.markFileDuplicatesAsSynced(offlineFileId)
          
          // Return the first file ID from the online service
          return result.fileIds?.[0] || offlineFileId
        } else {
          throw new Error('Failed to sync file with online service')
        }
      } catch (error) {
        console.warn('Failed to sync file with online service:', error)
        return offlineFileId
      }
    } else {
      return offlineFileId
    }
  }

  static async getFile(fileId: string): Promise<{ stream: any; metadata: any } | null> {
    if (this.isOnline() && FileService) {
      try {
        return await FileService.getFile(fileId)
      } catch (error) {
        console.warn('Online service failed, falling back to offline:', error)
        const offlineFile = await offlineStorage.getFile(fileId)
        if (offlineFile) {
          return {
            stream: new ReadableStream({
              start(controller) {
                controller.enqueue(offlineFile.data)
                controller.close()
              }
            }),
            metadata: offlineFile.metadata
          }
        }
        return null
      }
    } else {
      const offlineFile = await offlineStorage.getFile(fileId)
      if (offlineFile) {
        return {
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue(offlineFile.data)
              controller.close()
            }
          }),
          metadata: offlineFile.metadata
        }
      }
      return null
    }
  }

  static async deleteFile(fileId: string): Promise<boolean> {
    // Always delete from offline storage first
    const offlineResult = await offlineStorage.deleteFile(fileId)
    
    if (this.isOnline() && FileService) {
      try {
        // Try to sync with online service
        const onlineResult = await FileService.deleteFile(fileId)
        return onlineResult
      } catch (error) {
        console.warn('Failed to sync file deletion with online service:', error)
        return offlineResult
      }
    } else {
      return offlineResult
    }
  }

  // Background sync when coming back online
  static async syncPendingChanges(): Promise<void> {
    if (!this.isOnline()) {
      console.log('HybridService: Cannot sync - still offline')
      return
    }

    try {
      const pendingItems = await offlineStorage.getPendingSyncItems()
      console.log(`HybridService: Found ${pendingItems.length} items to sync`)
      
      if (pendingItems.length === 0) {
        console.log('HybridService: No pending items to sync')
        return
      }
      
      // Track mapping between offline UUIDs and real database IDs
      const idMapping = new Map<string, string>()
      // Track which offline items have been processed to prevent duplicates
      const processedOfflineIds = new Set<string>()
      
      // Helper function to check if ID is offline UUID
      const isOfflineUUID = (id: string) => {
        return id.includes('-') && id.length === 36 // UUID format
      }
      
      for (const item of pendingItems) {
        console.log(`HybridService: Syncing ${item.table} ${item.action} item with ID ${item.id}`)
        try {
          if (item.table === 'hazards') {
            switch (item.action) {
              case 'CREATE':
                console.log('HybridService: Syncing hazard CREATE with data:', JSON.stringify(item.data, null, 2))
                
                // Check for duplicates based on offline _id
                const offlineId = item.data._id
                if (processedOfflineIds.has(offlineId)) {
                  console.log('HybridService: Skipping duplicate CREATE for offline ID:', offlineId)
                  await offlineStorage.markSyncItemAsSynced(item.id)
                  break
                }
                processedOfflineIds.add(offlineId)
                
                const cleanedData = {
                  ...item.data,
                  dateReported: new Date(item.data.dateReported).toISOString()
                }
                // Remove offline-specific fields that shouldn't be sent to API
                delete cleanedData._id  // Let MongoDB generate the real _id
                delete cleanedData.createdAt
                delete cleanedData.updatedAt
                
                console.log('HybridService: Cleaned data for API:', JSON.stringify(cleanedData, null, 2))
                const response = await fetch('/api/hazards', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(cleanedData),
                })
                
                if (response.ok) {
                  const createdHazard = await response.json()
                  console.log('HybridService: Created hazard with real ID:', createdHazard._id)
                  // Map offline UUID to real database ID
                  idMapping.set(item.data._id, createdHazard._id)
                  await offlineStorage.markSyncItemAsSynced(item.id)
                  
                  // Mark any other duplicate CREATE items for the same offline ID as synced
                  await this.markDuplicatesAsSynced(offlineId)
                  
                  console.log(`HybridService: Successfully synced hazard creation for item ${item.id}`)
                } else {
                  const errorText = await response.text()
                  console.error(`HybridService: Failed to sync hazard creation - ${response.status} ${response.statusText}:`, errorText)
                }
                break
              case 'UPDATE':
                console.log('HybridService: Syncing hazard UPDATE with data:', JSON.stringify(item.data, null, 2))
                // Skip UPDATE operations for offline UUIDs since they don't exist in real database
                if (isOfflineUUID(item.data._id)) {
                  console.log('HybridService: Skipping UPDATE operation for offline UUID:', item.data._id)
                  await offlineStorage.markSyncItemAsSynced(item.id)
                } else {
                  console.log('HybridService: UPDATE operation for real database ID:', item.data._id)
                  // This would be for updates to existing database records
                  await offlineStorage.markSyncItemAsSynced(item.id)
                }
                break
              case 'DELETE':
                const deleteResponse = await fetch(`/api/hazards/${item.data._id}`, {
                  method: 'DELETE',
                })
                
                if (deleteResponse.ok) {
                  await offlineStorage.markSyncItemAsSynced(item.id)
                }
                break
            }
          } else if (item.table === 'files') {
            switch (item.action) {
              case 'CREATE':
                console.log('HybridService: Syncing file CREATE with metadata:', JSON.stringify(item.data.metadata, null, 2))
                console.log('HybridService: File details - name:', item.data.name, 'type:', item.data.type, 'size:', item.data.size)
                
                // Check if we need to map offline reportId to real ID
                let reportId = item.data.metadata?.reportId
                if (reportId && isOfflineUUID(reportId)) {
                  if (idMapping.has(reportId)) {
                    reportId = idMapping.get(reportId)
                    console.log('HybridService: Mapped offline reportId to real ID:', reportId)
                  } else {
                    console.log('HybridService: Skipping file upload - no mapping found for offline reportId:', reportId)
                    await offlineStorage.markSyncItemAsSynced(item.id)
                    break
                  }
                } else if (reportId) {
                  console.log('HybridService: Using real database reportId:', reportId)
                }
                
                // Convert ArrayBuffer back to File for upload
                const file = new File([item.data.data], item.data.name, { type: item.data.type })
                const formData = new FormData()
                formData.append('files', file)
                if (reportId) {
                  formData.append('reportId', reportId)
                } else {
                  console.log('HybridService: Skipping file upload - no valid reportId')
                  await offlineStorage.markSyncItemAsSynced(item.id)
                  break
                }
                
                const uploadResponse = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData,
                })
                
                if (uploadResponse.ok) {
                  await offlineStorage.markSyncItemAsSynced(item.id)
                  console.log(`HybridService: Successfully synced file upload for item ${item.id}`)
                } else {
                  const errorText = await uploadResponse.text()
                  console.error(`HybridService: Failed to sync file upload - ${uploadResponse.status} ${uploadResponse.statusText}:`, errorText)
                }
                break
              case 'DELETE':
                const deleteFileResponse = await fetch(`/api/files/${item.data.id}`, {
                  method: 'DELETE',
                })
                
                if (deleteFileResponse.ok) {
                  await offlineStorage.markSyncItemAsSynced(item.id)
                }
                break
            }
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Background sync failed:', error)
    }
  }

  // Initialize offline storage
  static async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      await offlineStorage.init()
      
      // Set up online/offline listeners
      offlineStorage.onOnlineStatusChange((isOnline) => {
        if (isOnline) {
          console.log('Back online, starting background sync...')
          this.syncPendingChanges()
        } else {
          console.log('Gone offline, using local storage')
        }
      })
    }
  }

  // Helper method to mark duplicate sync items as synced
  private static async markDuplicatesAsSynced(offlineId: string): Promise<void> {
    try {
      const pendingItems = await offlineStorage.getPendingSyncItems()
      const duplicates = pendingItems.filter(item => 
        item.table === 'hazards' && 
        item.action === 'CREATE' && 
        item.data._id === offlineId
      )
      
      for (const duplicate of duplicates) {
        await offlineStorage.markSyncItemAsSynced(duplicate.id)
        console.log(`HybridService: Marked duplicate sync item ${duplicate.id} as synced`)
      }
    } catch (error) {
      console.error('Failed to mark duplicates as synced:', error)
    }
  }

  // Helper method to mark duplicate file sync items as synced
  private static async markFileDuplicatesAsSynced(offlineFileId: string): Promise<void> {
    try {
      const pendingItems = await offlineStorage.getPendingSyncItems()
      const duplicates = pendingItems.filter(item => 
        item.table === 'files' && 
        item.action === 'CREATE' && 
        item.data.id === offlineFileId
      )
      
      for (const duplicate of duplicates) {
        await offlineStorage.markSyncItemAsSynced(duplicate.id)
        console.log(`HybridService: Marked duplicate file sync item ${duplicate.id} as synced`)
      }
    } catch (error) {
      console.error('Failed to mark file duplicates as synced:', error)
    }
  }

  // Helper method to mark duplicate update sync items as synced
  private static async markUpdateDuplicatesAsSynced(hazardId: string): Promise<void> {
    try {
      const pendingItems = await offlineStorage.getPendingSyncItems()
      const duplicates = pendingItems.filter(item => 
        item.table === 'hazards' && 
        item.action === 'UPDATE' && 
        item.data._id === hazardId
      )
      
      for (const duplicate of duplicates) {
        await offlineStorage.markSyncItemAsSynced(duplicate.id)
        console.log(`HybridService: Marked duplicate update sync item ${duplicate.id} as synced`)
      }
    } catch (error) {
      console.error('Failed to mark update duplicates as synced:', error)
    }
  }

  // Helper method to mark duplicate delete sync items as synced
  private static async markDeleteDuplicatesAsSynced(hazardId: string): Promise<void> {
    try {
      const pendingItems = await offlineStorage.getPendingSyncItems()
      const duplicates = pendingItems.filter(item => 
        item.table === 'hazards' && 
        item.action === 'DELETE' && 
        item.data._id === hazardId
      )
      
      for (const duplicate of duplicates) {
        await offlineStorage.markSyncItemAsSynced(duplicate.id)
        console.log(`HybridService: Marked duplicate delete sync item ${duplicate.id} as synced`)
      }
    } catch (error) {
      console.error('Failed to mark delete duplicates as synced:', error)
    }
  }
}

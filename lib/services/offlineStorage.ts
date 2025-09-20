import type { HazardReport } from "@/lib/models/HazardReport"

const DB_NAME = 'CascadeVisionDB'
const DB_VERSION = 1
const HAZARDS_STORE = 'hazards'
const FILES_STORE = 'files'
const SYNC_QUEUE_STORE = 'syncQueue'

export interface OfflineFile {
  id: string
  name: string
  type: string
  size: number
  data: ArrayBuffer
  metadata: Record<string, any>
  createdAt: Date
}

export interface SyncQueueItem {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  table: 'hazards' | 'files'
  data: any
  timestamp: Date
  synced: boolean
}

class OfflineStorageService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment')
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create hazards store
        if (!db.objectStoreNames.contains(HAZARDS_STORE)) {
          const hazardsStore = db.createObjectStore(HAZARDS_STORE, { keyPath: '_id' })
          hazardsStore.createIndex('status', 'status', { unique: false })
          hazardsStore.createIndex('severity', 'severity', { unique: false })
          hazardsStore.createIndex('hazardType', 'hazardType', { unique: false })
          hazardsStore.createIndex('dateReported', 'dateReported', { unique: false })
        }

        // Create files store
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' })
          filesStore.createIndex('reportId', 'metadata.reportId', { unique: false })
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('synced', 'synced', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB')
    }
    
    // Validate that all required stores exist
    const requiredStores = [HAZARDS_STORE, FILES_STORE, SYNC_QUEUE_STORE]
    for (const storeName of requiredStores) {
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.error(`Missing object store: ${storeName}. Reinitializing database...`)
        // Close current connection and recreate with higher version
        this.db.close()
        this.db = null
        await this.forceReinitialize()
        break
      }
    }
    
    if (!this.db) {
      throw new Error('Database reinitialization failed')
    }
    
    return this.db
  }
  
  private async forceReinitialize(): Promise<void> {
    // Delete the existing database and recreate it
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
      deleteRequest.onsuccess = async () => {
        console.log('Database deleted, reinitializing...')
        try {
          await this.init()
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
  }

  // Hazard Reports CRUD operations
  async getAllHazards(options?: {
    limit?: number
    sortBy?: string
    sortOrder?: string
  }): Promise<HazardReport[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([HAZARDS_STORE], 'readonly')
        const store = transaction.objectStore(HAZARDS_STORE)
        const request = store.getAll()

        request.onsuccess = () => {
          let results = request.result as HazardReport[]
          
          // Apply sorting
          if (options?.sortBy) {
            const sortField = options.sortBy
            const sortOrder = options.sortOrder === 'asc' ? 1 : -1
            results.sort((a, b) => {
              const aVal = a[sortField as keyof HazardReport]
              const bVal = b[sortField as keyof HazardReport]
              if (aVal === undefined || bVal === undefined) return 0
              if (aVal < bVal) return -1 * sortOrder
              if (aVal > bVal) return 1 * sortOrder
              return 0
            })
          }

          // Apply limit
          if (options?.limit) {
            results = results.slice(0, options.limit)
          }

          resolve(results)
        }
        request.onerror = () => reject(request.error)
      } catch (error) {
        console.error('Error creating transaction for getAllHazards:', error)
        reject(error)
      }
    })
  }

  async getHazardById(id: string): Promise<HazardReport | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HAZARDS_STORE], 'readonly')
      const store = transaction.objectStore(HAZARDS_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async createHazard(report: Omit<HazardReport, "_id" | "createdAt" | "updatedAt">): Promise<HazardReport> {
    const db = await this.ensureDB()
    const now = new Date()
    const newReport: HazardReport = {
      ...report,
      _id: crypto.randomUUID() as any, // Will be converted to ObjectId when synced
      createdAt: now,
      updatedAt: now,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HAZARDS_STORE, SYNC_QUEUE_STORE], 'readwrite')
      const hazardsStore = transaction.objectStore(HAZARDS_STORE)
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE)

      // Add to hazards store
      const hazardsRequest = hazardsStore.add(newReport)
      
      // Add to sync queue
      const syncItem: SyncQueueItem = {
        id: crypto.randomUUID(),
        action: 'CREATE',
        table: 'hazards',
        data: newReport,
        timestamp: now,
        synced: false
      }
      const syncRequest = syncStore.add(syncItem)

      hazardsRequest.onsuccess = () => {
        syncRequest.onsuccess = () => resolve(newReport)
        syncRequest.onerror = () => reject(syncRequest.error)
      }
      hazardsRequest.onerror = () => reject(hazardsRequest.error)
    })
  }

  async updateHazard(id: string, updates: Partial<HazardReport>): Promise<HazardReport | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HAZARDS_STORE, SYNC_QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(HAZARDS_STORE)
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE)

      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const existing = getRequest.result
        if (!existing) {
          resolve(null)
          return
        }

        const updated = {
          ...existing,
          ...updates,
          updatedAt: new Date()
        }

        const updateRequest = store.put(updated)
        
        // Add to sync queue
        const syncItem: SyncQueueItem = {
          id: crypto.randomUUID(),
          action: 'UPDATE',
          table: 'hazards',
          data: updated,
          timestamp: new Date(),
          synced: false
        }
        const syncRequest = syncStore.add(syncItem)

        updateRequest.onsuccess = () => {
          syncRequest.onsuccess = () => resolve(updated)
          syncRequest.onerror = () => reject(syncRequest.error)
        }
        updateRequest.onerror = () => reject(updateRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteHazard(id: string): Promise<boolean> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HAZARDS_STORE, SYNC_QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(HAZARDS_STORE)
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE)

      // Get the item before deleting for sync queue
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (!item) {
          resolve(false)
          return
        }

        const deleteRequest = store.delete(id)
        
        // Add to sync queue
        const syncItem: SyncQueueItem = {
          id: crypto.randomUUID(),
          action: 'DELETE',
          table: 'hazards',
          data: { _id: id },
          timestamp: new Date(),
          synced: false
        }
        const syncRequest = syncStore.add(syncItem)

        deleteRequest.onsuccess = () => {
          syncRequest.onsuccess = () => resolve(true)
          syncRequest.onerror = () => reject(syncRequest.error)
        }
        deleteRequest.onerror = () => reject(deleteRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // KPI calculations
  async getKPIs() {
    const hazards = await this.getAllHazards()
    
    return {
      totalReports: hazards.length,
      verifiedReports: hazards.filter(h => h.status === "Verified").length,
      pendingVerification: hazards.filter(h => h.status === "Unverified").length,
      closedReports: hazards.filter(h => h.status === "Closed").length,
      criticalHazards: hazards.filter(h => h.severity === "Critical" && h.status !== "Closed").length,
      activeLocations: new Set(hazards.filter(h => h.status !== "Closed").map(h => h.location)).size,
    }
  }

  // Chart data calculations
  async getChartData() {
    const hazards = await this.getAllHazards()
    
    const hazardsByType = hazards.reduce((acc, hazard) => {
      acc[hazard.hazardType] = (acc[hazard.hazardType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const hazardsByStatus = hazards.reduce((acc, hazard) => {
      acc[hazard.status] = (acc[hazard.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const hazardsBySeverity = hazards.reduce((acc, hazard) => {
      acc[hazard.severity] = (acc[hazard.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

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
      hazardsByType: Object.entries(hazardsByType).map(([name, value], index) => ({
        name,
        value,
        fill: `hsl(${(index * 360) / Object.keys(hazardsByType).length}, 70%, 50%)`,
      })),
      hazardsByStatus: Object.entries(hazardsByStatus).map(([name, value]) => ({
        name,
        value,
        fill: statusColors[name as keyof typeof statusColors] || "hsl(215, 20%, 65%)",
      })),
      hazardsBySeverity: Object.entries(hazardsBySeverity).map(([name, value]) => ({
        name,
        value,
        fill: severityColors[name as keyof typeof severityColors] || "hsl(215, 20%, 65%)",
      })),
    }
  }

  // File operations
  async uploadFile(file: File, metadata?: Record<string, any>): Promise<string> {
    const db = await this.ensureDB()
    const fileId = crypto.randomUUID()
    const arrayBuffer = await file.arrayBuffer()

    const offlineFile: OfflineFile = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      data: arrayBuffer,
      metadata: {
        ...metadata,
        originalName: file.name,
        uploadDate: new Date(),
      },
      createdAt: new Date(),
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE, SYNC_QUEUE_STORE], 'readwrite')
      const filesStore = transaction.objectStore(FILES_STORE)
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE)

      const filesRequest = filesStore.add(offlineFile)
      
      // Add to sync queue
      const syncItem: SyncQueueItem = {
        id: crypto.randomUUID(),
        action: 'CREATE',
        table: 'files',
        data: offlineFile,
        timestamp: new Date(),
        synced: false
      }
      const syncRequest = syncStore.add(syncItem)

      filesRequest.onsuccess = () => {
        syncRequest.onsuccess = () => resolve(fileId)
        syncRequest.onerror = () => reject(syncRequest.error)
      }
      filesRequest.onerror = () => reject(filesRequest.error)
    })
  }

  async getFile(fileId: string): Promise<OfflineFile | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readonly')
      const store = transaction.objectStore(FILES_STORE)
      const request = store.get(fileId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE, SYNC_QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(FILES_STORE)
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE)

      const getRequest = store.get(fileId)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (!item) {
          resolve(false)
          return
        }

        const deleteRequest = store.delete(fileId)
        
        // Add to sync queue
        const syncItem: SyncQueueItem = {
          id: crypto.randomUUID(),
          action: 'DELETE',
          table: 'files',
          data: { id: fileId },
          timestamp: new Date(),
          synced: false
        }
        const syncRequest = syncStore.add(syncItem)

        deleteRequest.onsuccess = () => {
          syncRequest.onsuccess = () => resolve(true)
          syncRequest.onerror = () => reject(syncRequest.error)
        }
        deleteRequest.onerror = () => reject(deleteRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Sync queue operations
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly')
        const store = transaction.objectStore(SYNC_QUEUE_STORE)
        const request = store.getAll()

        request.onsuccess = () => {
          // Filter for unsynced items on the client side
          const allItems = request.result as SyncQueueItem[]
          const unsyncedItems = allItems.filter(item => !item.synced)
          resolve(unsyncedItems)
        }
        request.onerror = () => reject(request.error)
      } catch (error) {
        console.error('Error creating transaction for getPendingSyncItems:', error)
        reject(error)
      }
    })
  }

  async markSyncItemAsSynced(syncId: string | number): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(SYNC_QUEUE_STORE)
      const request = store.get(syncId)

      request.onsuccess = () => {
        const item = request.result
        if (item) {
          item.synced = true
          const updateRequest = store.put(item)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Check if we're online
  isOnline(): boolean {
    return navigator.onLine
  }

  // Listen for online/offline events
  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

export const offlineStorage = new OfflineStorageService()

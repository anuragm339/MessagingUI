// MessageTrackerAPI.js - API Service Module
// Handles all API calls with proper error handling and response transformation

import {
  transformClustersResponse,
  transformTrackingResponse,
  transformMessagesResponse,
  createTrackingRequest,
  validateClustersResponse,
  validateTrackingResponse,
  handleAPIError
} from './apiHelpers.js'

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api'
const USE_MOCK_DATA = true // Set to false when backend is ready

// Mock data for testing


/**
 * API Service class for MessageTracker
 * Centralized API calls with error handling
 */
export class MessageTrackerAPI {

  /**
   * Fetch clusters by message key
   * @param {string} messageKey - Message key to fetch clusters for
   * @returns {Promise<{clusters: Array}>}
   */
  static async fetchClustersByMessageKey(messageKey) {
    try {
      console.log('📡 Fetching clusters for message key:', messageKey)

      let clusterIds

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        // Mock response - array of cluster IDs
        clusterIds = [
          "7293a0f2-bd28-4b73-b81c-5165d3ddded0",
          "ebc392ba-ec9e-4af6-b973-c3beefb9dce7"
        ]
      } else {
        const response = await fetch(`${API_BASE_URL}/clusters/${encodeURIComponent(messageKey)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        clusterIds = await response.json()
      }

      // Validate response is an array
      if (!Array.isArray(clusterIds)) {
        throw new Error('Invalid clusters response - expected array of cluster IDs')
      }

      // Transform cluster IDs to cluster objects with names
      const clusters = clusterIds.map((id, index) => ({
        id: id,
        name: `Cluster ${index + 1}`, // You might want to fetch names separately
        stores: []
      }))

      console.log('✅ Clusters fetched:', clusters.length, 'clusters')

      return { clusters }
    } catch (error) {
      console.error('❌ Failed to fetch clusters:', error)
      const errorMessage = handleAPIError(error, 'fetching clusters')
      throw new Error(errorMessage)
    }
  }

  /**
   * Fetch stores by cluster ID
   * @param {string} clusterId - Cluster ID to fetch stores for
   * @returns {Promise<{stores: Array}>}
   */
  static async fetchStoresByCluster(clusterId) {
    try {
      console.log('📡 Fetching stores for cluster:', clusterId)

      let responseData

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        // Mock response - nested object matching real API format
        responseData = {
          [clusterId]: {
            "9a6c17d6-f542-45e4-b525-3984974f6203": ["9749"],
            "1389934c-525a-44df-b0dd-e20032044fb3": ["9345"],
            "ef242da1-004d-4bda-a775-3c1bb3bd1f4e": ["9321"],
            "7cc45342-3b31-4bde-ba28-a93057708743": ["9778"],
            "c0cda4cb-0d6c-4708-ab29-714baf632ca6": ["9316"],
            "cf553240-f818-4257-bcc7-6ee03e3a8db5": ["8769"],
            "98ff1cdb-25d8-435f-a592-7de3187e85f8": ["6775"],
            "9a6c17d6-f542-44e4-b525-3984974f6203": ["7749"],
            "1389934c-525a-46df-b0dd-e20032044fb3": ["2345"],
            "ef242da1-004d-47da-a775-3c1bb3bd1f4e": ["1321"],
            "7cc45342-3b31-48de-ba28-a93057708743": ["2178"],
            "c0cda4cb-0d6c-4908-ab29-714baf632ca6": ["2216"],
            "cf553240-f818-2157-bcc7-6ee03e3a8db5": ["2269"],
            "98ff1cdb-25d8-225f-a592-7de3187e85f8": ["2375"]
          }
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/clusters/${encodeURIComponent(clusterId)}/stores`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        responseData = await response.json()
      }

      console.log('📦 Raw API response:', responseData)

      // Handle different response formats
      let stores = []

      if (Array.isArray(responseData)) {
        // Format 1: Simple array ["1001", "1002", "1003"]
        stores = responseData.map(id => ({
          id: String(id),
          storeId: String(id),
          storeNumber: String(id),
          name: String(id)
        }))
      } else if (typeof responseData === 'object' && responseData !== null) {
        // Format 2: Nested object with cluster ID as key
        // { "7293a0f2-...": { "storeId1": ["9749"], "storeId2": ["9345"], ... } }

        // Get the data for this specific cluster
        const clusterData = responseData[clusterId]

        if (clusterData && typeof clusterData === 'object') {
          // Extract stores with both storeId (UUID) and storeNumber
          stores = Object.entries(clusterData).flatMap(([storeId, storeNumbers]) => {
            // Each storeId can have multiple store numbers
            return storeNumbers.map(storeNumber => ({
              id: storeId, // UUID
              storeId: storeId, // UUID
              storeNumber: String(storeNumber), // Actual store number like "9749"
              name: String(storeNumber) // Display the store number
            }))
          })
          console.log('📊 Extracted stores from nested structure:', stores)
        } else {
          throw new Error('Invalid stores response - cluster data not found')
        }
      } else {
        throw new Error('Invalid stores response - expected array or object')
      }

      // Validate we have stores
      if (!Array.isArray(stores) || stores.length === 0) {
        throw new Error('No stores found in response')
      }

      console.log('✅ Stores fetched:', stores.length, 'stores')

      return { stores }
    } catch (error) {
      console.error('❌ Failed to fetch stores:', error)
      const errorMessage = handleAPIError(error, 'fetching stores')
      throw new Error(errorMessage)
    }
  }

  /**
   * Fetch paginated stores for a message with overall POS status
   * @param {string} messageKey - Message key
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @param {string} search - Optional search query for filtering stores
   * @returns {Promise<Object>} Pageable store data with overall status
   */
  static async fetchStoresByMessage(messageKey, page = 0, size = 20, search = '') {
    try {
      console.log(`📡 Fetching stores: message=${messageKey}, page=${page}, size=${size}, search=${search}`)

      let data

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Generate mock pageable response
        const totalElements = 7 // Simulate 7 stores
        const totalPages = Math.ceil(totalElements / size)
        const startIdx = page * size
        const endIdx = Math.min(startIdx + size, totalElements)

        const allStores = []
        for (let i = 0; i < totalElements; i++) {
          const storeNumber = String(9749 + i)
          const total = Math.floor(Math.random() * 10) + 5
          const delivered = Math.floor(Math.random() * total)
          const failed = Math.floor(Math.random() * (total - delivered))
          const pending = Math.floor(Math.random() * (total - delivered - failed))
          const processing = total - delivered - failed - pending

          allStores.push({
            storeId: `store-uuid-${i + 1}`,
            name: storeNumber,
            overall: {
              total,
              delivered,
              pending,
              failed,
              processing
            }
          })
        }

        // Filter by search query if provided
        let filteredStores = allStores
        if (search && search.trim()) {
          const searchLower = search.toLowerCase()
          filteredStores = allStores.filter(store =>
            store.name.toLowerCase().includes(searchLower) ||
            store.storeId.toLowerCase().includes(searchLower)
          )
        }

        // Apply pagination to filtered results
        const filteredTotal = filteredStores.length
        const filteredTotalPages = Math.ceil(filteredTotal / size)
        const content = filteredStores.slice(startIdx, endIdx)

        data = {
          content,
          page,
          size,
          totalElements: filteredTotal,
          totalPages: filteredTotalPages,
          first: page === 0,
          last: page === filteredTotalPages - 1
        }
      } else {
        let url = `${API_BASE_URL}/stores?messageKey=${encodeURIComponent(messageKey)}&page=${page}&size=${size}`
        if (search && search.trim()) {
          url += `&search=${encodeURIComponent(search)}`
        }

        const response = await fetch(
          url,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        data = await response.json()
      }

      console.log(`✅ Stores fetched: ${data.content.length} of ${data.totalElements} total`)
      return data
    } catch (error) {
      console.error('❌ Failed to fetch stores:', error)
      const errorMessage = handleAPIError(error, 'fetching stores')
      throw new Error(errorMessage)
    }
  }

  /**
   * Fetch paginated POS machine data for a store and message
   * @param {string} storeId - Store ID (UUID)
   * @param {string} messageKey - Message key
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @returns {Promise<Object>} Pageable POS machine data
   */
  static async fetchPOSMachines(storeId, messageKey, page = 0, size = 20) {
    try {
      console.log(`📡 Fetching POS machines: store=${storeId}, message=${messageKey}, page=${page}, size=${size}`)

      let data

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Generate mock pageable response
        const totalElements = 45 // Simulate 45 POS machines
        const totalPages = Math.ceil(totalElements / size)
        const startIdx = page * size
        const endIdx = Math.min(startIdx + size, totalElements)

        const content = []
        for (let i = startIdx; i < endIdx; i++) {
          const statuses = ['delivered', 'pending', 'failed', 'processing']
          content.push({
            id: `${storeId}-POS-${String(i + 1).padStart(3, '0')}`,
            name: `POS-${String(i + 1).padStart(3, '0')}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            attempts: Math.floor(Math.random() * 3) + 1
          })
        }

        data = {
          content,
          page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page === totalPages - 1
        }
      } else {
        const response = await fetch(
          `${API_BASE_URL}/pos?messageKey=${encodeURIComponent(messageKey)}&storeId=${encodeURIComponent(storeId)}&page=${page}&size=${size}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        data = await response.json()
      }

      console.log(`✅ POS machines fetched: ${data.content.length} of ${data.totalElements} total`)

      return data
    } catch (error) {
      console.error('❌ Failed to fetch POS machines:', error)
      const errorMessage = handleAPIError(error, 'fetching POS machines')
      throw new Error(errorMessage)
    }
  }

  /**
   * Track a new message
   * @param {string} messageKey - Message identifier
   * @param {string} targetType - 'store' or 'cluster'
   * @param {Array} stores - Array of store objects {id, name}
   * @returns {Promise<Object>} Tracking data
   */
  static async trackMessage(messageKey, targetType, stores) {
    try {
      console.log('📡 Tracking message:', messageKey, 'for', stores.length, 'stores')

      let data

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        data = this._generateMockTrackingData(messageKey, targetType, stores, Date.now())
      } else {
        // Create properly formatted request
        const requestBody = createTrackingRequest(messageKey, targetType, stores)

        const response = await fetch(`${API_BASE_URL}/messages/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        data = await response.json()
      }

      // Validate response
      if (!validateTrackingResponse(data)) {
        throw new Error('Invalid tracking response format')
      }

      // Transform to frontend format
      const transformed = transformTrackingResponse(data)
      console.log('✅ Message tracked:', messageKey)

      return transformed
    } catch (error) {
      console.error('❌ Failed to track message:', error)
      const errorMessage = handleAPIError(error, 'tracking message')
      throw new Error(errorMessage)
    }
  }

  /**
   * Track message by store number
   * @param {string} messageKey - Message identifier
   * @param {string} storeNumber - Store number
   * @returns {Promise<Object>} Tracking data
   */
  static async trackMessageByStore(messageKey, storeNumber) {
    try {
      console.log('📡 Tracking message by store:', messageKey, 'store:', storeNumber)

      let data

      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500))
        data = this._generateMockTrackingData(messageKey, 'store', [{ id: storeNumber, name: storeNumber }], Date.now())
      } else {
        const response = await fetch(`${API_BASE_URL}/messages/track/store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messageKey, storeNumber })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        data = await response.json()
      }

      const transformed = transformTrackingResponse(data)
      console.log('✅ Message tracked by store')
      return transformed
    } catch (error) {
      console.error('❌ Failed to track message by store:', error)
      const errorMessage = handleAPIError(error, 'tracking message by store')
      throw new Error(errorMessage)
    }
  }

  /**
   * Track message for all clusters
   * @param {string} messageKey - Message identifier
   * @param {Array<string>} clusterIds - Array of cluster IDs
   * @returns {Promise<Object>} Tracking data
   */
  static async trackMessageAllClusters(messageKey, clusterIds) {
    try {
      console.log('📡 Tracking message for all clusters:', messageKey, 'clusters:', clusterIds.length)

      let data

      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500))
        // Generate mock data for multiple stores
        const mockStores = []
        for (let i = 0; i < 10; i++) {
          mockStores.push({ id: `store-${i}`, name: `Store ${9749 + i}` })
        }
        data = this._generateMockTrackingData(messageKey, 'cluster', mockStores, Date.now())
      } else {
        const response = await fetch(`${API_BASE_URL}/messages/track/all-clusters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messageKey, clusterIds })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        data = await response.json()
      }

      const transformed = transformTrackingResponse(data)
      console.log('✅ Message tracked for all clusters')
      return transformed
    } catch (error) {
      console.error('❌ Failed to track message for all clusters:', error)
      const errorMessage = handleAPIError(error, 'tracking message for all clusters')
      throw new Error(errorMessage)
    }
  }

  /**
   * Fetch all tracked messages
   * @returns {Promise<{messages: Array}>}
   */
  static async fetchMessages() {
    try {
      console.log('📡 Fetching messages...')

      let data

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200))
        data = { messages: [] }
      } else {
        const response = await fetch(`${API_BASE_URL}/messages`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        data = await response.json()
      }

      // Transform to frontend format
      const transformed = { messages: transformMessagesResponse(data) }
      console.log('✅ Messages fetched:', transformed.messages.length, 'messages')

      return transformed
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error)
      const errorMessage = handleAPIError(error, 'fetching messages')
      throw new Error(errorMessage)
    }
  }

  /**
   * Delete a tracked message
   * @param {string|number} messageId - Message ID
   * @returns {Promise<Object>}
   */
  static async deleteMessage(messageId) {
    try {
      console.log('📡 Deleting message:', messageId)

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200))
        return { success: true }
      }

      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log('✅ Message deleted:', messageId)
      return response.json()
    } catch (error) {
      console.error('❌ Failed to delete message:', error)
      const errorMessage = handleAPIError(error, 'deleting message')
      throw new Error(errorMessage)
    }
  }

  /**
   * Generate mock tracking data for testing
   * @private
   */
  static _generateMockTrackingData(messageKey, targetType, stores, id) {
    const statuses = ['delivered', 'pending', 'failed', 'processing']
    const data = {
      id,
      messageKey,
      targetType,
      timestamp: new Date().toISOString(),
      overall: {
        total: 0,
        delivered: 0,
        pending: 0,
        failed: 0,
        processing: 0
      },
      stores: []
    }

    stores.forEach(store => {
      const posCount = Math.floor(Math.random() * 4) + 2 // 2-5 POS machines
      const storeData = {
        storeId: store.id,
        storeName: store.name,
        overall: {
          total: posCount,
          delivered: 0,
          pending: 0,
          failed: 0,
          processing: 0
        },
        posMachines: []
      }

      for (let i = 1; i <= posCount; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        storeData.posMachines.push({
          id: `${store.id}-POS-${String(i).padStart(2, '0')}`,
          name: `POS-${store.id}-${String(i).padStart(2, '0')}`,
          status,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          attempts: Math.floor(Math.random() * 3) + 1
        })
        storeData.overall[status]++
        data.overall[status]++
      }

      storeData.overall.total = posCount
      data.overall.total += posCount
      data.stores.push(storeData)
    })

    return data
  }

  /**
   * Get API configuration
   * @returns {Object}
   */
  static getConfig() {
    return {
      baseUrl: API_BASE_URL,
      useMockData: USE_MOCK_DATA
    }
  }

  /**
   * Update API configuration
   * @param {Object} config
   */
  static setConfig(config) {
    if (config.baseUrl !== undefined) {
      API_BASE_URL = config.baseUrl
    }
    if (config.useMockData !== undefined) {
      USE_MOCK_DATA = config.useMockData
    }
  }
}

export default MessageTrackerAPI

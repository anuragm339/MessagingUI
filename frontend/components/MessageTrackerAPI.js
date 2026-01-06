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
const mockClusters = [
  {
    id: 'cluster-a',
    name: 'Cluster A',
    stores: [
      { id: '1001', name: 'Store 1001' },
      { id: '1002', name: 'Store 1002' },
      { id: '1003', name: 'Store 1003' }
    ]
  },
  {
    id: 'cluster-b',
    name: 'Cluster B',
    stores: [
      { id: '2001', name: 'Store 2001' },
      { id: '2002', name: 'Store 2002' }
    ]
  },
  {
    id: 'cluster-c',
    name: 'Cluster C',
    stores: [
      { id: '3001', name: 'Store 3001' },
      { id: '3002', name: 'Store 3002' },
      { id: '3003', name: 'Store 3003' },
      { id: '3004', name: 'Store 3004' }
    ]
  }
]

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

      let storeIds

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        // Mock response - array of store IDs
        storeIds = ["1001", "1002", "1003", "1004", "1005"]
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

        storeIds = await response.json()
      }

      // Validate response is an array
      if (!Array.isArray(storeIds)) {
        throw new Error('Invalid stores response - expected array of store IDs')
      }

      // Transform store IDs to store objects
      const stores = storeIds.map(id => ({
        id: String(id),
        name: `Store ${id}`
      }))

      console.log('✅ Stores fetched:', stores.length, 'stores')

      return { stores }
    } catch (error) {
      console.error('❌ Failed to fetch stores:', error)
      const errorMessage = handleAPIError(error, 'fetching stores')
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

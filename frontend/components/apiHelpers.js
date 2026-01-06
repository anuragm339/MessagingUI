// API Helper Methods for Message Tracker
// These methods transform API responses into the format expected by the frontend

/**
 * Transform clusters API response to frontend format
 * @param {Object} apiResponse - Response from GET /api/clusters
 * @returns {Array} Array of cluster objects
 */
export function transformClustersResponse(apiResponse) {
  if (!apiResponse || !apiResponse.clusters) {
    console.error('Invalid clusters response:', apiResponse)
    return []
  }

  return apiResponse.clusters.map(cluster => ({
    id: cluster.id,
    name: cluster.name,
    stores: (cluster.stores || []).map(store => ({
      id: String(store.id), // Ensure ID is string
      name: store.name
    }))
  }))
}

/**
 * Transform tracking response to frontend format
 * @param {Object} apiResponse - Response from POST /api/messages/track
 * @returns {Object} Transformed tracking data
 */
export function transformTrackingResponse(apiResponse) {
  if (!apiResponse) {
    throw new Error('Invalid tracking response')
  }

  return {
    id: apiResponse.id,
    messageKey: apiResponse.messageKey,
    targetType: apiResponse.targetType,
    timestamp: apiResponse.timestamp,
    overall: {
      total: apiResponse.overall?.total || 0,
      delivered: apiResponse.overall?.delivered || 0,
      pending: apiResponse.overall?.pending || 0,
      failed: apiResponse.overall?.failed || 0,
      processing: apiResponse.overall?.processing || 0
    },
    stores: (apiResponse.stores || []).map(transformStoreData)
  }
}

/**
 * Transform messages list response to frontend format
 * @param {Object} apiResponse - Response from GET /api/messages
 * @returns {Array} Array of transformed message objects
 */
export function transformMessagesResponse(apiResponse) {
  if (!apiResponse || !apiResponse.messages) {
    console.error('Invalid messages response:', apiResponse)
    return []
  }

  return apiResponse.messages.map(transformTrackingResponse)
}

/**
 * Transform store data from API to frontend format
 * @param {Object} storeData - Store data from API
 * @returns {Object} Transformed store data
 */
function transformStoreData(storeData) {
  return {
    storeId: String(storeData.storeId),
    storeName: storeData.storeName,
    overall: {
      total: storeData.overall?.total || 0,
      delivered: storeData.overall?.delivered || 0,
      pending: storeData.overall?.pending || 0,
      failed: storeData.overall?.failed || 0,
      processing: storeData.overall?.processing || 0
    },
    posMachines: (storeData.posMachines || []).map(transformPOSData)
  }
}

/**
 * Transform POS machine data from API to frontend format
 * @param {Object} posData - POS machine data from API
 * @returns {Object} Transformed POS data
 */
function transformPOSData(posData) {
  return {
    id: String(posData.id),
    name: posData.name,
    status: normalizeStatus(posData.status),
    timestamp: posData.timestamp,
    attempts: posData.attempts || 1
  }
}

/**
 * Normalize status values to ensure consistency
 * @param {string} status - Status from API
 * @returns {string} Normalized status
 */
function normalizeStatus(status) {
  const statusMap = {
    'delivered': 'delivered',
    'DELIVERED': 'delivered',
    'success': 'delivered',
    'SUCCESS': 'delivered',
    'pending': 'pending',
    'PENDING': 'pending',
    'waiting': 'pending',
    'WAITING': 'pending',
    'failed': 'failed',
    'FAILED': 'failed',
    'error': 'failed',
    'ERROR': 'failed',
    'processing': 'processing',
    'PROCESSING': 'processing',
    'in_progress': 'processing',
    'IN_PROGRESS': 'processing'
  }

  return statusMap[status] || 'pending'
}

/**
 * Create tracking request payload for API
 * @param {string} messageKey - Message key to track
 * @param {string} targetType - Type: 'store' or 'cluster'
 * @param {Array} stores - Array of store objects
 * @returns {Object} Request payload
 */
export function createTrackingRequest(messageKey, targetType, stores) {
  return {
    messageKey: messageKey.trim(),
    targetType,
    stores: stores.map(store => ({
      id: String(store.id),
      name: store.name
    }))
  }
}

/**
 * Validate clusters response from API
 * @param {Object} response - API response
 * @returns {boolean} True if valid
 */
export function validateClustersResponse(response) {
  if (!response || typeof response !== 'object') {
    return false
  }

  if (!Array.isArray(response.clusters)) {
    return false
  }

  return response.clusters.every(cluster => {
    return cluster.id &&
           cluster.name &&
           Array.isArray(cluster.stores)
  })
}

/**
 * Validate tracking response from API
 * @param {Object} response - API response
 * @returns {boolean} True if valid
 */
export function validateTrackingResponse(response) {
  if (!response || typeof response !== 'object') {
    return false
  }

  return response.id &&
         response.messageKey &&
         response.targetType &&
         response.overall &&
         Array.isArray(response.stores)
}

/**
 * Handle API errors and create user-friendly messages
 * @param {Error} error - Error object
 * @param {string} operation - Operation that failed
 * @returns {string} User-friendly error message
 */
export function handleAPIError(error, operation = 'operation') {
  console.error(`API Error during ${operation}:`, error)

  // Network errors
  if (error.message.includes('fetch') || error.message.includes('Network')) {
    return `Network error: Unable to connect to server. Please check your connection.`
  }

  // Timeout errors
  if (error.message.includes('timeout')) {
    return `Request timeout: The server took too long to respond.`
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status

    switch (status) {
      case 400:
        return `Bad request: Please check your input and try again.`
      case 401:
        return `Unauthorized: Please log in again.`
      case 403:
        return `Forbidden: You don't have permission to perform this action.`
      case 404:
        return `Not found: The requested resource doesn't exist.`
      case 500:
        return `Server error: Something went wrong on the server.`
      case 503:
        return `Service unavailable: The server is temporarily down.`
      default:
        return `Error: ${error.message || 'An unexpected error occurred'}`
    }
  }

  return `Error: ${error.message || 'An unexpected error occurred during ' + operation}`
}

/**
 * Calculate statistics from tracking data
 * @param {Object} trackingData - Tracking data object
 * @returns {Object} Calculated statistics
 */
export function calculateStatistics(trackingData) {
  const overall = trackingData.overall

  return {
    totalPOS: overall.total,
    successRate: overall.total > 0
      ? ((overall.delivered / overall.total) * 100).toFixed(1)
      : '0.0',
    failureRate: overall.total > 0
      ? ((overall.failed / overall.total) * 100).toFixed(1)
      : '0.0',
    completionRate: overall.total > 0
      ? (((overall.delivered + overall.failed) / overall.total) * 100).toFixed(1)
      : '0.0',
    inProgress: overall.pending + overall.processing,
    isComplete: overall.pending === 0 && overall.processing === 0,
    hasFailures: overall.failed > 0
  }
}

/**
 * Group stores by status for analysis
 * @param {Array} stores - Array of store objects
 * @returns {Object} Stores grouped by predominant status
 */
export function groupStoresByStatus(stores) {
  const grouped = {
    allDelivered: [],
    hasFailed: [],
    inProgress: [],
    pending: []
  }

  stores.forEach(store => {
    const overall = store.overall

    if (overall.failed > 0) {
      grouped.hasFailed.push(store)
    } else if (overall.delivered === overall.total) {
      grouped.allDelivered.push(store)
    } else if (overall.processing > 0) {
      grouped.inProgress.push(store)
    } else {
      grouped.pending.push(store)
    }
  })

  return grouped
}

/**
 * Sort messages by various criteria
 * @param {Array} messages - Array of message objects
 * @param {string} sortBy - Sort criteria: 'timestamp', 'messageKey', 'successRate', 'failures'
 * @param {string} order - Sort order: 'asc' or 'desc'
 * @returns {Array} Sorted messages
 */
export function sortMessages(messages, sortBy = 'timestamp', order = 'desc') {
  const sorted = [...messages].sort((a, b) => {
    let compareA, compareB

    switch (sortBy) {
      case 'timestamp':
        compareA = new Date(a.timestamp).getTime()
        compareB = new Date(b.timestamp).getTime()
        break

      case 'messageKey':
        compareA = a.messageKey.toLowerCase()
        compareB = b.messageKey.toLowerCase()
        break

      case 'successRate':
        compareA = a.overall.total > 0 ? a.overall.delivered / a.overall.total : 0
        compareB = b.overall.total > 0 ? b.overall.delivered / b.overall.total : 0
        break

      case 'failures':
        compareA = a.overall.failed
        compareB = b.overall.failed
        break

      case 'total':
        compareA = a.overall.total
        compareB = b.overall.total
        break

      default:
        compareA = new Date(a.timestamp).getTime()
        compareB = new Date(b.timestamp).getTime()
    }

    if (order === 'asc') {
      return compareA > compareB ? 1 : -1
    } else {
      return compareA < compareB ? 1 : -1
    }
  })

  return sorted
}

/**
 * Filter messages by status and search query
 * @param {Array} messages - Array of message objects
 * @param {string} filterStatus - Status filter: 'all', 'completed', 'in-progress', 'has-failed'
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered messages
 */
export function filterMessages(messages, filterStatus = 'all', searchQuery = '') {
  return messages.filter(msg => {
    // Search filter
    const matchesSearch = msg.messageKey.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    // Status filter
    if (filterStatus === 'all') return true

    const stats = calculateStatistics(msg)

    switch (filterStatus) {
      case 'completed':
        return stats.isComplete
      case 'in-progress':
        return !stats.isComplete && !stats.hasFailures
      case 'has-failed':
        return stats.hasFailures
      default:
        return true
    }
  })
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @param {string} format - Format type: 'full', 'date', 'time', 'relative'
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp, format = 'full') {
  const date = new Date(timestamp)

  switch (format) {
    case 'full':
      return date.toLocaleString()

    case 'date':
      return date.toLocaleDateString()

    case 'time':
      return date.toLocaleTimeString()

    case 'relative':
      return getRelativeTime(date)

    default:
      return date.toLocaleString()
  }
}

/**
 * Get relative time string (e.g., "5 minutes ago")
 * @param {Date} date - Date object
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}

/**
 * Merge updated message data with existing data
 * @param {Object} existingMessage - Existing message object
 * @param {Object} updatedMessage - Updated message object from API
 * @returns {Object} Merged message object
 */
export function mergeMessageData(existingMessage, updatedMessage) {
  return {
    ...existingMessage,
    ...updatedMessage,
    overall: updatedMessage.overall,
    stores: updatedMessage.stores,
    timestamp: existingMessage.timestamp // Keep original timestamp
  }
}

/**
 * Export tracking data to CSV format
 * @param {Object} trackingData - Tracking data object
 * @returns {string} CSV string
 */
export function exportToCSV(trackingData) {
  const headers = ['Store ID', 'Store Name', 'POS ID', 'POS Name', 'Status', 'Timestamp', 'Attempts']
  const rows = []

  trackingData.stores.forEach(store => {
    store.posMachines.forEach(pos => {
      rows.push([
        store.storeId,
        store.storeName,
        pos.id,
        pos.name,
        pos.status,
        formatTimestamp(pos.timestamp),
        pos.attempts
      ])
    })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Check if data needs refresh based on age
 * @param {string} timestamp - Last update timestamp
 * @param {number} maxAgeMinutes - Maximum age in minutes
 * @returns {boolean} True if data needs refresh
 */
export function needsRefresh(timestamp, maxAgeMinutes = 5) {
  if (!timestamp) return true

  const lastUpdate = new Date(timestamp)
  const now = new Date()
  const ageMinutes = (now - lastUpdate) / 60000

  return ageMinutes >= maxAgeMinutes
}

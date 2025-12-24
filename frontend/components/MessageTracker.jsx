import { useState } from 'react'
import './MessageTracker.css'

// Sample cluster data
const clusters = [
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

// Sample message tracking data generator
const generateTrackingData = (messageKey, targetType, stores, id) => {
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

const MessageTracker = () => {
  const [messageKey, setMessageKey] = useState('')
  const [targetType, setTargetType] = useState('store')
  const [storeNumber, setStoreNumber] = useState('')
  const [selectedCluster, setSelectedCluster] = useState('')
  const [selectedStores, setSelectedStores] = useState([])
  const [trackedMessages, setTrackedMessages] = useState([])
  const [expandedMessages, setExpandedMessages] = useState({})
  const [expandedStores, setExpandedStores] = useState({})
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [storeSearchQuery, setStoreSearchQuery] = useState('')
  const [displayLimit, setDisplayLimit] = useState(50)

  const handleClusterChange = (clusterId) => {
    setSelectedCluster(clusterId)
    setSelectedStores([])
    setStoreSearchQuery('')
    setDisplayLimit(50)
  }

  const handleStoreSelection = (storeId) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId)
      } else {
        return [...prev, storeId]
      }
    })
  }

  const handleSelectAll = () => {
    const cluster = clusters.find(c => c.id === selectedCluster)
    if (cluster) {
      // Filter stores based on search query
      const filteredStores = cluster.stores.filter(store =>
        store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        store.id.toLowerCase().includes(storeSearchQuery.toLowerCase())
      )

      // Check if all filtered stores are already selected
      const allFilteredSelected = filteredStores.every(s => selectedStores.includes(s.id))

      if (allFilteredSelected) {
        // Deselect all filtered stores
        setSelectedStores(prev => prev.filter(id => !filteredStores.find(s => s.id === id)))
      } else {
        // Select all filtered stores
        const newSelections = filteredStores.map(s => s.id)
        setSelectedStores(prev => [...new Set([...prev, ...newSelections])])
      }
    }
  }

  const handleSelectAllInCluster = () => {
    const cluster = clusters.find(c => c.id === selectedCluster)
    if (cluster) {
      if (selectedStores.length === cluster.stores.length) {
        setSelectedStores([])
      } else {
        setSelectedStores(cluster.stores.map(s => s.id))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!messageKey) {
      alert('Please enter a message key')
      return
    }

    // Check if message already exists
    if (trackedMessages.some(msg => msg.messageKey === messageKey)) {
      alert('This message is already being tracked')
      return
    }

    let storesToTrack = []

    if (targetType === 'store') {
      if (!storeNumber) {
        alert('Please enter a store number')
        return
      }
      storesToTrack = [{ id: storeNumber, name: `Store ${storeNumber}` }]
    } else {
      if (!selectedCluster || selectedStores.length === 0) {
        alert('Please select a cluster and at least one store')
        return
      }
      const cluster = clusters.find(c => c.id === selectedCluster)
      storesToTrack = cluster.stores.filter(s => selectedStores.includes(s.id))
    }

    const newMessage = generateTrackingData(
      messageKey,
      targetType,
      storesToTrack,
      Date.now()
    )
    setTrackedMessages(prev => [newMessage, ...prev])

    // Reset form
    setMessageKey('')
    setStoreNumber('')
    setSelectedCluster('')
    setSelectedStores([])
  }

  const handleRemoveMessage = (messageId) => {
    setTrackedMessages(prev => prev.filter(msg => msg.id !== messageId))
    // Clean up expanded states
    setExpandedMessages(prev => {
      const updated = { ...prev }
      delete updated[messageId]
      return updated
    })
  }

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  const toggleStoreExpansion = (messageId, storeId) => {
    const key = `${messageId}-${storeId}`
    setExpandedStores(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return '#4caf50'
      case 'pending':
        return '#ff9800'
      case 'failed':
        return '#f44336'
      case 'processing':
        return '#2196f3'
      default:
        return '#999'
    }
  }

  const getSuccessRate = (message) => {
    if (message.overall.total === 0) return 0
    return ((message.overall.delivered / message.overall.total) * 100).toFixed(1)
  }

  const getOverallStatus = (message) => {
    if (message.overall.failed > 0) return 'has-failed'
    if (message.overall.pending > 0 || message.overall.processing > 0) return 'in-progress'
    return 'completed'
  }

  const filteredMessages = trackedMessages.filter(msg => {
    const matchesSearch = msg.messageKey.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (filterStatus === 'all') return true
    const status = getOverallStatus(msg)
    return status === filterStatus
  })

  const currentCluster = clusters.find(c => c.id === selectedCluster)

  return (
    <div className="message-tracker-container">
      <div className="tracker-header">
        <h2>Message Tracker</h2>
        <p>Track multiple messages across stores and POS machines</p>
      </div>

      {/* Add New Message Form */}
      <div className="add-message-section">
        <button
          className="toggle-form-btn"
          onClick={() => {
            const form = document.querySelector('.tracker-form')
            form.classList.toggle('collapsed')
          }}
        >
          + Add New Message to Track
        </button>

        <form onSubmit={handleSubmit} className="tracker-form collapsed">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="messageKey">Message Key *</label>
              <input
                type="text"
                id="messageKey"
                value={messageKey}
                onChange={(e) => setMessageKey(e.target.value)}
                placeholder="e.g., UPDATE_CONFIG_001"
                required
              />
            </div>

            <div className="form-group">
              <label>Target Type *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="store"
                    checked={targetType === 'store'}
                    onChange={(e) => setTargetType(e.target.value)}
                  />
                  Store
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="cluster"
                    checked={targetType === 'cluster'}
                    onChange={(e) => setTargetType(e.target.value)}
                  />
                  Cluster
                </label>
              </div>
            </div>
          </div>

          {targetType === 'store' ? (
            <div className="form-group">
              <label htmlFor="storeNumber">Store Number *</label>
              <input
                type="text"
                id="storeNumber"
                value={storeNumber}
                onChange={(e) => setStoreNumber(e.target.value)}
                placeholder="Enter store number (e.g., 1001)"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="cluster">Select Cluster *</label>
                <select
                  id="cluster"
                  value={selectedCluster}
                  onChange={(e) => handleClusterChange(e.target.value)}
                  required
                >
                  <option value="">-- Select Cluster --</option>
                  {clusters.map(cluster => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCluster && currentCluster && (
                <div className="form-group">
                  <div className="store-selection-header">
                    <label>Select Stores * ({selectedStores.length} selected)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="select-all-btn"
                        title="Select/Deselect all visible stores"
                      >
                        {(() => {
                          const filteredStores = currentCluster.stores.filter(store =>
                            store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                            store.id.toLowerCase().includes(storeSearchQuery.toLowerCase())
                          )
                          const allFilteredSelected = filteredStores.every(s => selectedStores.includes(s.id))
                          return allFilteredSelected && filteredStores.length > 0 ? 'Deselect Visible' : 'Select Visible'
                        })()}
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectAllInCluster}
                        className="select-all-btn"
                        title="Select/Deselect entire cluster"
                      >
                        {selectedStores.length === currentCluster.stores.length
                          ? 'Deselect All'
                          : 'Select All in Cluster'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Search stores by name or ID..."
                      value={storeSearchQuery}
                      onChange={(e) => setStoreSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div className="checkbox-group">
                    {(() => {
                      const filteredStores = currentCluster.stores.filter(store =>
                        store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                        store.id.toLowerCase().includes(storeSearchQuery.toLowerCase())
                      )
                      const displayedStores = filteredStores.slice(0, displayLimit)

                      return (
                        <>
                          {displayedStores.map(store => (
                            <label key={store.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedStores.includes(store.id)}
                                onChange={() => handleStoreSelection(store.id)}
                              />
                              {store.name}
                            </label>
                          ))}
                          {filteredStores.length > displayLimit && (
                            <div style={{
                              gridColumn: '1 / -1',
                              textAlign: 'center',
                              padding: '12px',
                              borderTop: '1px solid #e0e0e0',
                              marginTop: '8px'
                            }}>
                              <button
                                type="button"
                                onClick={() => setDisplayLimit(prev => prev + 50)}
                                className="select-all-btn"
                                style={{ width: 'auto', minWidth: '150px' }}
                              >
                                Load More ({filteredStores.length - displayLimit} remaining)
                              </button>
                            </div>
                          )}
                          {filteredStores.length === 0 && (
                            <div style={{
                              gridColumn: '1 / -1',
                              textAlign: 'center',
                              padding: '20px',
                              color: '#999'
                            }}>
                              No stores found matching "{storeSearchQuery}"
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {currentCluster.stores.length > 50 && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#666',
                      textAlign: 'center'
                    }}>
                      Showing {Math.min(displayLimit, currentCluster.stores.filter(store =>
                        store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                        store.id.toLowerCase().includes(storeSearchQuery.toLowerCase())
                      ).length)} of {currentCluster.stores.length} stores in cluster
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button type="submit" className="submit-btn">
            Add to Tracker
          </button>
        </form>
      </div>

      {/* Filters and Search */}
      {trackedMessages.length > 0 && (
        <div className="controls-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <label>Filter by status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Messages</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="has-failed">Has Failed</option>
            </select>
          </div>
        </div>
      )}

      {/* Messages Table */}
      {filteredMessages.length > 0 ? (
        <div className="messages-table-container">
          <table className="messages-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Message Key</th>
                <th>Type</th>
                <th>Total POS</th>
                <th>Delivered</th>
                <th>Processing</th>
                <th>Pending</th>
                <th>Failed</th>
                <th>Success Rate</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map(message => (
                <>
                  <tr key={message.id} className={`message-row ${getOverallStatus(message)}`}>
                    <td>
                      <button
                        className="expand-btn-table"
                        onClick={() => toggleMessageExpansion(message.id)}
                      >
                        {expandedMessages[message.id] ? '▼' : '▶'}
                      </button>
                    </td>
                    <td className="message-key-cell">
                      <strong>{message.messageKey}</strong>
                    </td>
                    <td>
                      <span className="type-badge">{message.targetType}</span>
                    </td>
                    <td className="numeric-cell">{message.overall.total}</td>
                    <td className="numeric-cell">
                      <span className="status-chip delivered">
                        {message.overall.delivered}
                      </span>
                    </td>
                    <td className="numeric-cell">
                      <span className="status-chip processing">
                        {message.overall.processing}
                      </span>
                    </td>
                    <td className="numeric-cell">
                      <span className="status-chip pending">
                        {message.overall.pending}
                      </span>
                    </td>
                    <td className="numeric-cell">
                      <span className="status-chip failed">
                        {message.overall.failed}
                      </span>
                    </td>
                    <td className="numeric-cell">
                      <div className="success-rate">
                        <span>{getSuccessRate(message)}%</span>
                        <div className="mini-progress">
                          <div
                            className="mini-progress-bar"
                            style={{ width: `${getSuccessRate(message)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="timestamp-cell">
                      {new Date(message.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveMessage(message.id)}
                        title="Remove from tracker"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedMessages[message.id] && (
                    <tr className="expanded-details-row">
                      <td colSpan="11">
                        <div className="expanded-content">
                          <h4>Store Details for {message.messageKey}</h4>
                          <div className="stores-grid">
                            {message.stores.map(store => (
                              <div key={store.storeId} className="store-detail-card">
                                <div
                                  className="store-card-header"
                                  onClick={() => toggleStoreExpansion(message.id, store.storeId)}
                                >
                                  <div className="store-card-title">
                                    <button className="expand-icon-small">
                                      {expandedStores[`${message.id}-${store.storeId}`] ? '▼' : '▶'}
                                    </button>
                                    <strong>{store.storeName}</strong>
                                  </div>
                                  <div className="store-card-stats">
                                    <span className="stat-mini delivered" title="Delivered">
                                      ✓ {store.overall.delivered}
                                    </span>
                                    <span className="stat-mini processing" title="Processing">
                                      ⟳ {store.overall.processing}
                                    </span>
                                    <span className="stat-mini pending" title="Pending">
                                      ⏱ {store.overall.pending}
                                    </span>
                                    <span className="stat-mini failed" title="Failed">
                                      ✗ {store.overall.failed}
                                    </span>
                                  </div>
                                </div>

                                {expandedStores[`${message.id}-${store.storeId}`] && (
                                  <div className="pos-machines-list">
                                    <table className="pos-detail-table">
                                      <thead>
                                        <tr>
                                          <th>POS Machine</th>
                                          <th>Status</th>
                                          <th>Last Update</th>
                                          <th>Attempts</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {store.posMachines.map(pos => (
                                          <tr key={pos.id}>
                                            <td>{pos.name}</td>
                                            <td>
                                              <span
                                                className={`status-indicator ${pos.status}`}
                                                style={{ backgroundColor: getStatusColor(pos.status) }}
                                              >
                                                {pos.status}
                                              </span>
                                            </td>
                                            <td>{new Date(pos.timestamp).toLocaleTimeString()}</td>
                                            <td>{pos.attempts}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Messages Being Tracked</h3>
          <p>Add a message above to start tracking its delivery status</p>
        </div>
      )}
    </div>
  )
}

export default MessageTracker

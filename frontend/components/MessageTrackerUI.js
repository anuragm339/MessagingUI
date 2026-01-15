// MessageTrackerUI.js - UI Rendering Module
// Handles all HTML generation and rendering

/**
 * UI Renderer for MessageTracker
 * Pure functions for generating HTML
 */
export class MessageTrackerUI {

  /**
   * Render the complete UI
   * @param {Object} state - Current state
   * @param {Object} methods - Helper methods
   * @returns {string} HTML string
   */
  static render(state, methods) {
    const currentCluster = methods.getCurrentCluster(state)
    const filteredMessages = methods.getFilteredMessages(state)

    return `
      <div class="message-tracker-container">
        ${state.loading ? this.renderLoadingOverlay() : ''}

        ${this.renderHeader()}

        ${state.error ? this.renderError(state.error) : ''}

        ${this.renderAddMessageSection(state, currentCluster, methods)}

        ${state.trackedMessages.length > 0 ? this.renderControls(state) : ''}

        ${this.renderMessagesTable(state, filteredMessages, methods)}
      </div>
    `
  }

  /**
   * Render loading overlay
   */
  static renderLoadingOverlay() {
    return `
      <div class="loading-overlay">
        <div class="spinner"></div>
      </div>
    `
  }

  /**
   * Render header section
   */
  static renderHeader() {
    return `
      <div class="tracker-header">
        <div>
          <h2>Message Tracker</h2>
          <p>Track multiple messages across stores and POS machines</p>
        </div>
        <button class="refresh-btn" data-action="refresh-messages" title="Refresh message list">
          🔄 Refresh
        </button>
      </div>
    `
  }

  /**
   * Render error message
   */
  static renderError(error) {
    return `<div class="error-message">${error}</div>`
  }

  /**
   * Render add message section
   */
  static renderAddMessageSection(state, currentCluster, methods) {
    return `
      <div class="add-message-section">
        <button class="toggle-form-btn" data-action="toggle-form">
          + Add New Message to Track
        </button>

        <form class="tracker-form ${state.formExpanded ? '' : 'collapsed'}" data-form="tracker">
          ${this.renderForm(state, currentCluster, methods)}
        </form>
      </div>
    `
  }

  /**
   * Render form
   */
  static renderForm(state, currentCluster, methods) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label for="messageKey">Message Key *</label>
          <input
            type="text"
            id="messageKey"
            name="messageKey"
            value="${state.messageKey}"
            placeholder="e.g., UPDATE_CONFIG_001"
            required
          />
          ${state.messageKey.trim() === '' ? '<small style="color: #999;">Enter message key to load clusters</small>' : ''}
        </div>

        <div class="form-group">
          <label>Target Type *</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                name="targetType"
                value="store"
                ${state.targetType === 'store' ? 'checked' : ''}
                ${!state.messageKey.trim() ? 'disabled' : ''}
              />
              Store
            </label>
            <label class="radio-label">
              <input
                type="radio"
                name="targetType"
                value="cluster"
                ${state.targetType === 'cluster' ? 'checked' : ''}
                ${!state.messageKey.trim() ? 'disabled' : ''}
              />
              Cluster
            </label>
          </div>
        </div>
      </div>

      ${state.messageKey.trim() ? this.renderTargetSelection(state, currentCluster, methods) : ''}

      <button type="submit" class="submit-btn" ${state.loading || !state.messageKey.trim() ? 'disabled' : ''}>
        ${state.loading ? 'Adding...' : 'Add to Tracker'}
      </button>
    `
  }

  /**
   * Render cluster selection (cluster-only mode)
   */
  static renderClusterSelection(state, currentCluster, methods) {
    return `
      <div class="form-group">
        <label for="cluster">Select Cluster *</label>
        ${state.loadingClusters ? '<div style="padding: 8px; color: #999;">Loading clusters...</div>' : ''}
        <select id="cluster" name="cluster" required ${state.loadingClusters ? 'disabled' : ''}>
          <option value="">-- Select Cluster --</option>
          <option value="ALL_CLUSTERS" ${state.selectedCluster === 'ALL_CLUSTERS' ? 'selected' : ''}>
            All Clusters
          </option>
          ${state.clusters.map(cluster => `
            <option value="${cluster.id}" ${state.selectedCluster === cluster.id ? 'selected' : ''}>
              ${cluster.name}
            </option>
          `).join('')}
        </select>
      </div>

      ${state.selectedCluster && state.selectedCluster !== 'ALL_CLUSTERS' && currentCluster ? this.renderStoreSelection(state, currentCluster, methods) : ''}
    `
  }

  /**
   * Render target selection (store or cluster) - DEPRECATED, kept for compatibility
   */
  static renderTargetSelection(state, currentCluster, methods) {
    if (state.targetType === 'store') {
      return `
        <div class="form-group">
          <label for="storeNumber">Store Number *</label>
          <input
            type="text"
            id="storeNumber"
            name="storeNumber"
            value="${state.storeNumber}"
            placeholder="Enter store number (e.g., 1001)"
            required
          />
        </div>
      `
    } else {
      return `
        <div class="form-group">
          <label for="cluster">Select Cluster *</label>
          ${state.loadingClusters ? '<div style="padding: 8px; color: #999;">Loading clusters...</div>' : ''}
          <select id="cluster" name="cluster" required ${state.loadingClusters ? 'disabled' : ''}>
            <option value="">-- Select Cluster --</option>
            <option value="ALL_CLUSTERS" ${state.selectedCluster === 'ALL_CLUSTERS' ? 'selected' : ''}>
              All Clusters
            </option>
            ${state.clusters.map(cluster => `
              <option value="${cluster.id}" ${state.selectedCluster === cluster.id ? 'selected' : ''}>
                ${cluster.name}
              </option>
            `).join('')}
          </select>
        </div>

        ${state.selectedCluster && state.selectedCluster !== 'ALL_CLUSTERS' && currentCluster ? this.renderStoreSelection(state, currentCluster, methods) : ''}
      `
    }
  }

  /**
   * Render store selection
   */
  static renderStoreSelection(state, currentCluster, methods) {
    const filteredStores = methods.getFilteredStores(state, currentCluster)
    const displayedStores = filteredStores.slice(0, state.displayLimit)
    const allFilteredSelected = filteredStores.every(s => state.selectedStores.includes(s.id))

    return `
      <div class="form-group">
        <div class="store-selection-header">
          <label>Select Stores * (${state.selectedStores.length} selected)</label>
          <div style="display: flex; gap: 8px;">
            <button
              type="button"
              class="select-all-btn"
              data-action="select-visible"
              title="Select/Deselect all visible stores"
            >
              ${allFilteredSelected && filteredStores.length > 0 ? 'Deselect Visible' : 'Select Visible'}
            </button>
            <button
              type="button"
              class="select-all-btn"
              data-action="select-all-cluster"
              title="Select/Deselect entire cluster"
            >
              ${state.selectedStores.length === currentCluster.stores.length ? 'Deselect All' : 'Select All in Cluster'}
            </button>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <input
            type="text"
            id="storeSearch"
            placeholder="Search stores by name or ID..."
            value="${state.storeSearchQuery}"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
          />
        </div>

        <div class="checkbox-group">
          ${displayedStores.map(store => `
            <label class="checkbox-label">
              <input
                type="checkbox"
                class="store-checkbox"
                data-store-id="${store.id}"
                ${state.selectedStores.includes(store.id) ? 'checked' : ''}
              />
              ${store.name}
            </label>
          `).join('')}

          ${filteredStores.length > state.displayLimit ? `
            <div style="grid-column: 1 / -1; text-align: center; padding: 12px; border-top: 1px solid #e0e0e0; margin-top: 8px;">
              <button
                type="button"
                class="select-all-btn"
                data-action="load-more"
                style="width: auto; min-width: 150px;"
              >
                Load More (${filteredStores.length - state.displayLimit} remaining)
              </button>
            </div>
          ` : ''}

          ${filteredStores.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #999;">
              No stores found matching "${state.storeSearchQuery}"
            </div>
          ` : ''}
        </div>

        ${currentCluster.stores.length > 50 ? `
          <div style="margin-top: 8px; font-size: 12px; color: #666; text-align: center;">
            Showing ${Math.min(state.displayLimit, filteredStores.length)} of ${currentCluster.stores.length} stores in cluster
          </div>
        ` : ''}
      </div>
    `
  }

  /**
   * Render controls (search/filter)
   */
  static renderControls(state) {
    return `
      <div class="controls-bar">
        <div class="search-box">
          <input
            type="text"
            id="messageSearch"
            placeholder="Search messages..."
            value="${state.searchQuery}"
            class="search-input"
          />
        </div>
        <div class="filter-group">
          <label>Filter by status:</label>
          <select id="statusFilter" class="filter-select">
            <option value="all" ${state.filterStatus === 'all' ? 'selected' : ''}>All Messages</option>
            <option value="completed" ${state.filterStatus === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="in-progress" ${state.filterStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="has-failed" ${state.filterStatus === 'has-failed' ? 'selected' : ''}>Has Failed</option>
          </select>
        </div>
      </div>
    `
  }

  /**
   * Render messages table
   */
  static renderMessagesTable(state, filteredMessages, methods) {
    if (filteredMessages.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Messages Being Tracked</h3>
          <p>Add a message above to start tracking its delivery status</p>
        </div>
      `
    }

    return `
      <div class="messages-table-container">
        <table class="messages-table">
          <thead>
            <tr>
              <th style="width: 40px"></th>
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
            ${filteredMessages.map(message => this.renderMessageRow(state, message, methods)).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  /**
   * Render single message row
   */
  static renderMessageRow(state, message, methods) {
    const isExpanded = state.expandedMessages[message.id]
    const successRate = methods.getSuccessRate(message)
    const overallStatus = methods.getOverallStatus(message)

    return `
      <tr class="message-row ${overallStatus}">
        <td>
          <button class="expand-btn-table" data-action="toggle-message" data-message-id="${message.id}">
            ${isExpanded ? '▼' : '▶'}
          </button>
        </td>
        <td class="message-key-cell">
          <strong>${message.messageKey}</strong>
        </td>
        <td>
          <span class="type-badge">${message.targetType}</span>
        </td>
        <td class="numeric-cell">${message.overall.total}</td>
        <td class="numeric-cell">
          <span class="status-chip delivered">${message.overall.delivered}</span>
        </td>
        <td class="numeric-cell">
          <span class="status-chip processing">${message.overall.processing}</span>
        </td>
        <td class="numeric-cell">
          <span class="status-chip pending">${message.overall.pending}</span>
        </td>
        <td class="numeric-cell">
          <span class="status-chip failed">${message.overall.failed}</span>
        </td>
        <td class="numeric-cell">
          <div class="success-rate">
            <span>${successRate}%</span>
            <div class="mini-progress">
              <div class="mini-progress-bar" style="width: ${successRate}%"></div>
            </div>
          </div>
        </td>
        <td class="timestamp-cell">
          ${new Date(message.timestamp).toLocaleString()}
        </td>
        <td>
          <button class="remove-btn" data-action="remove-message" data-message-id="${message.id}" title="Remove from tracker">
            ✕
          </button>
        </td>
      </tr>
      ${isExpanded ? this.renderExpandedRow(state, message, methods) : ''}
    `
  }

  /**
   * Render expanded message details with paginated stores
   */
  static renderExpandedRow(state, message, methods) {
    const messageId = message.id
    const isLoading = state.loadingStores && state.loadingStores[messageId]
    const storesData = state.storesPagination && state.storesPagination[messageId]

    console.log('🎨 Rendering expanded row for:', message.messageKey, 'loading:', isLoading, 'storesData:', !!storesData)

    // Show loading state if loading and no data yet
    if (isLoading && !storesData) {
      return `
        <tr class="expanded-details-row">
          <td colspan="11">
            <div class="expanded-content">
              <h4>Store Details for ${message.messageKey}</h4>
              <div class="loading-details">
                <div class="spinner"></div>
                <p>Loading stores...</p>
              </div>
            </div>
          </td>
        </tr>
      `
    }

    // Use paginated stores if available, otherwise fall back to cached stores
    const stores = storesData ? storesData.content : (message.stores || [])
    const showPagination = storesData && storesData.totalPages > 1

    return `
      <tr class="expanded-details-row">
        <td colspan="11">
          <div class="expanded-content">
            ${isLoading ? '<div class="loading-overlay-small"><div class="spinner"></div></div>' : ''}
            <h4>Store Details for ${message.messageKey}</h4>

            <div style="margin-bottom: 16px;">
              <input
                type="text"
                class="store-filter-input"
                data-message-id="${messageId}"
                data-action="filter-stores"
                placeholder="Search stores by name or ID..."
                value="${state.storeFilterQuery && state.storeFilterQuery[messageId] || ''}"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
              />
            </div>

            <div class="stores-grid">
              ${stores.map(store => this.renderStoreCard(state, message.id, store, methods)).join('')}
            </div>
            ${showPagination ? `
              <div class="stores-pagination">
                <button
                  class="pagination-btn"
                  data-action="stores-prev-page"
                  data-message-id="${messageId}"
                  data-current-page="${storesData.page}"
                  ${storesData.first ? 'disabled' : ''}
                >
                  ← Previous
                </button>

                <span class="pagination-info">
                  Page ${storesData.page + 1} of ${storesData.totalPages}
                  (${storesData.totalElements} stores)
                </span>

                <button
                  class="pagination-btn"
                  data-action="stores-next-page"
                  data-message-id="${messageId}"
                  data-current-page="${storesData.page}"
                  ${storesData.last ? 'disabled' : ''}
                >
                  Next →
                </button>
              </div>
            ` : ''}
          </div>
        </td>
      </tr>
    `
  }

  /**
   * Render store detail card
   */
  static renderStoreCard(state, messageId, store, methods) {
    const key = `${messageId}-${store.storeId}`
    const isExpanded = state.expandedStores[key]
    const storeName = store.storeName || store.name || store.storeId

    console.log('  🏪 Rendering store card:', storeName, 'POS:', store.posMachines?.length)

    return `
      <div class="store-detail-card">
        <div class="store-card-header" data-action="toggle-store" data-key="${key}">
          <div class="store-card-title">
            <button class="expand-icon-small">
              ${isExpanded ? '▼' : '▶'}
            </button>
            <strong>${storeName}</strong>
          </div>
          <div class="store-card-stats">
            <span class="stat-mini delivered" title="Delivered">✓ ${store.overall.delivered}</span>
            <span class="stat-mini processing" title="Processing">⟳ ${store.overall.processing}</span>
            <span class="stat-mini pending" title="Pending">⏱ ${store.overall.pending}</span>
            <span class="stat-mini failed" title="Failed">✗ ${store.overall.failed}</span>
          </div>
        </div>

        ${isExpanded ? this.renderPOSMachinesList(state, messageId, store, methods) : ''}
      </div>
    `
  }

  /**
   * Render POS machines list with pagination
   */
  static renderPOSMachinesList(state, messageId, store, methods) {
    const key = `${messageId}-${store.storeId}`
    const isLoading = state.loadingPOSMachines && state.loadingPOSMachines[key]
    const posData = state.posPagination && state.posPagination[key]

    if (isLoading && !posData) {
      return `
        <div class="pos-machines-list">
          <div class="loading-details">
            <div class="spinner"></div>
            <p>Loading POS machines...</p>
          </div>
        </div>
      `
    }

    const posMachines = posData ? posData.content : (store.posMachines || [])

    return `
      <div class="pos-machines-list">
        ${isLoading ? '<div class="loading-overlay-small"><div class="spinner"></div></div>' : ''}

        <table class="pos-detail-table">
          <thead>
            <tr>
              <th>POS Machine</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            ${posMachines.map(pos => `
              <tr>
                <td>${pos.name}</td>
                <td>
                  <span class="status-indicator ${pos.status}" style="background-color: ${methods.getStatusColor(pos.status)}">
                    ${pos.status}
                  </span>
                </td>
                <td>${new Date(pos.timestamp).toLocaleTimeString()}</td>
                <td>${pos.attempts}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }
}

export default MessageTrackerUI

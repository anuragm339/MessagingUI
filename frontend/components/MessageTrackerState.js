// MessageTrackerState.js - State Management Module
// Centralized state management with change notifications

/**
 * State Manager for MessageTracker
 * Handles all state changes and notifies listeners
 */
export class MessageTrackerState {
  constructor(initialState = {}) {
    this.state = {
      // Form state
      messageKey: '',
      targetType: 'cluster',
      storeNumber: '',
      selectedCluster: '',
      selectedStores: [],

      // Data state
      clusters: [],
      trackedMessages: [],

      // UI state
      expandedMessages: {},
      expandedStores: {},
      filterStatus: 'all',
      searchQuery: '',
      storeSearchQuery: '',
      displayLimit: 50,
      formExpanded: false,

      // Loading/Error state
      loading: false,
      error: null,
      loadingClusters: false,
      loadingStores: {},        // Object mapping messageId → boolean
      storesPagination: {},     // Object mapping messageId → {page, size, total, totalPages, content}
      loadingPOSMachines: {},   // Object mapping storeKey → boolean
      posPagination: {},        // Object mapping storeKey → {page, size, total, totalPages, content}

      ...initialState
    }

    this.listeners = []
    this.initialState = { ...this.state }
  }

  /**
   * Get current state
   * @returns {Object}
   */
  getState() {
    return { ...this.state }
  }

  /**
   * Get a specific state value
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this.state[key]
  }

  /**
   * Update state and notify listeners
   * @param {Object} updates - State updates
   */
  setState(updates) {
    console.log('🔄 State update:', Object.keys(updates))

    const oldState = { ...this.state }
    this.state = { ...this.state, ...updates }

    // Notify all listeners
    this.notifyListeners(oldState, this.state)
  }

  /**
   * Reset state to initial values
   * @param {boolean} keepClusters - Keep loaded clusters
   */
  reset(keepClusters = true) {
    console.log('🔄 Resetting state...')

    const clustersToKeep = keepClusters ? this.state.clusters : []

    this.setState({
      ...this.initialState,
      clusters: clustersToKeep
    })
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function (oldState, newState) => {}
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of state change
   * @private
   */
  notifyListeners(oldState, newState) {
    this.listeners.forEach(listener => {
      try {
        listener(oldState, newState)
      } catch (error) {
        console.error('❌ Error in state listener:', error)
      }
    })
  }

  /**
   * Clear all listeners
   */
  clearListeners() {
    this.listeners = []
  }

  /**
   * Get debug info
   * @returns {Object}
   */
  debug() {
    return {
      state: this.getState(),
      listeners: this.listeners.length,
      initialState: this.initialState
    }
  }
}

export default MessageTrackerState

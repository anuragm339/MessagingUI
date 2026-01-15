// MessageTracker2.js - Modular Vanilla JavaScript Message Tracker
// Refactored for better debugging and maintainability

import { MessageTrackerAPI } from './MessageTrackerAPI.js'
import { MessageTrackerState } from './MessageTrackerState.js'
import { MessageTrackerUI } from './MessageTrackerUI.js'

/**
 * MessageTracker Component
 * Clean, modular architecture:
 * - MessageTrackerAPI: Handles all API calls
 * - MessageTrackerState: Manages application state
 * - MessageTrackerUI: Renders the UI
 * - MessageTracker2: Orchestrates everything
 */
class MessageTracker2 {
  constructor(containerId, options = {}) {
    console.log('🚀 Initializing MessageTracker2...')

    this.container = document.getElementById(containerId)
    if (!this.container) {
      throw new Error(`Container element #${containerId} not found`)
    }

    this.options = {
      clearOnTabSwitch: options.clearOnTabSwitch || false,
      clearOnTabHide: options.clearOnTabHide || false,
      ...options
    }

    // Initialize modules
    this.state = new MessageTrackerState()
    this.api = MessageTrackerAPI

    // Bind methods
    this.render = this.render.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleRemoveMessage = this.handleRemoveMessage.bind(this)

    // Debounce timers
    this.searchDebounceTimer = null

    // Subscribe to state changes
    this.state.subscribe((oldState, newState) => {
      console.log('📊 State changed, re-rendering...')
      this.render()
    })

    // Initialize
    this.init()
  }

  /**
   * Initialize the component
   */
  async init() {
    console.log('⚙️  Setting up MessageTracker...')

    // Initial render
    this.render()

    // Setup event delegation
    this.setupEventDelegation()

    // Setup tab visibility listener (if enabled)
    this.setupTabVisibilityListener()

    // Load initial messages (no clusters until message key is entered)
    await this.loadMessages()

    console.log('✅ MessageTracker initialized')
  }

  /**
   * Load tracked messages from API
   */
  async loadMessages() {
    try {
      const data = await this.api.fetchMessages()
      this.state.setState({ trackedMessages: data.messages })
    } catch (error) {
      console.error('❌ Failed to load messages:', error)
      this.state.setState({ error: error.message })
    }
  }

  /**
   * Load clusters from API (only called when "Cluster" target type is selected)
   */
  async loadClusters() {
    const messageKey = this.state.get('messageKey')

    if (!messageKey || !messageKey.trim()) {
      console.log('⚠️  No message key - skipping cluster load')
      return
    }

    try {
      console.log('📡 Loading clusters for message key:', messageKey)
      this.state.setState({ loadingClusters: true, error: null })

      const data = await this.api.fetchClustersByMessageKey(messageKey.trim())

      this.state.setState({
        clusters: data.clusters,
        loadingClusters: false,
        selectedCluster: '', // Reset selected cluster
        selectedStores: [] // Reset selected stores
      })

      console.log('✅ Clusters loaded:', data.clusters.length)
    } catch (error) {
      console.error('❌ Failed to load clusters:', error)
      this.state.setState({
        error: 'Failed to load clusters: ' + error.message,
        loadingClusters: false
      })
    }
  }

  /**
   * Load stores for a selected cluster
   */
  async loadStoresForCluster(clusterId) {
    if (!clusterId) {
      console.log('⚠️  No cluster ID - skipping store load')
      return
    }

    try {
      console.log('📡 Loading stores for cluster:', clusterId)
      this.state.setState({ loadingClusters: true, error: null })

      const data = await this.api.fetchStoresByCluster(clusterId)

      // Update the stores for the selected cluster
      const currentState = this.state.getState()
      const updatedClusters = currentState.clusters.map(cluster => {
        if (cluster.id === clusterId) {
          return { ...cluster, stores: data.stores }
        }
        return cluster
      })

      this.state.setState({
        clusters: updatedClusters,
        loadingClusters: false
      })

      console.log('✅ Stores loaded:', data.stores.length, 'for cluster', clusterId)
    } catch (error) {
      console.error('❌ Failed to load stores:', error)
      this.state.setState({
        error: 'Failed to load stores: ' + error.message,
        loadingClusters: false
      })
    }
  }

  /**
   * Clear all data and reset to initial state
   */
  clearAllData(keepClusters = true) {
    console.log('🗑️  Clearing all tracking data...')
    this.state.reset(keepClusters)
    console.log('✅ All data cleared!')
  }

  /**
   * Setup tab visibility listener for data clearing
   */
  setupTabVisibilityListener() {
    if (!this.options.clearOnTabSwitch && !this.options.clearOnTabHide) {
      return
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.options.clearOnTabHide) {
          console.log('👁️  Tab hidden - clearing data...')
          this.clearAllData(true)
        }
      } else {
        if (this.options.clearOnTabSwitch) {
          console.log('👁️  Tab visible - reloading fresh data...')
          this.clearAllData(true)
          this.loadMessages()
        }
      }
    })

    console.log('👁️  Tab visibility listener enabled')
  }

  /**
   * Setup event delegation for all interactions
   */
  setupEventDelegation() {
    console.log('🎯 Setting up event delegation...')

    // Click events
    this.container.addEventListener('click', (e) => {
      const target = e.target
      const action = target.dataset.action || target.closest('[data-action]')?.dataset.action

      this.handleAction(action, e)
    })

    // Input events
    this.container.addEventListener('input', (e) => {
      this.handleInput(e)
    })

    // Change events
    this.container.addEventListener('change', (e) => {
      this.handleChange(e)
    })

    // Form submission
    this.container.addEventListener('submit', (e) => {
      if (e.target.dataset.form === 'tracker') {
        this.handleSubmit(e)
      }
    })
  }

  /**
   * Handle action clicks
   */
  handleAction(action, e) {
    const target = e.target

    switch (action) {
      case 'toggle-form':
        e.preventDefault()
        this.state.setState({
          formExpanded: !this.state.get('formExpanded')
        })
        break

      case 'refresh-messages':
        e.preventDefault()
        this.handleRefreshMessages()
        break

      case 'select-visible':
        e.preventDefault()
        this.handleSelectVisible()
        break

      case 'select-all-cluster':
        e.preventDefault()
        this.handleSelectAllCluster()
        break

      case 'load-more':
        e.preventDefault()
        this.state.setState({
          displayLimit: this.state.get('displayLimit') + 50
        })
        break

      case 'toggle-message':
        e.preventDefault()
        this.handleToggleMessage(target)
        break

      case 'remove-message':
        e.preventDefault()
        this.handleRemoveMessage(target)
        break

      case 'toggle-store':
        this.handleToggleStore(target)
        break

      case 'stores-prev-page':
      case 'stores-next-page':
        e.preventDefault()
        const messageId = target.dataset.messageId
        const storesCurrentPage = parseInt(target.dataset.currentPage)
        const storesNewPage = action === 'stores-prev-page' ? storesCurrentPage - 1 : storesCurrentPage + 1
        this.handleStoresPagination(messageId, storesNewPage)
        break
    }
  }

  /**
   * Handle input changes
   */
  handleInput(e) {
    const target = e.target
    const currentState = this.state.getState()

    if (target.id === 'messageKey') {
      const messageKey = target.value
      const wasEmpty = !currentState.messageKey.trim()
      const isNowFilled = messageKey.trim()
      const isEmpty = !messageKey.trim()

      // Update state silently (no re-render) for text input
      this.state.state.messageKey = messageKey

      // Only re-render when transitioning from empty to filled (to enable radio buttons)
      if (wasEmpty && isNowFilled) {
        this.render()
      }

      // Re-render when transitioning from filled to empty (to disable radio buttons)
      if (!wasEmpty && isEmpty) {
        this.state.setState({
          messageKey: '',
          clusters: [],
          selectedCluster: '',
          selectedStores: []
        })
      }
    } else if (target.id === 'storeNumber') {
      // Update state silently (no re-render) for text input
      this.state.state.storeNumber = target.value
    } else if (target.id === 'storeSearch') {
      // Update state silently (no re-render) for search inputs
      this.state.state.storeSearchQuery = target.value

      // Debounce re-render for search (300ms delay)
      clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.render()
      }, 300)
    } else if (target.id === 'messageSearch') {
      // Update state silently (no re-render) for search inputs
      this.state.state.searchQuery = target.value

      // Debounce re-render for search (300ms delay)
      clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.render()
      }, 300)
    } else if (target.classList.contains('store-filter-input')) {
      // Handle store filter with API call
      const messageId = parseInt(target.dataset.messageId)
      const searchQuery = target.value

      // Update state
      const storeFilterQuery = { ...this.state.get('storeFilterQuery') }
      storeFilterQuery[messageId] = searchQuery
      this.state.state.storeFilterQuery = storeFilterQuery

      // Debounce API call (500ms delay)
      clearTimeout(this.storeFilterDebounceTimer)
      this.storeFilterDebounceTimer = setTimeout(() => {
        this.handleStoreFilter(messageId, searchQuery)
      }, 500)
    } else if (target.classList.contains('store-checkbox')) {
      const storeId = target.dataset.storeId
      const selectedStores = [...currentState.selectedStores]

      if (target.checked) {
        if (!selectedStores.includes(storeId)) {
          selectedStores.push(storeId)
        }
      } else {
        const index = selectedStores.indexOf(storeId)
        if (index > -1) {
          selectedStores.splice(index, 1)
        }
      }

      this.state.setState({ selectedStores })
    }
  }

  /**
   * Handle change events (radio, select)
   */
  handleChange(e) {
    const target = e.target
    const currentState = this.state.getState()

    if (target.name === 'targetType') {
      console.log('🔄 Target type changed to:', target.value)
      this.state.setState({
        targetType: target.value,
        clusters: [], // Clear clusters when switching
        selectedCluster: '',
        selectedStores: []
      })

      // Load clusters if switching to cluster mode and message key exists
      if (target.value === 'cluster' && currentState.messageKey.trim()) {
        console.log('📡 Triggering cluster load for message key:', currentState.messageKey)
        this.loadClusters()
      }
    } else if (target.id === 'cluster') {
      const clusterId = target.value

      this.state.setState({
        selectedCluster: clusterId,
        selectedStores: [],
        storeSearchQuery: '',
        displayLimit: 50
      })

      // Load stores when cluster is selected
      if (clusterId) {
        console.log('📡 Triggering store load for cluster:', clusterId)
        this.loadStoresForCluster(clusterId)
      }
    } else if (target.id === 'statusFilter') {
      this.state.setState({ filterStatus: target.value })
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault()
    console.log('📝 Form submitted')

    const currentState = this.state.getState()

    if (!currentState.messageKey.trim()) {
      alert('Please enter a message key')
      return
    }

    // Check if message already exists
    if (currentState.trackedMessages.some(msg => msg.messageKey === currentState.messageKey)) {
      alert('This message is already being tracked')
      return
    }

    let storesToTrack = []

    if (currentState.targetType === 'store') {
      if (!currentState.storeNumber) {
        alert('Please enter a store number')
        return
      }
      storesToTrack = [{ id: currentState.storeNumber, name: `Store ${currentState.storeNumber}` }]
    } else {
      if (!currentState.selectedCluster || currentState.selectedStores.length === 0) {
        alert('Please select a cluster and at least one store')
        return
      }
      const cluster = currentState.clusters.find(c => c.id === currentState.selectedCluster)
      storesToTrack = cluster.stores.filter(s => currentState.selectedStores.includes(s.id))
    }

    try {
      this.state.setState({ loading: true })

      const newMessage = await this.api.trackMessage(
        currentState.messageKey,
        currentState.targetType,
        storesToTrack
      )

      console.log('📝 New message tracked:', newMessage)

      // In mock mode, add to existing messages. In real mode, fetch from backend
      const apiConfig = this.api.getConfig()
      let trackedMessages

      if (apiConfig.useMockData) {
        // Mock mode: Add new message to existing list
        trackedMessages = [newMessage, ...currentState.trackedMessages]
      } else {
        // Real mode: Fetch updated list from backend
        const messagesData = await this.api.fetchMessages()
        trackedMessages = messagesData.messages
      }

      this.state.setState({
        trackedMessages,
        messageKey: '',
        storeNumber: '',
        selectedCluster: '',
        selectedStores: [],
        formExpanded: false,
        loading: false
      })

      console.log('✅ Message added to tracking')
    } catch (error) {
      console.error('❌ Failed to track message:', error)
      alert('Failed to track message: ' + error.message)
      this.state.setState({ loading: false })
    }
  }

  /**
   * Handle toggle message expand/collapse
   * Fetches paginated stores when expanding
   */
  async handleToggleMessage(target) {
    const btn = target.closest('[data-message-id]')
    if (!btn) return

    const messageId = parseInt(btn.dataset.messageId)
    const currentState = this.state.getState()
    const expandedMessages = { ...currentState.expandedMessages }
    const wasExpanded = expandedMessages[messageId]

    // If collapsing, just toggle
    if (wasExpanded) {
      expandedMessages[messageId] = false
      this.state.setState({ expandedMessages })
      console.log('🔼 Collapsed message:', messageId)
      return
    }

    // If expanding, fetch paginated stores
    try {
      // Find the message to get messageKey
      const message = currentState.trackedMessages.find(m => m.id === messageId)
      if (!message) {
        throw new Error('Message not found')
      }

      console.log('🔽 Expanding message:', messageId, '- fetching stores')

      // Set loading state
      const loadingStores = { ...currentState.loadingStores }
      loadingStores[messageId] = true
      expandedMessages[messageId] = true

      this.state.setState({
        expandedMessages,
        loadingStores,
        error: null
      })

      // Fetch first page of stores
      const storesData = await this.api.fetchStoresByMessage(message.messageKey, 0, 20)

      // Store pagination data
      const updatedState = this.state.getState()
      const storesPagination = { ...updatedState.storesPagination }
      storesPagination[messageId] = storesData

      // Clear loading state
      const finalLoadingState = { ...updatedState.loadingStores }
      delete finalLoadingState[messageId]

      this.state.setState({
        storesPagination,
        loadingStores: finalLoadingState
      })

      console.log('✅ Stores loaded for message:', messageId)
    } catch (error) {
      console.error('❌ Failed to fetch stores:', error)

      // Clear loading state and show error
      const errorState = this.state.getState()
      const finalLoadingState = { ...errorState.loadingStores }
      delete finalLoadingState[messageId]

      this.state.setState({
        error: 'Failed to load stores: ' + error.message,
        loadingStores: finalLoadingState
      })
    }
  }

  /**
   * Handle refresh messages
   */
  async handleRefreshMessages() {
    try {
      console.log('🔄 Refreshing messages...')
      this.state.setState({ loading: true, error: null })

      const messagesData = await this.api.fetchMessages()

      this.state.setState({
        trackedMessages: messagesData.messages,
        loading: false
      })

      console.log('✅ Messages refreshed:', messagesData.messages.length)
    } catch (error) {
      console.error('❌ Failed to refresh messages:', error)
      this.state.setState({
        error: 'Failed to refresh messages: ' + error.message,
        loading: false
      })
    }
  }

  /**
   * Handle remove message
   */
  async handleRemoveMessage(target) {
    const btn = target.closest('[data-message-id]')
    if (!btn) return

    const messageId = parseInt(btn.dataset.messageId)

    try {
      await this.api.deleteMessage(messageId)

      const currentState = this.state.getState()
      const expandedMessages = { ...currentState.expandedMessages }
      delete expandedMessages[messageId]

      this.state.setState({
        trackedMessages: currentState.trackedMessages.filter(msg => msg.id !== messageId),
        expandedMessages
      })

      console.log('✅ Message removed')
    } catch (error) {
      console.error('❌ Failed to remove message:', error)
      alert('Failed to remove message: ' + error.message)
    }
  }

  /**
   * Handle toggle store expand/collapse
   * Fetches paginated POS data when expanding
   */
  async handleToggleStore(target) {
    const header = target.closest('[data-key]')
    if (!header) return

    const key = header.dataset.key // Format: "messageId-storeId"
    const [messageId, storeId] = key.split('-')

    const currentState = this.state.getState()
    const expandedStores = { ...currentState.expandedStores }
    const wasExpanded = expandedStores[key]

    // If collapsing, just toggle
    if (wasExpanded) {
      expandedStores[key] = false
      this.state.setState({ expandedStores })
      console.log('🔼 Collapsed store:', key)
      return
    }

    // If expanding, fetch paginated POS data
    try {
      // Find the message to get messageKey
      const message = currentState.trackedMessages.find(m => m.id === parseInt(messageId))
      if (!message) {
        throw new Error('Message not found')
      }

      console.log('🔽 Expanding store:', key, '- fetching POS data')

      // Set loading state
      const loadingPOSMachines = { ...currentState.loadingPOSMachines }
      loadingPOSMachines[key] = true
      expandedStores[key] = true

      this.state.setState({
        expandedStores,
        loadingPOSMachines,
        error: null
      })

      // Fetch all POS machines (no pagination, use large page size)
      const posData = await this.api.fetchPOSMachines(storeId, message.messageKey, 0, 10000)

      // Store pagination data
      const updatedState = this.state.getState()
      const posPagination = { ...updatedState.posPagination }
      posPagination[key] = posData

      // Clear loading state
      const finalLoadingState = { ...updatedState.loadingPOSMachines }
      delete finalLoadingState[key]

      this.state.setState({
        posPagination,
        loadingPOSMachines: finalLoadingState
      })

      console.log('✅ POS data loaded for store:', key)
    } catch (error) {
      console.error('❌ Failed to fetch POS data:', error)

      // Clear loading state and show error
      const errorState = this.state.getState()
      const finalLoadingState = { ...errorState.loadingPOSMachines }
      delete finalLoadingState[key]

      this.state.setState({
        error: 'Failed to load POS machines: ' + error.message,
        loadingPOSMachines: finalLoadingState
      })
    }
  }

  /**
   * Handle store filter/search
   */
  async handleStoreFilter(messageId, searchQuery) {
    const currentState = this.state.getState()

    // Find the message to get messageKey
    const message = currentState.trackedMessages.find(m => m.id === parseInt(messageId))
    if (!message) return

    try {
      console.log(`🔍 Filtering stores for message ${messageId}:`, searchQuery)

      // Set loading state
      const loadingStores = { ...currentState.loadingStores }
      loadingStores[messageId] = true

      this.state.setState({
        loadingStores,
        error: null
      })

      // Fetch stores with search query
      const storesData = await this.api.fetchStoresByMessage(message.messageKey, 0, 20, searchQuery)

      // Update pagination data
      const updatedState = this.state.getState()
      const storesPagination = { ...updatedState.storesPagination }
      storesPagination[messageId] = storesData

      // Clear loading state
      const finalLoadingState = { ...updatedState.loadingStores }
      delete finalLoadingState[messageId]

      this.state.setState({
        storesPagination,
        loadingStores: finalLoadingState
      })

      console.log(`✅ Filtered stores loaded: ${storesData.content.length} stores`)
    } catch (error) {
      console.error('❌ Failed to filter stores:', error)

      const errorState = this.state.getState()
      const finalLoadingState = { ...errorState.loadingStores }
      delete finalLoadingState[messageId]

      this.state.setState({
        error: 'Failed to filter stores: ' + error.message,
        loadingStores: finalLoadingState
      })
    }
  }

  /**
   * Handle pagination for stores
   */
  async handleStoresPagination(messageId, newPage) {
    const currentState = this.state.getState()

    // Find the message to get messageKey
    const message = currentState.trackedMessages.find(m => m.id === parseInt(messageId))
    if (!message) return

    try {
      console.log(`📄 Loading page ${newPage} for message:`, messageId)

      // Set loading state
      const loadingStores = { ...currentState.loadingStores }
      loadingStores[messageId] = true

      this.state.setState({
        loadingStores,
        error: null
      })

      // Get current search query
      const searchQuery = (currentState.storeFilterQuery && currentState.storeFilterQuery[messageId]) || ''

      // Fetch new page with search query
      const storesData = await this.api.fetchStoresByMessage(message.messageKey, newPage, 20, searchQuery)

      // Update pagination data
      const updatedState = this.state.getState()
      const storesPagination = { ...updatedState.storesPagination }
      storesPagination[messageId] = storesData

      // Clear loading state
      const finalLoadingState = { ...updatedState.loadingStores }
      delete finalLoadingState[messageId]

      this.state.setState({
        storesPagination,
        loadingStores: finalLoadingState
      })

      console.log(`✅ Page ${newPage} loaded for message:`, messageId)
    } catch (error) {
      console.error('❌ Failed to load page:', error)

      const errorState = this.state.getState()
      const finalLoadingState = { ...errorState.loadingStores }
      delete finalLoadingState[messageId]

      this.state.setState({
        error: 'Failed to load stores page: ' + error.message,
        loadingStores: finalLoadingState
      })
    }
  }

  /**
   * Handle pagination for POS machines
   */
  async handlePOSPagination(key, newPage) {
    const [messageId, storeId] = key.split('-')
    const currentState = this.state.getState()

    // Find the message to get messageKey
    const message = currentState.trackedMessages.find(m => m.id === parseInt(messageId))
    if (!message) return

    try {
      console.log(`📄 Loading page ${newPage} for store:`, key)

      // Set loading state
      const loadingPOSMachines = { ...currentState.loadingPOSMachines }
      loadingPOSMachines[key] = true

      this.state.setState({
        loadingPOSMachines,
        error: null
      })

      // Fetch new page
      const posData = await this.api.fetchPOSMachines(storeId, message.messageKey, newPage, 20)

      // Update pagination data
      const updatedState = this.state.getState()
      const posPagination = { ...updatedState.posPagination }
      posPagination[key] = posData

      // Clear loading state
      const finalLoadingState = { ...updatedState.loadingPOSMachines }
      delete finalLoadingState[key]

      this.state.setState({
        posPagination,
        loadingPOSMachines: finalLoadingState
      })

      console.log(`✅ Page ${newPage} loaded for store:`, key)
    } catch (error) {
      console.error('❌ Failed to load page:', error)

      const errorState = this.state.getState()
      const finalLoadingState = { ...errorState.loadingPOSMachines }
      delete finalLoadingState[key]

      this.state.setState({
        error: 'Failed to load page: ' + error.message,
        loadingPOSMachines: finalLoadingState
      })
    }
  }

  /**
   * Handle select visible stores
   */
  handleSelectVisible() {
    const currentState = this.state.getState()
    const currentCluster = this.getCurrentCluster(currentState)
    if (!currentCluster) return

    const filteredStores = this.getFilteredStores(currentState, currentCluster)
    const allFilteredSelected = filteredStores.every(s => currentState.selectedStores.includes(s.id))

    let selectedStores = [...currentState.selectedStores]

    if (allFilteredSelected) {
      selectedStores = selectedStores.filter(id => !filteredStores.find(s => s.id === id))
    } else {
      const newSelections = filteredStores.map(s => s.id)
      selectedStores = [...new Set([...selectedStores, ...newSelections])]
    }

    this.state.setState({ selectedStores })
  }

  /**
   * Handle select all cluster stores
   */
  handleSelectAllCluster() {
    const currentState = this.state.getState()
    const currentCluster = this.getCurrentCluster(currentState)
    if (!currentCluster) return

    if (currentState.selectedStores.length === currentCluster.stores.length) {
      this.state.setState({ selectedStores: [] })
    } else {
      this.state.setState({ selectedStores: currentCluster.stores.map(s => s.id) })
    }
  }

  /**
   * Render the UI
   */
  render() {
    const currentState = this.state.getState()

    // Helper methods for UI rendering
    const methods = {
      getCurrentCluster: this.getCurrentCluster.bind(this),
      getFilteredStores: this.getFilteredStores.bind(this),
      getFilteredMessages: this.getFilteredMessages.bind(this),
      getSuccessRate: this.getSuccessRate.bind(this),
      getOverallStatus: this.getOverallStatus.bind(this),
      getStatusColor: this.getStatusColor.bind(this)
    }

    this.container.innerHTML = MessageTrackerUI.render(currentState, methods)
  }

  // ========== HELPER METHODS ==========

  getCurrentCluster(state) {
    return state.clusters.find(c => c.id === state.selectedCluster)
  }

  getFilteredStores(state, currentCluster) {
    if (!currentCluster) return []

    return currentCluster.stores.filter(store =>
      store.name.toLowerCase().includes(state.storeSearchQuery.toLowerCase()) ||
      store.id.toLowerCase().includes(state.storeSearchQuery.toLowerCase())
    )
  }

  getFilteredMessages(state) {
    return state.trackedMessages.filter(msg => {
      const matchesSearch = msg.messageKey.toLowerCase().includes(state.searchQuery.toLowerCase())
      if (!matchesSearch) return false

      if (state.filterStatus === 'all') return true
      const status = this.getOverallStatus(msg)
      return status === state.filterStatus
    })
  }

  getSuccessRate(message) {
    if (message.overall.total === 0) return 0
    return ((message.overall.delivered / message.overall.total) * 100).toFixed(1)
  }

  getOverallStatus(message) {
    if (message.overall.failed > 0) return 'has-failed'
    if (message.overall.pending > 0 || message.overall.processing > 0) return 'in-progress'
    return 'completed'
  }

  getStatusColor(status) {
    const colors = {
      delivered: '#4caf50',
      pending: '#ff9800',
      failed: '#f44336',
      processing: '#2196f3'
    }
    return colors[status] || '#999'
  }

  /**
   * Get debug information
   */
  debug() {
    return {
      state: this.state.debug(),
      api: this.api.getConfig(),
      container: this.container.id,
      options: this.options
    }
  }
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('message-tracker-root')) {
      window.messageTracker = new MessageTracker2('message-tracker-root')
      console.log('💡 MessageTracker available at: window.messageTracker')
      console.log('💡 Debug info: window.messageTracker.debug()')
    }
  })
}

// Export for module usage
export { MessageTracker2, MessageTrackerAPI, MessageTrackerState, MessageTrackerUI }
export default MessageTracker2

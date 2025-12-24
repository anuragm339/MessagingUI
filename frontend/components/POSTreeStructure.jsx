import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import dagreD3 from 'dagre-d3'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light-border.css'
import './POSTreeStructure.css'

const POSTreeStructure = () => {
  const svgRef = useRef(null)
  const [posData, setPosData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('following') // 'following', 'requested', 'both'
  const [layoutStyle, setLayoutStyle] = useState('Packed LR')
  const [labelProperty, setLabelProperty] = useState('pipe.host')

  // Layout styles matching old implementation
  // LR = Left to Right (cloud on left), RL = Right to Left (cloud on right)
  // BT = Bottom to Top (cloud on bottom), TB = Top to Bottom (cloud on top)
  const styles = {
    "Standard": { rankdir: "BT", ranksep: 50, nodesep: 50, edgesep: 10 },
    "Standard LR": { rankdir: "LR", ranksep: 50, nodesep: 50, edgesep: 10 },
    "Packed": { rankdir: "BT", ranksep: 10, nodesep: 10, edgesep: 5 },
    "Packed LR": { rankdir: "LR", ranksep: 10, nodesep: 10, edgesep: 5 }
  }

  // Fetch tree data from sample JSON
  useEffect(() => {
    fetch('/sampleTreeData.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch tree data')
        return response.json()
      })
      .then(data => {
        setPosData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Build tree structure from following relationships
  const buildTreeStructure = (data) => {
    if (!data || !data.root || !data.followers) return null

    // Create a map of all nodes by their URL
    const nodeMap = new Map()

    // Add root node
    const rootNode = {
      id: data.root.localUrl,
      name: data.root.localUrl.split('/').pop() || 'Cloud API',
      type: 'root',
      status: data.root.status,
      offset: data.root.offset,
      lastSeen: data.root.lastSeen,
      children: []
    }
    nodeMap.set(data.root.localUrl, rootNode)

    // Add all followers as nodes
    data.followers.forEach(follower => {
      const node = {
        id: follower.localUrl,
        name: follower.pipe?.host || follower.localUrl.split('/').pop(),
        type: 'follower',
        status: follower.status,
        pipeState: follower.pipe?.pipeState,
        ip: follower.pipe?.ip,
        group: follower.group,
        following: follower.following || [],
        requestedToFollow: follower.requestedToFollow || [],
        offsets: follower.offsets,
        children: []
      }
      nodeMap.set(follower.localUrl, node)
    })

    return { rootNode, nodeMap }
  }

  useEffect(() => {
    if (!svgRef.current || loading || !posData) return

    // Destroy all existing tooltips before clearing the graph
    d3.select(svgRef.current).selectAll('g.node').each(function() {
      if (this._tippy) {
        this._tippy.destroy()
      }
    })

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove()

    // Build tree structure
    const treeData = buildTreeStructure(posData)
    if (!treeData) return

    const { rootNode, nodeMap } = treeData

    // Function to calculate offset difference between nodes
    const calculateDifference = (parentNode, childNode) => {
      if (parentNode && parentNode.offsets && childNode.offsets) {
        return parentNode.offsets.PIPE_OFFSET - childNode.offsets.PIPE_OFFSET
      } else if (parentNode && parentNode.offset && childNode.offsets) {
        return parseInt(parentNode.offset) - parseInt(childNode.offsets.PIPE_OFFSET)
      } else {
        return "NaN"
      }
    }

    // Function to get label from nested property path
    const getLabelFromProperty = (node, propertyPath) => {
      try {
        return propertyPath.split('.').reduce((obj, key) => obj?.[key], node) || node.name || ''
      } catch (e) {
        return node.name || ''
      }
    }

    // Create a new directed graph with compound support for clustering
    const g = new dagreD3.graphlib.Graph({ compound: true })
      .setGraph(styles[layoutStyle])
      .setDefaultEdgeLabel((v, w) => {
        const parentNode = g.node(w)
        const childNode = g.node(v)
        if (parentNode && childNode) {
          const diff = calculateDifference(parentNode, childNode)
          return { label: typeof diff === 'number' ? diff.toLocaleString() : diff }
        }
        return { label: '' }
      })

    // Function to get icon for node type
    const getIcon = (type) => {
      switch (type) {
        case 'root': return '☁️'
        case 'follower': return '🖥️'
        default: return '📄'
      }
    }

    // Function to get node class for styling
    const getNodeClass = (node) => {
      let classes = `node-${node.type}`
      if (node.pipeState) {
        classes += ` pipe-${node.pipeState.toLowerCase().replace(/_/g, '-')}`
      }
      return classes
    }

    // Function to generate tooltip content for nodes
    const getTooltipContent = (node) => {
      let content = '<div style="text-align: left; font-size: 12px;">'

      // Local URL
      content += `<div style="margin-bottom: 8px;"><strong>URL:</strong> ${node.id || 'N/A'}</div>`

      // Status info
      if (node.status) {
        content += `<div style="margin-bottom: 8px;"><strong>Status:</strong> ${node.status}</div>`
      }
      if (node.lastSeen) {
        content += `<div style="margin-bottom: 8px;"><strong>Last Seen:</strong> ${node.lastSeen}</div>`
      }

      // Offset info
      if (node.offsets) {
        content += `<div style="margin-bottom: 4px;"><strong>Offsets:</strong></div>`
        content += `<div style="margin-left: 12px; margin-bottom: 8px;">`
        if (node.offsets.PIPE_OFFSET !== undefined) {
          content += `<div>PIPE_OFFSET: ${node.offsets.PIPE_OFFSET.toLocaleString()}</div>`
        }
        if (node.offsets.behindRoot !== undefined) {
          content += `<div>Behind Root: ${node.offsets.behindRoot.toLocaleString()}</div>`
        }
        content += `</div>`
      } else if (node.offset !== undefined) {
        content += `<div style="margin-bottom: 8px;"><strong>Offset:</strong> ${node.offset}</div>`
      }

      // Pipe info
      if (node.pipeState) {
        content += `<div style="margin-bottom: 8px;"><strong>Pipe State:</strong> ${node.pipeState}</div>`
      }
      if (node.ip) {
        content += `<div style="margin-bottom: 8px;"><strong>IP:</strong> ${node.ip}</div>`
      }

      // Group info
      if (node.group) {
        content += `<div style="margin-bottom: 8px;"><strong>Group:</strong> ${node.group}</div>`
      }

      content += '</div>'
      return content
    }

    // Add root node
    const rootId = rootNode.id
    let rootLabel = `
      <div class="d3-node-content">
        <span class="d3-node-icon">${getIcon(rootNode.type)}</span>
        <span class="d3-node-name">v1</span>
        <span class="d3-status-badge ${rootNode.status}">${rootNode.status}</span>
      </div>
    `
    g.setNode(rootId, {
      labelType: 'html',
      label: rootLabel,
      class: getNodeClass(rootNode),
      rx: 5,
      ry: 5,
      paddingLeft: 10,
      paddingRight: 10,
      paddingTop: 5,
      paddingBottom: 5
    })

    // Create cluster/group nodes
    const groups = new Set()
    nodeMap.forEach((node) => {
      if (node.type === 'follower' && node.group) {
        groups.add(node.group)
      }
    })

    groups.forEach(groupId => {
      g.setNode(groupId, {
        label: groupId, // Show full group ID
        clusterLabelPos: 'bottom',
        style: 'fill: #f0f0f0; stroke: #ccc; stroke-width: 1px;',
        labelStyle: 'font-size: 11px; font-weight: 600;'
      })
    })

    // Add all follower nodes and parent them to their groups
    nodeMap.forEach((node, nodeId) => {
      if (node.type === 'follower') {
        const displayLabel = getLabelFromProperty(node, labelProperty)
        let labelHtml = `
          <div class="d3-node-content">
            <span class="d3-node-icon">${getIcon(node.type)}</span>
            <span class="d3-node-name">${displayLabel}</span>
            ${node.pipeState ? `<span class="d3-status-badge ${node.pipeState}">${node.pipeState}</span>` : ''}
            ${node.ip ? `<div class="d3-node-ip">${node.ip}</div>` : ''}
          </div>
        `

        g.setNode(nodeId, {
          labelType: 'html',
          label: labelHtml,
          class: getNodeClass(node),
          rx: 5,
          ry: 5,
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 5,
          paddingBottom: 5
        })

        // Parent node to its group for clustering
        if (node.group) {
          g.setParent(nodeId, node.group)
        }
      }
    })

    // Function to get edge style based on difference
    const getEdgeStyle = (difference, isRequested = false, matchesRequested = false) => {
      if (isRequested) {
        // Requested relationships shown in lightcoral/pink
        return 'stroke: lightcoral; stroke-width: 1.5px;'
      }

      // For "both" view mode, color edges based on match with requested
      if (viewMode === 'both') {
        if (matchesRequested) {
          // Following matches requested - black
          return 'stroke: #333; stroke-width: 1.5px;'
        } else {
          // Following differs from requested - grey
          return 'stroke: #999; stroke-width: 1.5px;'
        }
      }

      // Default: simple black arrows for following relationships
      return 'stroke: #333; stroke-width: 1.5px;'
    }

    // Function to get arrowhead style
    const getArrowheadStyle = (isRequested = false, matchesRequested = false) => {
      if (isRequested) {
        return 'stroke: lightcoral; fill: lightcoral;'
      }

      if (viewMode === 'both') {
        if (matchesRequested) {
          return 'stroke: #333; fill: #333;'
        } else {
          return 'stroke: #999; fill: #999;'
        }
      }

      return 'stroke: #333; fill: #333;'
    }

    // Add edges based on view mode and following relationships
    nodeMap.forEach((node, nodeId) => {
      if (node.type !== 'follower') return

      // Add "following" edges if mode is 'following' or 'both'
      if ((viewMode === 'following' || viewMode === 'both') && node.following) {
        let hasValidParent = false

        // Check each URL in the following array
        node.following.forEach(followedUrl => {
          // Determine if this following relationship matches the requested one
          const matchesRequested = node.requestedToFollow &&
            node.requestedToFollow.some(req => req === followedUrl)

          // Check if the followed URL exists in our node map (another follower)
          if (nodeMap.has(followedUrl)) {
            hasValidParent = true
            const parentNode = nodeMap.get(followedUrl)
            const diff = calculateDifference(parentNode, node)
            const diffLabel = typeof diff === 'number' ? diff.toLocaleString() : diff
            g.setEdge(followedUrl, nodeId, {
              curve: d3.curveBasis,
              arrowhead: 'vee',
              label: `Δ ${diffLabel}`,
              labelStyle: 'font-weight: 600; font-size: 11px;',
              style: getEdgeStyle(diff, false, matchesRequested),
              arrowheadStyle: getArrowheadStyle(false, matchesRequested)
            })
          } else if (followedUrl === rootId || followedUrl.includes('api-ppe.abc.com')) {
            // Explicitly following the root/cloud
            hasValidParent = true
            const diff = calculateDifference(rootNode, node)
            const diffLabel = typeof diff === 'number' ? diff.toLocaleString() : diff
            g.setEdge(rootId, nodeId, {
              curve: d3.curveBasis,
              arrowhead: 'vee',
              label: `Δ ${diffLabel}`,
              labelStyle: 'font-weight: 600; font-size: 11px;',
              style: getEdgeStyle(diff, false, matchesRequested),
              arrowheadStyle: getArrowheadStyle(false, matchesRequested)
            })
          }
          // Skip external pipes/unknown URLs - they don't create edges in our tree
        })

        // If no valid parent found in following array, connect to cloud as fallback
        if (!hasValidParent && node.following.length > 0) {
          const matchesRequested = node.requestedToFollow &&
            node.requestedToFollow.some(req => req === rootId || req.includes('api-ppe.abc.com'))
          const diff = calculateDifference(rootNode, node)
          const diffLabel = typeof diff === 'number' ? diff.toLocaleString() : diff
          g.setEdge(rootId, nodeId, {
            curve: d3.curveBasis,
            arrowhead: 'vee',
            label: `Δ ${diffLabel}`,
            labelStyle: 'font-weight: 600; font-size: 11px;',
            style: getEdgeStyle(diff, false, matchesRequested),
            arrowheadStyle: getArrowheadStyle(false, matchesRequested)
          })
        }
      }

      // Add "requested" edges if mode is 'requested' or 'both'
      if ((viewMode === 'requested' || viewMode === 'both') && node.requestedToFollow) {
        node.requestedToFollow.forEach(requestedUrl => {
          // Check if requested URL is another follower
          if (nodeMap.has(requestedUrl)) {
            const requestedParent = nodeMap.get(requestedUrl)
            // Check if already following this node (to avoid duplicate edges in 'both' mode)
            const alreadyFollowing = node.following && node.following.includes(requestedUrl)

            if (!alreadyFollowing || viewMode === 'requested') {
              const diff = calculateDifference(requestedParent, node)
              const diffLabel = typeof diff === 'number' ? diff.toLocaleString() : diff
              g.setEdge(requestedUrl, nodeId, {
                curve: d3.curveBasis,
                arrowhead: 'vee',
                label: `Δ ${diffLabel} (req)`,
                labelStyle: 'font-weight: 600; font-size: 11px;',
                style: getEdgeStyle(diff, true),
                arrowheadStyle: getArrowheadStyle(true)
              })
            }
          } else if (requestedUrl === rootId || requestedUrl.includes('api-ppe.abc.com')) {
            // Requesting to follow cloud
            // Check if already following cloud (to avoid duplicate edges)
            const alreadyFollowingCloud = node.following && node.following.some(url =>
              url === rootId || url.includes('api-ppe.abc.com')
            )

            if (!alreadyFollowingCloud || viewMode === 'requested') {
              const diff = calculateDifference(rootNode, node)
              const diffLabel = typeof diff === 'number' ? diff.toLocaleString() : diff
              g.setEdge(rootId, nodeId, {
                curve: d3.curveBasis,
                arrowhead: 'vee',
                label: `Δ ${diffLabel} (req)`,
                labelStyle: 'font-weight: 600; font-size: 11px;',
                style: getEdgeStyle(diff, true),
                arrowheadStyle: getArrowheadStyle(true)
              })
            }
          }
        })
      }
    })

    // Create the renderer
    const render = new dagreD3.render()

    // Set up an SVG group so that we can translate the final graph
    const svg = d3.select(svgRef.current)
    const svgGroup = svg.append('g')

    // Run the renderer
    render(svgGroup, g)

    // Get graph dimensions
    const graphWidth = g.graph().width
    const graphHeight = g.graph().height

    // Add margins (larger bottom margin for cluster labels)
    const margin = { top: 40, right: 40, bottom: 80, left: 40 }

    // Set SVG dimensions to fit the graph with margins
    const svgWidth = graphWidth + margin.left + margin.right
    const svgHeight = graphHeight + margin.top + margin.bottom

    svg.attr('width', svgWidth)
    svg.attr('height', svgHeight)

    // Position the graph with margins
    svgGroup.attr('transform', `translate(${margin.left}, ${margin.top})`)

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        svgGroup.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Set initial zoom to fit
    const initialScale = Math.min(
      (window.innerWidth - 100) / svgWidth,
      (window.innerHeight - 300) / svgHeight,
      1
    )

    if (initialScale < 1) {
      svg.call(zoom.transform, d3.zoomIdentity.scale(initialScale).translate(margin.left, margin.top))
    }

    // Add tooltips to nodes AFTER zoom is set up
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      svgGroup.selectAll('g.node').each(function(nodeId) {
        const node = g.node(nodeId)
        if (node) {
          // Get the original node data from nodeMap
          const nodeData = nodeId === rootId ? rootNode : nodeMap.get(nodeId)
          if (nodeData) {
            // Destroy any existing tooltip first
            if (this._tippy) {
              this._tippy.destroy()
            }
            tippy(this, {
              content: getTooltipContent(nodeData),
              allowHTML: true,
              arrow: true,
              placement: 'right',
              theme: 'light-border',
              interactive: true,
              delay: [50, 300],
              appendTo: document.body
            })
          }
        }
      })
    }, 100)

  }, [posData, viewMode, layoutStyle, labelProperty])

  if (loading) {
    return (
      <div className="pos-tree-container">
        <div className="tree-header">
          <h2>Messaging Pipe Hierarchy</h2>
          <p>Loading tree structure...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pos-tree-container">
        <div className="tree-header">
          <h2>Messaging Pipe Hierarchy</h2>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-tree-container">
      <div className="tree-header">
        <h2>Messaging Pipe Hierarchy</h2>
        <p>View the follower relationship tree from cloud API to messaging pipes</p>
      </div>

      <div className="tree-controls">
        <div className="filter-group">
          <label htmlFor="view-mode-filter">View Mode:</label>
          <select
            id="view-mode-filter"
            className="view-mode-select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="following">Following</option>
            <option value="requested">Requested</option>
            <option value="both">Following vs Requested</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="layout-style-filter">Layout Style:</label>
          <select
            id="layout-style-filter"
            className="view-mode-select"
            value={layoutStyle}
            onChange={(e) => setLayoutStyle(e.target.value)}
          >
            <option value="Standard">Standard</option>
            <option value="Standard LR">Standard LR</option>
            <option value="Packed">Packed</option>
            <option value="Packed LR">Packed LR</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="label-property-filter">Label Property:</label>
          <select
            id="label-property-filter"
            className="view-mode-select"
            value={labelProperty}
            onChange={(e) => setLabelProperty(e.target.value)}
          >
            <option value="pipe.host">Pipe Host</option>
            <option value="name">Name</option>
            <option value="pipe.ip">Pipe IP</option>
            <option value="group">Location ID (Group)</option>
            <option value="id">Local URL</option>
          </select>
        </div>
      </div>

      <div className="tree-view-d3">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  )
}

export default POSTreeStructure

let activeStartTime = null;
let backgroundStartTime = null;

const pageKey = window.location.href;

const summmary_sample = {
    "activeTime": 31,
    "backgroundTime": 29,
    "notes": [],
    "references": [],
    "summary": ""
}

async function getStoredData() {
    return new Promise((resolve) => {
        chrome.storage.local.get([pageKey], (result) => {
            resolve(result[pageKey] || {
                "activeTime": 0,
                "backgroundTime": 0,
                "notes": [],
                "references": [],
                "summary": ""
            });
        });
    });
}

async function updateDuration(type, duration) {
    const data = await getStoredData();
    data[type] = (data[type] || 0) + duration;

    chrome.storage.local.set({
        [pageKey]: data
    });
    document.querySelector(".recall_ai_time_box")
        .innerHTML = `
      <h3>⏱ Activity Time</h3>
             <p>🟢 Active: ${data['activeTime']}</p>
             <p>⚫️ Background: ${data['activeTime']}</p>
    `;
}

function onVisibilityChange() {
    const now = Date.now();

    if (document.visibilityState === 'visible' && document.hasFocus()) {
        if (backgroundStartTime !== null) {
            const backgroundTime = (now - backgroundStartTime) / 1000;
            updateDuration('backgroundTime', Math.round(backgroundTime));
            backgroundStartTime = null;
        }
        activeStartTime = now;
    } else {
        if (activeStartTime !== null) {
            const activeTime = (now - activeStartTime) / 1000;
            updateDuration('activeTime', Math.round(activeTime));
            activeStartTime = null;
        }
        backgroundStartTime = now;
    }
}

window.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('focus', onVisibilityChange);
window.addEventListener('blur', onVisibilityChange);

// Save time on unload
window.addEventListener('beforeunload', () => {
    const now = Date.now();
    if (activeStartTime !== null) {
        const activeTime = (now - activeStartTime) / 1000;
        updateDuration('activeTime', Math.round(activeTime));
    } else if (backgroundStartTime !== null) {
        const backgroundTime = (now - backgroundStartTime) / 1000;
        updateDuration('backgroundTime', Math.round(backgroundTime));
    }
});



// Configuration
const config = {
    nodeSize: {
        date: 50,
        domain: 40,
        url: 35
    },
    nodeColors: {
        date: '#4a88e5',
        domain: '#55b9f3',
        url: '#72e0d1'
    },
    linkColor: 'rgba(100, 100, 100, 0.5)',
    pulseSpeed: 1500, // milliseconds for pulse animation
    animationDuration: 500, // milliseconds for expand/collapse
    zoomFactor: 1.2, // zoom in/out factor
    nodeSpacing: 20 // minimum spacing between nodes
};

// Graph data structure
const sampleData = {
    "2025-04-10": {
        "youtube.com": {
            "https://youtube.com/watch?v=abc": "Qm123...",
            "https://youtube.com/watch?v=def": "Qm456..."
        },
        "awdwad.com": {}
    },
    "2025-04-09": {
        "example.com": {
            "https://example.com/article": "Qm789..."
        }
    }
};

// Graph state
let nodes = [];
let links = [];
let expandedNodes = new Set();
let hoveredNode = null;
let selectedNode = null;
let animatingNodes = new Set();
let activeAnimations = {};
let canvas, ctx;
let canvasWidth, canvasHeight;
let lastFrameTime = 0;
let isDragging = false;
let isPanning = false;
let dragStartPos = {
    x: 0,
    y: 0
};
let viewOffset = {
    x: 0,
    y: 0
};
let zoomLevel = 1;
let tooltip = document.getElementById('tooltip');
let draggingNode = null;

// Initialize graph
function initializeGraph(nodeJson) {
    // Process top-level date nodes
    const dateKeys = Object.keys(nodeJson);

    nodes = dateKeys.map((date, index) => {
        return {
            id: date,
            type: 'date',
            label: date,
            expanded: false,
            x: canvasWidth / 2,
            y: (index + 1) * 120,
            targetX: canvasWidth / 2,
            targetY: (index + 1) * 120,
            radius: config.nodeSize.date,
            children: [],
            parent: null,
            depth: 0,
            opacity: 1,
            pulsePhase: Math.random() * Math.PI * 2
        };
    });
}

// Build graph nodes for a specific date node
function expandDateNode(dateNode) {
    if (dateNode.expanded) return;

    dateNode.expanded = true;
    expandedNodes.add(dateNode.id);

    const dateData = sampleData[dateNode.id];
    const domainKeys = Object.keys(dateData);

    // Calculate positions in a circular pattern
    const radius = 180;
    const angleStep = (2 * Math.PI) / domainKeys.length;

    domainKeys.forEach((domain, index) => {
        const angle = index * 0.7;
        const domainNode = {
            id: `${dateNode.id}:${domain}`,
            type: 'domain',
            label: domain,
            expanded: false,
            x: dateNode.x,
            y: dateNode.y,
            targetX: dateNode.x + radius * Math.cos(angle),
            targetY: dateNode.y + radius * Math.sin(angle),
            radius: config.nodeSize.domain,
            parent: dateNode,
            children: [],
            depth: 1,
            opacity: 0,
            pulsePhase: Math.random() * Math.PI * 2
        };

        nodes.push(domainNode);
        dateNode.children.push(domainNode);

        links.push({
            source: dateNode,
            target: domainNode,
            opacity: 0
        });

        animatingNodes.add(domainNode.id);
        activeAnimations[domainNode.id] = {
            startTime: performance.now(),
            initialOpacity: 0,
            targetOpacity: 1
        };
    });

    // Prevent overlap
    resolveNodeOverlaps();
}

// Build graph nodes for a specific domain node
function expandDomainNode(domainNode) {
    if (domainNode.expanded) return;

    domainNode.expanded = true;
    expandedNodes.add(domainNode.id);

    const [dateId, domain] = domainNode.id.split(':');
    const urlData = sampleData[dateId][domain];
    const urlKeys = Object.keys(urlData);

    // Calculate positions in a circular pattern
    const radius = 150;
    const angleStep = (2 * Math.PI) / Math.max(urlKeys.length, 1);

    urlKeys.forEach((url, index) => {
        const angle = index * 0.7;
        const urlNode = {
            id: `${domainNode.id}:${url}`,
            type: 'url',
            label: url,
            contentId: urlData[url],
            expanded: false,
            x: domainNode.x,
            y: domainNode.y,
            targetX: domainNode.x + radius * Math.cos(angle),
            targetY: domainNode.y + radius * Math.sin(angle),
            radius: config.nodeSize.url,
            parent: domainNode,
            children: [],
            depth: 2,
            opacity: 0,
            pulsePhase: Math.random() * Math.PI * 2
        };

        nodes.push(urlNode);
        domainNode.children.push(urlNode);

        links.push({
            source: domainNode,
            target: urlNode,
            opacity: 0
        });

        animatingNodes.add(urlNode.id);
        activeAnimations[urlNode.id] = {
            startTime: performance.now(),
            initialOpacity: 0,
            targetOpacity: 1
        };
    });

    // Prevent overlap
    resolveNodeOverlaps();
}

// Collapse a node and its children
function collapseNode(node) {
    if (!node.expanded) return;

    node.expanded = false;
    expandedNodes.delete(node.id);

    // Mark all children for removal
    const nodesToRemove = [];
    const collectNodesToRemove = (nodeList) => {
        nodeList.forEach(child => {
            nodesToRemove.push(child);
            expandedNodes.delete(child.id);
            if (child.children.length > 0) {
                collectNodesToRemove(child.children);
            }

            // Start animation for fading out
            animatingNodes.add(child.id);
            activeAnimations[child.id] = {
                startTime: performance.now(),
                initialOpacity: child.opacity,
                targetOpacity: 0
            };
        });
    };

    collectNodesToRemove(node.children);

    // After animation completes, we'll remove these nodes
    setTimeout(() => {
        // Remove links
        links = links.filter(link => {
            return !nodesToRemove.includes(link.source) && !nodesToRemove.includes(link.target);
        });

        // Remove nodes
        nodes = nodes.filter(n => !nodesToRemove.includes(n));

        // Clear children
        node.children = [];
    }, config.animationDuration);
}

// Toggle node expansion/collapse
function toggleNode(node) {
    if (node.type === 'date') {
        if (node.expanded) {
            collapseNode(node);
        } else {
            expandDateNode(node);
        }
    } else if (node.type === 'domain') {
        if (node.expanded) {
            collapseNode(node);
        } else {
            expandDomainNode(node);
        }
    } else if (node.type === 'url') {
        showModal(node);
    }
}

// Find node under mouse cursor
function findNodeUnderCursor(x, y) {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = node.x - x;
        const dy = node.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= node.radius) {
            return node;
        }
    }
    return null;
}

// Show modal with content
function showModal(node) {
    const modal = document.getElementById('modal');
    const header = document.getElementById('modal-header');
    const body = document.getElementById('modal-body');

    // Extract date and domain from ID
    const parts = node.id.split(':');
    const url = parts[2];
    const domain = parts[1];
    const date = parts[0];

    header.textContent = url;
    body.innerHTML = `
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Domain:</strong> ${domain}</p>
                <p><strong>Content ID:</strong> ${node.contentId}</p>
            `;

    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
}

// Update tooltip position and content
function updateTooltip(x, y, content) {
    tooltip.style.left = `${x + 15}px`;
    tooltip.style.top = `${y + 15}px`;
    tooltip.textContent = content;
    tooltip.style.opacity = 1;
}

function hideTooltip() {
    tooltip.style.opacity = 0;
}

// Draw a node
function drawNode(node, timestamp) {
    if (node.opacity <= 0) return;

    ctx.save();

    // Calculate pulse effect
    const pulseTime = timestamp % config.pulseSpeed / config.pulseSpeed;
    const pulseFactor = node === hoveredNode || node === selectedNode ?
        0.2 * Math.sin(2 * Math.PI * pulseTime + node.pulsePhase) + 1.2 :
        0.05 * Math.sin(2 * Math.PI * pulseTime + node.pulsePhase) + 1;

    // Draw node
    const radius = node.radius * pulseFactor;

    // Draw glow
    const glow = node === hoveredNode || node === selectedNode;
    if (glow) {
        const glowGradient = ctx.createRadialGradient(
            node.x, node.y, radius * 0.8,
            node.x, node.y, radius * 1.8
        );

        let glowColor;
        switch (node.type) {
            case 'date':
                glowColor = 'rgba(74, 136, 229, 0.3)';
                break;
            case 'domain':
                glowColor = 'rgba(85, 185, 243, 0.3)';
                break;
            case 'url':
                glowColor = 'rgba(114, 224, 209, 0.3)';
                break;
        }

        glowGradient.addColorStop(0, glowColor);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw node circle
    const gradient = ctx.createRadialGradient(
        node.x - radius * 0.3, node.y - radius * 0.3, 0,
        node.x, node.y, radius
    );

    let nodeColor = config.nodeColors[node.type];
    gradient.addColorStop(0, nodeColor);
    gradient.addColorStop(1, shadeColor(nodeColor, -30));

    ctx.fillStyle = gradient;
    ctx.globalAlpha = node.opacity;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    if (node === selectedNode) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#ccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // For URLs, truncate the label
    let displayLabel = node.label;
    if (node.type === 'url' && node.label.length > 25) {
        displayLabel = node.label.substring(0, 22) + '...';
    } else if (node.type === 'domain' && node.label.length > 15) {
        displayLabel = node.label.substring(0, 12) + '...';
    }

    ctx.fillText(displayLabel, node.x, node.y);

    ctx.restore();
}

// Draw a link between nodes
function drawLink(link) {
    if (link.opacity <= 0) return;

    ctx.save();
    ctx.strokeStyle = link.source === selectedNode || link.target === selectedNode ?
        'rgba(180, 180, 180, 0.8)' : config.linkColor;
    ctx.lineWidth = link.source === selectedNode || link.target === selectedNode ? 2 : 1;
    ctx.globalAlpha = link.opacity;

    // Draw line with slight curve
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);

    // Simple curved line
    const midX = (link.source.x + link.target.x) / 2;
    const midY = (link.source.y + link.target.y) / 2;
    const offset = 20; // curve offset

    // Calculate perpendicular offset
    const dx = link.target.x - link.source.x;
    const dy = link.target.y - link.source.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = -dy / len * offset;
    const uy = dx / len * offset;

    ctx.quadraticCurveTo(midX + ux, midY + uy, link.target.x, link.target.y);
    ctx.stroke();

    // Draw animated particles along the link if one of the nodes is selected
    if (link.source === selectedNode || link.target === selectedNode) {
        const now = Date.now() / 1000;
        const count = 3; // Number of particles

        for (let i = 0; i < count; i++) {
            const t = (now * 0.5 + i / count) % 1;

            // Position along the curve
            const x = quadraticBezierPoint(
                link.source.x, midX + ux, link.target.x,
                t
            );
            const y = quadraticBezierPoint(
                link.source.y, midY + uy, link.target.y,
                t
            );

            // Draw particle
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
            ctx.fill();
        }
    }

    ctx.restore();
}

// Calculate point on quadratic bezier curve
function quadraticBezierPoint(p0, p1, p2, t) {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

// Update node positions and opacities
function updateNodesAndLinks(timestamp) {
    // Process animations
    for (const nodeId of animatingNodes) {
        const animation = activeAnimations[nodeId];
        const elapsed = timestamp - animation.startTime;
        const progress = Math.min(elapsed / config.animationDuration, 1);

        // Find the node
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        // Update opacity
        if (animation.initialOpacity !== undefined && animation.targetOpacity !== undefined) {
            node.opacity = animation.initialOpacity + (animation.targetOpacity - animation.initialOpacity) * progress;
        }

        // If animation is complete, remove it
        if (progress >= 1) {
            animatingNodes.delete(nodeId);
            delete activeAnimations[nodeId];
        }
    }

    // Update link opacities based on connected nodes
    links.forEach(link => {
        link.opacity = Math.min(link.source.opacity, link.target.opacity);
    });

    // Update node positions with easing
    nodes.forEach(node => {
        const easing = 0.1; // Adjust for faster/slower movement
        node.x += (node.targetX - node.x) * easing;
        node.y += (node.targetY - node.y) * easing;
    });
}

// Resolve node overlaps
function resolveNodeOverlaps() {
    const spacing = config.nodeSpacing;
    nodes.forEach(node => {
        nodes.forEach(otherNode => {
            if (node !== otherNode) {
                const dx = otherNode.x - node.x;
                const dy = otherNode.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = node.radius + otherNode.radius + spacing;

                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDistance - distance;
                    node.x -= Math.cos(angle) * overlap / 2;
                    node.y -= Math.sin(angle) * overlap / 2;
                    otherNode.x += Math.cos(angle) * overlap / 2;
                    otherNode.y += Math.sin(angle) * overlap / 2;
                }
            }
        });
    });
}

// Main render function
function render(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Apply view offset for panning
    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Update nodes and links
    updateNodesAndLinks(timestamp);

    // Draw links first (behind nodes)
    links.forEach(link => drawLink(link));

    // Draw nodes
    nodes.forEach(node => drawNode(node, timestamp));

    ctx.restore();

    // Request next frame
    requestAnimationFrame(render);
}

// Utility function to darken/lighten colors
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = Math.max(0, R).toString(16).padStart(2, '0');
    G = Math.max(0, G).toString(16).padStart(2, '0');
    B = Math.max(0, B).toString(16).padStart(2, '0');

    return `#${R}${G}${B}`;
}

// Setup event handlers
function setupEventHandlers() {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Adjusted position with view offset
        const adjustedX = (x - viewOffset.x) / zoomLevel;
        const adjustedY = (y - viewOffset.y) / zoomLevel;

        // Check if mouse is over a node
        const node = findNodeUnderCursor(adjustedX, adjustedY);

        if (node) {
            canvas.style.cursor = 'pointer';
            hoveredNode = node;

            // Show tooltip
            updateTooltip(e.clientX, e.clientY, node.label);
        } else {
            canvas.style.cursor = isDragging || isPanning ? 'grabbing' : 'default';
            hoveredNode = null;
            hideTooltip();
        }

        // Handle dragging for panning
        if (isPanning) {
            const dx = e.clientX - dragStartPos.x;
            const dy = e.clientY - dragStartPos.y;

            viewOffset.x += dx;
            viewOffset.y += dy;

            dragStartPos.x = e.clientX;
            dragStartPos.y = e.clientY;
        }

        // Handle dragging for moving nodes
        if (draggingNode) {
            draggingNode.targetX = adjustedX;
            draggingNode.targetY = adjustedY;
        }
    });

    canvas.addEventListener('click', (e) => {
        if (isPanning) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - viewOffset.x) / zoomLevel;
        const y = (e.clientY - rect.top - viewOffset.y) / zoomLevel;

        const node = findNodeUnderCursor(x, y);

        if (node) {
            selectedNode = node;
            toggleNode(node);

            // Zoom to active node area
            // zoomToNode(node);
        } else {
            selectedNode = null;
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        // Right click or holding ctrl/cmd for panning
        if (e.button === 2 || e.ctrlKey || e.metaKey) {
            isPanning = true;
            dragStartPos.x = e.clientX;
            dragStartPos.y = e.clientY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        } else {
            // Check if a node is clicked for dragging
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - viewOffset.x) / zoomLevel;
            const y = (e.clientY - rect.top - viewOffset.y) / zoomLevel;
            const node = findNodeUnderCursor(x, y);
            if (node) {
                draggingNode = node;
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        isPanning = false;
        draggingNode = null;
        canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
    });

    canvas.addEventListener('mouseleave', () => {
        isPanning = false;
        draggingNode = null;
        hoveredNode = null;
        hideTooltip();
    });

    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Close modal button
    document.getElementById('close-modal').addEventListener('click', closeModal);

    // Handle resize
    window.addEventListener('resize', setupCanvas);

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        zoomLevel *= config.zoomFactor;
        viewOffset.x = (viewOffset.x - canvasWidth / 2) * config.zoomFactor + canvasWidth / 2;
        viewOffset.y = (viewOffset.y - canvasHeight / 2) * config.zoomFactor + canvasHeight / 2;
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        zoomLevel /= config.zoomFactor;
        viewOffset.x = (viewOffset.x - canvasWidth / 2) / config.zoomFactor + canvasWidth / 2;
        viewOffset.y = (viewOffset.y - canvasHeight / 2) / config.zoomFactor + canvasHeight / 2;
    });

    document.getElementById('reset-zoom').addEventListener('click', () => {
        zoomLevel = 1;
        viewOffset.x = canvasWidth / 2 - 100;
        viewOffset.y = 100;
    });

    // Mouse scroll zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 1 / config.zoomFactor : config.zoomFactor;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom to mouse position
        viewOffset.x = (viewOffset.x - mouseX) * scaleFactor + mouseX;
        viewOffset.y = (viewOffset.y - mouseY) * scaleFactor + mouseY;
        zoomLevel *= scaleFactor;
    });
}

// Zoom to a specific node
function zoomToNode(node) {
    const padding = 50;
    const bbox = {
        left: node.x - node.radius - padding,
        right: node.x + node.radius + padding,
        top: node.y - node.radius - padding,
        bottom: node.y + node.radius + padding
    };

    // Calculate new view offset and zoom level
    const width = bbox.right - bbox.left;
    const height = bbox.bottom - bbox.top;
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;
    const scale = Math.min(scaleX, scaleY);

    viewOffset.x = canvasWidth / 2 - (bbox.left + width / 2) * scale;
    viewOffset.y = canvasHeight / 2 - (bbox.top + height / 2) * scale;
    zoomLevel = scale;
}

// Setup canvas and context
function setupCanvas() {
    canvas = document.getElementById('recall_ai_graph_canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    //
    // Center view
    viewOffset.x = 200 - canvasWidth;
    viewOffset.y = 0;
}

// Initialize everything
function init(nodeJson) {
    setupCanvas();
    initializeGraph(nodeJson);
    setupEventHandlers();
    requestAnimationFrame(render);
}

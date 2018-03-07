const [WIDTH, HEIGHT] = [600, 350];

const DEFAULT_NODE_STYLES = {
    default: {
        radius: 16,
        fill: 'hsl(0, 2%, 76%)',
        stroke: 'black',
    },
    unexplored: {}, // same as default
    explored: {
        fill: 'hsl(200,50%,70%)',
    },
    frontier: {
        fill: 'hsl(0,50%,75%)',
    },
    highlighted: {
        fill: 'Crimson',
    },
    next: {
        fill: 'hsl(126,100%,69%)',
    },
}

const EDGE_STYLES = {
    stroke: 'black',
    strokeWidth: 1,
}

function d3GraphRender(canvasContainerSelector, graph, options) {
    options = options || {};
    const canvasWidth = options.width || WIDTH;
    const canvasHeight = options.height || HEIGHT;
    const nodeStyles = buildNodeStyles(options.styles || {});

    const renderEdgeCosts = !!options.renderEdgeCosts;

    const canvasContainer = d3.select(canvasContainerSelector);

    // remove existing canvas if any
    canvasContainer.select('svg')
        .remove()

    let canvas = canvasContainer.append('svg')
        .attr('width', canvasWidth)
        .attr('height', canvasHeight)
        .attr('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')

    renderAllEdges(canvas, graph, renderEdgeCosts);
    renderAllNodes(canvas, graph, nodeStyles);
}

function renderAllNodes(canvas, graph, styles) {
    let nodes = canvas.selectAll('.node')
        .data(Object.values(graph.nodes), (d) => d.id)

    // create nodes
    nodes.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
        .each((d) => {
            d.style = styles[d.state] || styles.default;
        })
        .call((node) => {
            node.append('circle')
                .attr('r', (d) => d.style.radius)
                .attr('fill', (d) => d.style.fill)
                .attr('stroke', (d) => d.style.stroke)

            node.append('text')
                .attr('dominant-baseline', 'middle')
                .text((d) => d.text)
        })
}

function renderAllEdges(canvas, graph, renderEdgeCosts) {
    let edges = canvas.selectAll('.edge')
        .data(graph.edges, ([a, b, _]) => [a, b].sort().join('|'))

    edges.enter()
        .append('g')
        .lower()
        .attr('class', 'edge')
        .call((edge) => {
            edge.append('line')
                .attr('stroke', EDGE_STYLES.stroke)
                .attr('stroke-width', EDGE_STYLES.strokeWidth)
                .each((d) => {
                    d.n1 = graph.nodes[d[0]];
                    d.n2 = graph.nodes[d[1]];
                })
                .attr('x1', (d) => d.n1.x)
                .attr('y1', (d) => d.n1.y)
                .attr('x2', (d) => d.n2.x)
                .attr('y2', (d) => d.n2.y)

            if (renderEdgeCosts) {
                edge.append('text')
                    .attr('dominant-baseline', 'middle')
                    .each((d) => {
                        d.cost = d[2];
                        d.costPos = getEdgeCostLocation(d.n1.x, d.n1.y, d.n2.x, d.n2.y);
                    })
                    .text((d) => d.cost)
                    .attr('x', (d) => d.costPos.x)
                    .attr('y', (d) => d.costPos.y)
            }
        })
}

function buildNodeStyles(userStyles) {
    const styles = Object.assign({}, DEFAULT_NODE_STYLES);
    const keys = Object.keys(Object.assign({}, styles, userStyles));
    const defaultStyle = Object.assign({},
        DEFAULT_NODE_STYLES.default, userStyles.default || {})
    for (key of keys) {
        styles[key] = Object.assign({},
            defaultStyle,
            styles[key] || {},
            userStyles[key] || {});
    }
    return styles;
}

function d3QueueRender(canvasContainerSelector, queue, options) {
    options = options || {};
    const radius = ((options.styles || {}).default || {}).radius || 16;
    const width = options.width || 400;
    const padding = options.padding || 4;

    const fauxGraph = {
        nodes: {},
        edges: [],
    }

    let x = radius + padding;
    let y = radius + padding;
    for (let node of queue) {
        fauxGraph.nodes[node.id] = {
            x, y, id: node.id, text: node.text, state: node.state,
        }

        x += radius * 2 + padding;
        if (x > width) {
            y += radius * 2 + padding;
            x = radius + padding;
        }
    }

    d3GraphRender(canvasContainerSelector, fauxGraph, options);
}

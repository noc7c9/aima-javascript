(function () {

const TRI_RADIUS = 20;

const [WIDTH, HEIGHT] = [800, 400];

const DEFAULT_NODE_STYLES = {
    default: {
        fill: 'hsl(0, 2%, 76%)',
        stroke: 'black',
    },
    unlit: {}, // same as default
    halflit: {
        fill: 'hsl(200,50%,70%)',
    },
    lit: {
        fill: 'hsl(0,50%,75%)',
    },
}

const DEFAULT_EDGE_STYLES = {
    default: {
        stroke: 'black',
        strokeWidth: 1,
    },
    unlit: {}, // same as default
    lit: {
        stroke: 'red',
    },
}

function d3TreeRender(canvasContainerSelector, tree, options) {
    options = options || {};
    const canvasWidth = options.width || WIDTH;
    const canvasHeight = options.height || HEIGHT;

    const nodeStyles = buildStylesMapping(
        options.nodeStyles || {}, DEFAULT_NODE_STYLES);
    const edgeStyles = buildStylesMapping(
        options.edgeStyles || {}, DEFAULT_EDGE_STYLES);

    generateNodePositions(tree, {
        width: canvasWidth,
        height: canvasHeight,
        padding: TRI_RADIUS * 2,
        maxDepth: calculateTreeDepth(tree),
    })

    const graph = treeToGraph(tree)

    const canvas = createCanvas(canvasContainerSelector, {
        width: canvasWidth,
        height: canvasHeight,
    })

    renderAllEdges(canvas, graph, edgeStyles);
    renderAllNodes(canvas, graph, nodeStyles);
}

function createCanvas(containerSelector, settings) {
    const canvasContainer = d3.select(containerSelector);

    const width = settings.width
    const height = settings.height

    // remove existing canvas if any
    canvasContainer.select('svg')
        .remove()

    let canvas = canvasContainer.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')

    return canvas;
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
            d.style = styles[d.style] || styles.default;
        })
        .call((node) => {
            node.append('path')
                .attr('d', (d) => {
                    const r = TRI_RADIUS;
                    const ori = d.orientation;
                    return [
                        'M', 0, ori * -r,
                        'L', 0.866 * r, ori * 0.5 * r,
                        'L', -0.866 * r, ori * 0.5 * r,
                        'L', 0, ori * -r,
                    ].join(' ')
                })
                .attr('fill', (d) => d.style.fill)
                .attr('stroke', (d) => d.style.stroke)

            node.append('text')
                .attr('dominant-baseline', 'middle')
                .text((d) => d.text)
        })
}

function renderAllEdges(canvas, graph, styles) {
    let edges = canvas.selectAll('.edge')
        .data(graph.edges, (e) => `{e.parentID}|{e.childID}`)

    edges.enter()
        .append('g')
        .lower()
        .attr('class', 'edge')
        .each((d) => {
            d.style = styles[d.style] || styles.default;
        })
        .call((edge) => {
            edge.append('line')
                .attr('stroke', (d) => d.style.stroke)
                .attr('stroke-width', (d) => d.style.strokeWidth)
                .each((d) => {
                    d.parent = graph.nodes[d.parentID];
                    d.child = graph.nodes[d.childID];
                })
                .attr('x1', (d) => d.parent.x)
                .attr('y1', (d) => {
                    if (d.parent.orientation > 0) {
                        return d.parent.y + 0.5 * TRI_RADIUS;
                    } else {
                        return d.parent.y + TRI_RADIUS;
                    }
                })
                .attr('x2', (d) => d.child.x)
                .attr('y2', (d) => {
                    if (d.child.orientation > 0) {
                        return d.child.y - TRI_RADIUS;
                    } else {
                        return d.child.y - 0.5 * TRI_RADIUS;
                    }
                })
        })
}

function buildStylesMapping(userStyles, defaultStyles) {
    const styles = Object.assign({}, defaultStyles);
    const keys = Object.keys(Object.assign({}, styles, userStyles));
    const defaultStyle = Object.assign({},
        defaultStyles.default, userStyles.default || {})
    for (key of keys) {
        styles[key] = Object.assign({},
            defaultStyle,
            styles[key] || {},
            userStyles[key] || {});
    }
    return styles;
}

function calculateTreeDepth(tree, height) {
    height = height || 0;

    if (tree.leaves && tree.leaves.length) {
        const leafHeights = tree.leaves
            .map((leaf) => calculateTreeDepth(leaf, height + 1))
        return Math.max.apply(null, leafHeights)
    } else {
        return height;
    }
}

function countTreeTips(tree, count) {
    count = count || 1;

    if (tree.leaves && tree.leaves.length) {
        count = tree.leaves
            .reduce((acc, leaf) => acc + countTreeTips(leaf, count), 0)
    }

    return count;
}

function generateNodePositions(tree, settings) {
    settings.width -= settings.padding * 2;
    settings.height -= settings.padding * 2;

    settings.heightGap = settings.height / settings.maxDepth;
    settings.widthGap = settings.width / (countTreeTips(tree) - 1);

    positionNode(tree, settings);
}

function positionNode(tree, settings, depth) {
    depth = depth || 0;
    settings.offsetX = settings.offsetX || settings.padding;

    if (tree.leaves && tree.leaves.length) {
        tree.leaves.map((leaf) => positionNode(leaf, settings, depth + 1))

        const sumX = tree.leaves.reduce((acc, leaf) => acc + leaf.x, 0)
        const avgX = sumX / tree.leaves.length;

        tree.x = avgX;
    } else {
        tree.x = settings.offsetX;
        settings.offsetX += settings.widthGap;
    }

    tree.y = settings.padding + depth * settings.heightGap;
}

function treeToGraph(tree) {
    const graph = {
        nodes: {},
        edges: [],
    }

    let currId = 0;
    function addNode(tree) {
        const id = currId;
        currId += 1;

        graph.nodes[id] = {
            x: tree.x,
            y: tree.y,
            id: id,
            text: tree.text,
            orientation: Math.random() > 0.5 ? 1 : -1,
        }

        if (tree.leaves && tree.leaves.length) {
            tree.leaves.map(function (leaf) {
                const leafId = addNode(leaf);

                graph.edges.push({
                    parentID: id,
                    childID: leafId,
                });
            })
        }

        return id;
    }

    addNode(tree)

    return graph;
}

window.d3TreeRender = d3TreeRender;

})();

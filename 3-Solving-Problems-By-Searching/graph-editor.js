$(document).ready(function() {
    const [WIDTH, HEIGHT] = [600, 350];

    const NODE_RADIUS = 16;

    const EDIT_BOX_HEIGHT = 26;
    const EDIT_BOX_WIDTH = EDIT_BOX_HEIGHT;

    let canvas;
    let dragLine;
    let editBox;

    let currLastId;
    let freeIds = [];

    let graph = _pageGraph;
    window.graph = graph;

    function init() {
        canvas = d3
            .select('#graphEditorCanvas')
            .append('svg')
            .attr('width', WIDTH)
            .attr('height', HEIGHT)
            .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .on('click', onBackgroundClickHandler)

        dragLine = canvas.append('line')
            .attr('class', 'drag-line hidden')

        editBox = canvas.append('foreignObject')
            .attr('class', 'hidden')
            .attr('width', EDIT_BOX_WIDTH)
            .attr('height', EDIT_BOX_HEIGHT)
        editBox.append('xhtml:form').append('input')
            .style('width', '100%')

        const ids = Object.keys(graph.nodes).sort();
        currLastId = ids[ids.length - 1];

        update();
    }

    /***
     * d3 rendering code
     */

    function update() {
        updateEdges();
        updateNodes();
    }

    function updateNodes() {
        let nodes = canvas.selectAll('.node')
            .data(Object.values(graph.nodes), (d) => d.id)

        // create nodes
        nodes.enter()
            .append('g')
            .attr('class', 'node')
            .on('click', onNodeClickHandler)
            .on('dblclick', onNodeDblClickHandler)
            .call(renderNode)
            .call(dragBehaviour)
            .merge(nodes)
                .call(updateNodeDetails)

        nodes.exit()
            .remove()
    }

    function updateEdges() {
        let edges = canvas.selectAll('.edge')
            .data(graph.edges, ([a, b, _]) => [a, b].sort().join('|'))

        edges.exit()
            .remove()

        edges.enter()
            .append('g')
            .lower()
            .attr('class', 'edge')
            .on('click', onEdgeClickHandler)
            .on('dblclick', onEdgeDblClickHandler)
            .call(renderEdge)
            .merge(edges)
                .call(updateEdgeDetails)
    }

    function updateNodeDetails(node) {
        node
            .attr('transform', (d) => `translate(${d.x}, ${d.y})`)

        node.select('text')
            .text((d) => d.text)
    }

    function updateEdgeDetails(edge) {
        edge.selectAll('line')
            .each((d) => {
                d.n1 = graph.nodes[d[0]];
                d.n2 = graph.nodes[d[1]];
            })
            .attr('x1', (d) => d.n1.x)
            .attr('y1', (d) => d.n1.y)
            .attr('x2', (d) => d.n2.x)
            .attr('y2', (d) => d.n2.y)

        edge.select('text')
            .each((d) => {
                d.cost = d[2];
                d.costPos = getEdgeCostLocation(d.n1.x, d.n1.y, d.n2.x, d.n2.y);
            })
            .text((d) => d.cost)
            .attr('x', (d) => d.costPos.x)
            .attr('y', (d) => d.costPos.y)
    }

    function renderEdge(edge) {
        edge.append('line')
            .attr('class', 'thin-line')

        edge.append('line')
            .attr('class', 'thick-line')

        edge.append('text')
    }

    function renderNode(node) {
        node.append('circle')
            .attr('r', NODE_RADIUS)

        node.append('text')
            .text((d) => d.text)
    }

    /***
     * helpers
     */

    function createNode(x, y) {
        const id = getNextId();
        graph.nodes[id] = new GraphNode(x, y, id, id);
        updateNodes();
    }

    function deleteNode(id) {
        delete graph.nodes[id];
        graph.edges = graph.edges.filter((edge) => {
            const [a, b, cost] = edge;
            return a != id && b != id;
        })

        freeIds.push(id);

        updateEdges();
        updateNodes();
    }

    function createEdge(src, dst) {
        if (src === dst) {
            return;
        }

        // check if the edge already exists
        // and don't create the edge if it does
        for (let edge of graph.edges) {
            const [a, b, cost] = edge;
            if (isSameEdge(src, dst, a, b)) {
                return;
            }
        }

        const edge = [src, dst].sort();
        edge.push(Math.floor(1 + Math.random() * 10)); // use a random cost
        graph.edges.push(edge);

        updateEdges();
    }

    function deleteEdge(src, dst) {
        graph.edges = graph.edges.filter((edge) => {
            const [a, b, cost] = edge;
            return !isSameEdge(src, dst, a, b);
        });
        updateEdges();
    }

    function isSameEdge(a1, b1, a2, b2) {
        return (a1 === a2 && b1 === b2) || (a1 === b2 && a2 === b1);
    }

    function getNextId() {
        if (freeIds.length > 0) {
            freeIds.sort();
            return freeIds.shift();
        } else {
            return currLastId = nextLabel(currLastId).toUpperCase();
        }
    }

    function hitTestNodes(x, y) {
        // naive, but good enough for now
        for (node of Object.values(graph.nodes)) {
            const dx = x - node.x;
            const dy = y - node.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= NODE_RADIUS) {
                return node.id;
            }
        }
        return null;
    }

    /***
     * drag behaviour
     */
    let _isEdgeDragging = false;
    let dragBehaviour = d3.drag()
        .filter(() => {
            // no drag if its a deletion attempt
            return !d3.event.shiftKey;
        })
        .on('start', function (d) {
            d3.select(this)
                .raise()

            _isEdgeDragging = d3.event.sourceEvent.ctrlKey;

            if (_isEdgeDragging) {
                onEdgeDragStart.apply(this, arguments);
            }
        })
        .on('drag', function (d) {
            if (_isEdgeDragging) {
                onEdgeDrag.apply(this, arguments);
            } else {
                onNodeDrag.apply(this, arguments);
            }
        })
        .on('end', function (d) {
            if (_isEdgeDragging) {
                onEdgeDragEnd.apply(this, arguments);
            }
        })

    function onNodeDrag(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;

        // update the node
        d3.select(this)
            .attr('transform', `translate(${d.x}, ${d.y})`)

        // update (all) edges
        canvas.selectAll('.edge')
            .call(updateEdgeDetails)
    }

    function onEdgeDragStart(d) {
        dragLine
            .attr('x1', d.x)
            .attr('y1', d.y)
            .attr('x2', d.x)
            .attr('y2', d.y)
            .classed('hidden', false)
    }

    function onEdgeDrag(d) {
        dragLine
            .attr('x2', d3.event.x)
            .attr('y2', d3.event.y)
    }

    function onEdgeDragEnd(d) {
        const startNode = d.id;
        const endNode = hitTestNodes(d3.event.x, d3.event.y);

        dragLine
            .classed('hidden', true)

        if (endNode) {
            createEdge(startNode, endNode);
            updateEdges();
        }
    }

    function openEditBox(x, y, initialValue, cb) {
        editBox
            .classed('hidden', false)
            .raise()
            .attr('x', x - EDIT_BOX_WIDTH / 2)
            .attr('y', y - EDIT_BOX_HEIGHT / 2)
            .select('input')
                .each(function () {
                    this.value = initialValue
                    this.focus()
                    this.select()
                })
                .on('keydown', function () {
                    if (d3.event.key === 'Enter') {
                        this.blur();

                        d3.event.preventDefault(); // stops form submission
                        d3.event.stopPropagation();
                    }

                    if (d3.event.key === 'Escape') {
                        // cancel changes
                        this.value = initialValue;
                        this.blur();
                    }
                })
                .on('blur', function () {
                    if (this.value !== initialValue) {
                        cb(this.value);
                    }

                    editBox
                        .classed('hidden', true)
                })
    }

    /***
     * event handlers
     */

    function onBackgroundClickHandler() {
        const [x, y] = d3.mouse(d3.event.currentTarget);

        if (d3.event.ctrlKey) {
            createNode(x, y);
        }
    }

    function onNodeClickHandler(d) {
        d3.event.stopPropagation();

        if (d3.event.ctrlKey && d3.event.shiftKey) {
            deleteNode(d.id);
        }
    }

    function onEdgeClickHandler(d) {
        d3.event.stopPropagation();

        if (d3.event.ctrlKey && d3.event.shiftKey) {
            deleteEdge(d[0], d[1]);
        }
    }

    function onNodeDblClickHandler(d) {
        openEditBox(d.x, d.y, d.text, (newText) => {
            d.text = newText;
            updateNodes();
        })
    }

    function onEdgeDblClickHandler(d) {
        openEditBox(d.costPos.x, d.costPos.y, d.cost, (newCost) => {
            newCost = parseFloat(newCost);

            if (!isNaN(newCost)) {
                d[2] = newCost;
                updateEdges();
            }
        })
    }

    // let's start
    init();
});


// converts a label to its index (in the label ordering)
// eg:
//    a => 1
//    ah => 34
//    zg => 683
const A_CHARCODE = 'A'.charCodeAt(0);
const ALPHABET_LEN = 26;
function labelToIndex(label) {
    const len = label.length;
    let index = 0;
    for (let i = 0; i < len; i++) {
        const charIndex = label.charCodeAt(i) - A_CHARCODE + 1;
        index += charIndex * (ALPHABET_LEN ** (len - i - 1));
    }
    return index;
}
// converts an index (in the label ordering) to the label
// eg:
//    1 => a
//    34 => ah
//    683 => zg
function indexToLabel(index) {
    const label = [];
    while (index > 0) {
        charCode = index % ALPHABET_LEN;
        index = Math.trunc(index / ALPHABET_LEN);
        if (charCode === 0) {
            charCode = ALPHABET_LEN;
            index -= 1;
        }
        label.push(String.fromCharCode(charCode + A_CHARCODE - 1));
    }
    label.reverse();
    return label.join('');
}
// gets the next label in the label ordering
// eg:
//    a => b
//    z => aa
function nextLabel(label) {
    return indexToLabel(labelToIndex(label) + 1);
}


$(document).ready(function() {
    const $graphEditor = $('.graph-editor');
    const $toggleButton = $('#graphEditorToggleButton');
    const $loadButton = $('#graphEditorLoadButton');
    const $statusText = $('#graphEditorStatusText');

    $toggleButton.on('click', function () {
        $graphEditor.toggleClass('collapsed');
        $loadButton.toggleClass('collapsed');
        const verb = $graphEditor.hasClass('collapsed') ? 'Show' : 'Hide';
        $toggleButton.text(verb + ' Graph Editor');
    })

    $loadButton.on('click', function () {
        __NodeExpansionInit();
        __AgentViewInit();
        __BreadthFirstSearchInit();
        __DepthFirstSearchInit();
        __CostDetailsInit();
        __UniformCostSearchInit();
        __AStarSearchInit();

        $statusText
            .hide()
            .text('Done!')
            .fadeIn()
            .delay(2000)
            .fadeOut()
    })
})

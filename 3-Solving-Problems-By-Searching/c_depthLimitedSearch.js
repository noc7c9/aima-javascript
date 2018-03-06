$(document).ready(function() {

    const $limitSelector = $('#depthLimited-limitSelector');

    const startNodeSelectBox = new StartNodeSelectBox('#depthLimited-startNode')

    let depthLimit = 2;

    function init() {
        let graph = new DefaultGraph();
        const startNode = startNodeSelectBox.get(
            graph.nodes[Object.keys(graph.nodes)[0]].id);

        let searchedGraph = my_depthLimitedSearch(graph, startNode, depthLimit);

        // handle case of new max depth being smaller than depthLimit
        // ugly, but just rerun the algorithm
        if (depthLimit > searchedGraph.maxDepth) {
            depthLimit = searchedGraph.maxDepth;
            searchedGraph = my_depthLimitedSearch(graph, startNode, depthLimit);

            $limitSelector.attr('value', depthLimit);
            $('#depthLimited-limitSelectorText').text(depthLimit);
        }

        d3GraphRender('#depthLimitedSearchCanvas', searchedGraph);

        $limitSelector.attr('max', searchedGraph.maxDepth);

        startNodeSelectBox.refresh(searchedGraph.nodes, startNode);
    }

    init();

    $('#dlsExpanded').css('background-color', 'hsl(200,50%,70%)');
    $('#dlsFrontier').css('background-color', 'hsl(0,50%,75%)');
    $('#dlsUnexplored').css('background-color', 'hsl(0, 2%, 76%)');

    $limitSelector.on('input change', function() {
        depthLimit = parseInt($(this).val());
        $('#depthLimited-limitSelectorText').text($(this).val());
        init();
    });

    startNodeSelectBox.onChange(init);

    // FOR GRAPH EDITOR
    window.__DepthLimitedSearchInit = init;
});

function my_depthLimitedSearch(graph, startId, limit) {
    const exploredDepths = {};
    let frontierNodes = new Set();

    let depth = 0;

    function getConnected(id) {
        return graph.edges.map(([a, b, _]) => {
            if (a == id) {
                return b;
            } else if (b == id) {
                return a;
            } else {
                return null;
            }
        }).filter((v) => v);
    }

    function getIdsFromSet(s) {
        return Array.from(s).map((s) => s.id).join(', ')
    }

    function addNode(id, depth) {
        exploredDepths[id] = depth;
        frontierNodes.add({id, depth});
    }

    addNode(startId, depth);

    while (frontierNodes.size > 0) {
        const oldFrontier = Array.from(frontierNodes);
        frontierNodes = new Set();

        depth += 1;

        for (let oldFrontierNode of oldFrontier) {
            for (let connectedId of getConnected(oldFrontierNode.id)) {
                if (exploredDepths[connectedId] === undefined) {
                    addNode(connectedId, depth);
                }
            }
        }
    }

    const frontierIds = new Set(Array.from(frontierNodes).map((n) => n.id));
    const nodes = {};
    Object.keys(graph.nodes).map((id) => {
        const node = graph.nodes[id];
        const nodeDepth = exploredDepths[id];
        let state;
        if (nodeDepth < limit) {
            state = 'explored';
        } else if (nodeDepth === limit) {
            state = 'frontier';
        } else {
            state = 'default';
        }
        nodes[id] = {
            x: node.x,
            y: node.y,
            id: node.id,
            text: node.text,
            state: state,
        }
    })

    return {
        nodes: nodes,
        edges: graph.edges,
        maxDepth: depth,
    }
}

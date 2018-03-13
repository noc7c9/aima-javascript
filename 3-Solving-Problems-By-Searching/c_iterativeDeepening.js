$(document).ready(function() {

    const DELAY = 2000;
    let intervalFunction = null;

    const $limitSelector = $('#idlimitSelector');

    const startNodeSelectBox = new StartNodeSelectBox('#id-startNode')

    let depthLimit = 2;
    let maxDepth;

    function init() {
        let graph = new DefaultGraph();
        const startNode = startNodeSelectBox.get(Object.keys(graph.nodes)[0]);

        depthLimit = Math.max(0, depthLimit);

        let searchedGraph = my_depthLimitedSearch(graph, startNode, depthLimit);

        // handle case of new max depth being smaller than depthLimit
        // ugly, but just rerun the algorithm
        if (depthLimit > searchedGraph.maxDepth) {
            depthLimit = searchedGraph.maxDepth;
            searchedGraph = my_depthLimitedSearch(graph, startNode, depthLimit);
        }

        // $limitSelector.attr('value', depthLimit);
        $limitSelector.get(0).value = depthLimit;
        $('#id-limitSelectorText').text(`Iteration ${depthLimit + 1}, Depth Limit: ${depthLimit}`);

        maxDepth = searchedGraph.maxDepth;

        d3GraphRender('#iterativeDeepeningCanvas', searchedGraph);

        $limitSelector.attr('max', searchedGraph.maxDepth);

        startNodeSelectBox.refresh(searchedGraph.nodes, startNode);

        clearInterval(intervalFunction);
        intervalFunction = setInterval(function () {
            if (depthLimit < maxDepth) {
                depthLimit += 1;
                init();
            } else {
                clearInterval(intervalFunction);
            }
        }, DELAY)
    }

    init();

    $('#idExpanded').css('background-color', 'hsl(200,50%,70%)');
    $('#idFrontier').css('background-color', 'hsl(0,50%,75%)');
    $('#idUnexplored').css('background-color', 'hsl(0, 2%, 76%)');

    $limitSelector.on('input change', function() {
        depthLimit = parseInt($(this).val());
        init();
    });

    startNodeSelectBox.onChange(function () {
        depthLimit = 0;
        init();
    })

    $('#idRestartButton').click(function() {
        depthLimit = 0;
        init();
    });

    $('#id-prev').on('click', function () {
        depthLimit -= 1;
        init();
    })

    $('#id-next').on('click', function () {
        depthLimit += 1;
        init();
    })

    // FOR GRAPH EDITOR
    window.__IterativeDeepeningInit = init;

});

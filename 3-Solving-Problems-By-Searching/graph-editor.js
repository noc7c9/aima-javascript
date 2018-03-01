$(document).ready(function() {
    const [WIDTH, HEIGHT] = [600, 400];

    const NODE_RADIUS = 16;
    const NODE_FILL = 'rgb(193, 193, 193)';
    const NODE_STROKE = 'black';

    let canvas;

    function init() {
        let graph = new DefaultGraph();
        window.graph = graph;

        canvas = d3
            .select('#graphEditorCanvas')
            .append('svg')
            .attr('width', WIDTH)
            .attr('height', HEIGHT)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')

        update(graph);
    }

    function update(data) {
        const nodesData = Object.values(graph.nodes);
        const edgesData = graph.edges.map(([nodeA, nodeB, cost]) => {
            const [src, dst] = [nodeA, nodeB].sort();
            return {
                src: graph.nodes[src],
                dst: graph.nodes[dst],
                cost: cost,
            }
        })

        updateEdges(nodesData, edgesData);
        updateNodes(nodesData, edgesData);
    }

    function updateNodes(nodesData, edgesData) {
        let nodes = canvas.selectAll('.node')
            .data(nodesData)

        nodes.exit()
            .remove()

        nodes.enter()
            .append('g')
            .attr('class', 'node')
            .call((node) => {
                node.append('circle')
                    .attr('r', NODE_RADIUS)
                    .attr('fill', NODE_FILL)
                    .attr('stroke', NODE_STROKE)
                    .attr('stroke-width', 1)

                node.append('text')
                    .text((d) => d.text)
            })
            .call(d3.drag()
                .on('start', function (d) {
                    d3.select(this)
                        .raise()
                })
                .on('drag', function (d) {
                    d.x = d3.event.x;
                    d.y = d3.event.y;
                    d3.select(this)
                        .attr('transform', `translate(${d.x}, ${d.y})`)
                    updateEdges(nodesData, edgesData);
                })
            )
            .merge(nodes)
                .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
    };

    function updateEdges(nodesData, edgesData) {
        let edges = canvas
            .selectAll('line')
            .data(edgesData)

        edges.enter()
            .append('line')
            .style('stroke', NODE_STROKE)
            .merge(edges)
                .attr('x1', (d) => d.src.x)
                .attr('y1', (d) => d.src.y)
                .attr('x2', (d) => d.dst.x)
                .attr('y2', (d) => d.dst.y)

        edges
            .exit()
                .remove()
    }

    init();

    window.update = update;
});

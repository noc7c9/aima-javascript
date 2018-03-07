const queueOpts = {
    width: 400,
    height: 120,
}

const nodeStyles = {
    exploredStart: {
        fill: 'rgb(140, 191, 217)',
    },
    exploredGoal: {
        fill: 'rgb(140, 150, 217)',
    },
    nextStart: {
        fill: 'rgb(97, 255, 113)',
    },
    nextGoal: {
        fill: 'rgb(189, 255, 113)',
    },
    meetingPoint: {
        fill: 'rgb(255, 164, 102)',
    }
}

$(document).ready(function() {

    const $posSlider = $('#bdbfs-slider');
    const $stepBackward = $('#bdbfs-stepBackward');
    const $stepForward = $('#bdbfs-stepForward');
    const $reset = $('#bdbfs-reset');

    const startNodeSelectBox = new StartNodeSelectBox('#bdbfs-startNode')
    const goalNodeSelectBox = new StartNodeSelectBox('#bdbfs-goalNode')

    let animFrames;
    let currFrameIndex;

    function init() {
        let graph = new DefaultGraph();

        const nodeIds = Object.keys(graph.nodes)

        const startNodeId = startNodeSelectBox.get(nodeIds[0]);
        const goalNodeId = goalNodeSelectBox.get(nodeIds[nodeIds.length - 1]);

        startNodeSelectBox.refresh(graph.nodes, startNodeId);
        goalNodeSelectBox.refresh(graph.nodes, goalNodeId);

        animFrames = my_bidirectionSearch(graph, startNodeId, goalNodeId);

        $posSlider.attr('max', animFrames.length - 1);

        currFrameIndex = -1; // forces re-render
        displayFrame(0);
    }

    function displayFrame(frameIndex) {
        frameIndex = frameIndex === undefined ? currFrameIndex : frameIndex;
        frameIndex = Math.min(animFrames.length - 1, Math.max(0, frameIndex));

        if (frameIndex !== currFrameIndex) {
            currFrameIndex = frameIndex;

            $posSlider.get(0).value = frameIndex;

            d3GraphRender('#bdbfsCanvas', animFrames[frameIndex].graph, {
                styles: nodeStyles,
            });

            d3QueueRender('#bdbfsStartQueueCanvas',
                animFrames[frameIndex].startQueue, queueOpts);
            d3QueueRender('#bdbfsGoalQueueCanvas',
                animFrames[frameIndex].goalQueue, queueOpts);
        }
    }

    init();

    $('#bdbfsLegendUnexplored').css('background-color', 'hsl(0, 2%, 76%)');
    $('#bdbfsLegendMeeting').css('background-color', nodeStyles.meetingPoint.fill);

    $('#bdbfsLegendExpandedStart').css('background-color', nodeStyles.exploredStart.fill);
    $('#bdbfsLegendNextStart').css('background-color', nodeStyles.nextStart.fill);

    $('#bdbfsLegendExpandedGoal').css('background-color', nodeStyles.exploredGoal.fill);
    $('#bdbfsLegendNextGoal').css('background-color', nodeStyles.nextGoal.fill);

    $posSlider.on('input', function () { displayFrame(parseInt(this.value)); });
    $stepForward.on('click', () => displayFrame(currFrameIndex + 1));
    $stepBackward.on('click', () => displayFrame(currFrameIndex - 1));
    $reset.on('click', () => displayFrame(0));

    startNodeSelectBox.onChange(init);
    goalNodeSelectBox.onChange(init);

    // FOR GRAPH EDITOR
    window.__BiDirectionalBFSInit = init;


    function my_bidirectionSearch(graph, startId, goalId) {
        const frames = [];

        const startExplored = new Set();
        const goalExplored = new Set();

        const startFIFO = [startId];
        const goalFIFO = [goalId];

        function takeFrameSnap() {
            const clonedGraph = cloneGraph(graph);
            frames.push({
                graph: clonedGraph,
                startQueue: startFIFO.map((id) => clonedGraph.nodes[id]),
                goalQueue: goalFIFO.map((id) => clonedGraph.nodes[id]),
            });
        }

        graph = cloneGraph(graph);

        graph.nodes[startId].state = 'nextStart';
        graph.nodes[goalId].state = 'nextGoal';

        takeFrameSnap();

        while (startFIFO.length > 0 || goalFIFO.length > 0) {
            // from start node: iterate
            if (startFIFO.length > 0) {
                const currNodeId = startFIFO.shift()
                graph.nodes[currNodeId].state = 'exploredStart';
                startExplored.add(currNodeId);

                // check if met other bfs
                if (goalExplored.has(currNodeId)) {
                    graph.nodes[currNodeId].state = 'meetingPoint';
                    console.log('meeting point', currNodeId)
                    break;
                }

                for (let connected of getConnected(graph, currNodeId)) {
                    if (!startExplored.has(connected) && !startFIFO.includes(connected)) {
                        startFIFO.push(connected);
                    }
                }

                if (startFIFO.length > 0) {
                    graph.nodes[startFIFO[0]].state = 'nextStart';
                }
            }

            // from goal node: iterate
            if (goalFIFO.length > 0) {
                const currNodeId = goalFIFO.shift()
                if (graph.nodes[currNodeId].state !== 'nextStart') {
                    graph.nodes[currNodeId].state = 'exploredGoal';
                }
                goalExplored.add(currNodeId);

                // check if met other bfs
                if (startExplored.has(currNodeId)) {
                    graph.nodes[currNodeId].state = 'meetingPoint';
                    console.log('meeting point', currNodeId)
                    break;
                }

                for (let connected of getConnected(graph, currNodeId)) {
                    if (!goalExplored.has(connected) && !goalFIFO.includes(connected)) {
                        goalFIFO.push(connected);
                    }
                }

                if (goalFIFO.length > 0) {
                    graph.nodes[goalFIFO[0]].state = 'nextGoal';
                }
            }

            takeFrameSnap();
        }

        takeFrameSnap();

        return frames;
    }

    function getConnected(graph, id) {
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

    function cloneGraph(graph) {
        const clonedNodes = {};
        Object.values(graph.nodes).map(({x, y, id, text, state}) => {
            clonedNodes[id] = {x, y, id, text, state};
        });

        const clone = {
            nodes: clonedNodes,
            edges: graph.edges.map(([a, b, cost]) => [a, b, cost]),
        }
        return clone;
    }

    function _my_bidirectionSearch(graph, startId, limit) {
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

});

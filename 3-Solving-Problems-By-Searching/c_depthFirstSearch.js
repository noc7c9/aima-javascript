$(document).ready(function() {
  var w = 600,
    h = 350;
  var DELAY = 2000;
  var intervalFunction = null;

  const startNodeSelectBox = new StartNodeSelectBox('#dfs-startNode')

  function init() {
    var options = new DefaultOptions();
    options.nodes.next.fill = 'hsla(126, 100%, 69%, 1)';

    var drawState = function(n) {
      var graph = new DefaultGraph();

      const initialKey = startNodeSelectBox.get(Object.keys(graph.nodes)[0]);
      startNodeSelectBox.refresh(graph.nodes, initialKey);

      var graphProblem = new GraphProblem(graph.nodes, graph.edges,
        initialKey, initialKey);
      var graphAgent = new GraphAgent(graphProblem);

      var graphDrawAgent = new GraphDrawAgent(graphProblem, 'depthFirstSearchCanvas', options, h, w);
      var queueDrawAgent = new QueueDrawAgent('lifoQueueCanvas', h, w, graphProblem, options);

       //Functions to detect when you hover over a node
      options.nodes.frontier.onMouseEnter = function() {
        let nodeKey = $(this).attr('nodeKey');
        graphDrawAgent.highlight(nodeKey);
        queueDrawAgent.highlight(nodeKey);
      };
      options.nodes.frontier.onMouseLeave = function() {
        let nodeKey = $(this).attr('nodeKey');
        graphDrawAgent.unhighlight(nodeKey);
        queueDrawAgent.unhighlight(nodeKey);
        
      };

      options.nodes.next.onMouseEnter = options.nodes.frontier.onMouseEnter;
      options.nodes.next.onMouseLeave = options.nodes.frontier.onMouseLeave;

      let nextNode = breadthFirstSearch(graphProblem);
      graphProblem.nodes[nextNode].state = "next";

      while (n--) {
        if (graphProblem.frontier.length > 0) {
          graphAgent.expand(nextNode);
          nextNode = depthFirstSearch(graphProblem);
          graphProblem.nodes[nextNode].state = "next";
          //If frontier is still present, find the next node to be expanded so it
          //could be colored differently
          if (graphProblem.frontier.length > 0) {
            graphProblem.nextToExpand = depthFirstSearch(graphProblem);
          } else {
            graphProblem.nextToExpand = null;
          }
        } else {
          break;
        }
      }
      graphDrawAgent.iterate();
      queueDrawAgent.iterate();
    }

    let ac = new AnimationController({
      selector: '#dfsAC',
      min: 0,
      max: Object.keys(_pageGraph.nodes).length - 1,
      renderer: drawState
    });
    ac.renderFirst();
  };
  $('#dfsRestartButton').click(init);
  $('#lifoWaiting').css('background-color', 'hsl(0,50%,75%)');
  $('#lifoNextNode').css('background-color', 'hsl(126, 100%, 69%)');
  init();

    startNodeSelectBox.onChange(init);

    // FOR GRAPH EDITOR
    window.__DepthFirstSearchInit = init;
});

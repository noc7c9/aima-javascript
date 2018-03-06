// Same as depht first search but with limit
var depthLimitedSearch = function(problem, limit) {
    // Traverse the frontier queue from behind and choose the deepest node
    // whose depth is lower than the limit
    for (var i = problem.frontier.length - 1; i >= 0; i--) {
      let nextNodeKey = problem.frontier[i];
      if (problem.nodes[nextNodeKey].depth <= limit) {
        return nextNodeKey;
      }
    }
    //If no such node found, return null to denote traversal should stop
    return null;
  }
  //New Graph for DLS to behave as a tree
var DLSGraph = function() {
    const defGraph = new DefaultGraph();
  this.nodes = defGraph.nodes;
  this.edges = defGraph.edges;
};

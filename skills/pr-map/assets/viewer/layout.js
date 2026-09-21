import dagre from "@dagrejs/dagre";

export const nodeWidth = 240;
export const nodeHeight = 128;

export function layoutMap(map, measureLabel) {
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({
    rankdir: map.direction || "LR",
    ranksep: 80,
    nodesep: 65,
    edgesep: 30,
    marginx: 30,
    marginy: 30,
  });
  for (const node of map.nodes) {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }
  map.edges.forEach((edge, index) => {
    if (!graph.hasNode(edge.from) || !graph.hasNode(edge.to)) {
      throw new Error(`Unknown node in map edge: ${edge.from} → ${edge.to}`);
    }
    graph.setEdge(
      edge.from,
      edge.to,
      {
        width: edge.label ? measureLabel(edge.label) + 16 : 0,
        height: edge.label ? 26 : 0,
        labelpos: "c",
      },
      String(index),
    );
  });
  dagre.layout(graph);
  return {
    nodes: map.nodes.map((node) => {
      const position = graph.node(node.id);
      return {
        id: node.id,
        type: "card",
        position: {
          x: position.x - nodeWidth / 2,
          y: position.y - nodeHeight / 2,
        },
        width: nodeWidth,
        height: nodeHeight,
        data: { node },
      };
    }),
    edges: map.edges.map((edge, index) => ({
      id: String(index),
      source: edge.from,
      target: edge.to,
      type: "routed",
      label: edge.label,
      data: {
        ...graph.edge(edge.from, edge.to, String(index)),
        async: edge.async,
      },
    })),
  };
}

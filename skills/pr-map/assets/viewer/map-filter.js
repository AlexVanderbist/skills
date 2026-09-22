export function nodeLayer(node) {
  if (node.layer) return node.layer;
  const path = node.file || "";
  if (
    /\.(blade\.php|jsx|tsx|vue|svelte|css|scss|sass|less|html)$/.test(path) ||
    /^(resources\/(js|css|views)|frontend|client)\//.test(path)
  )
    return "frontend";
  if (/\.php$/.test(path) || /^(backend|server|routes)\//.test(path))
    return "backend";
  return "shared";
}

export function filterMap(map, layer) {
  const nodes = map.nodes.filter(
    (node) =>
      layer === "all" ||
      nodeLayer(node) === layer ||
      nodeLayer(node) === "shared",
  );
  const ids = new Set(nodes.map((node) => node.id));
  return {
    ...map,
    nodes,
    edges: map.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)),
  };
}

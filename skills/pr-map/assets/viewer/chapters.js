export function selectChapter(map, chapterId) {
  const chapters = map.chapters || [];
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  const chapter = chapters[index];
  if (!chapter) return { chapters, index: -1, chapter: null, steps: [], map };
  const ids = new Set(chapter.nodes);
  const steps = chapter.nodes.map((id) =>
    map.nodes.find((node) => node.id === id),
  );
  return {
    chapters,
    index,
    chapter,
    steps,
    map: {
      ...map,
      nodes: steps,
      edges: map.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)),
    },
  };
}

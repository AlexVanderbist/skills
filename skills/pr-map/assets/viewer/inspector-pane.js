import Split from "split.js";

export function inspectorPane(graph, inspector) {
  let split;
  let sizes = [55, 45];
  let gutter;
  function remember(nextSizes) {
    sizes = nextSizes;
    gutter.setAttribute("aria-valuenow", Math.round(sizes[0]));
  }
  return {
    open() {
      inspector.hidden = false;
      if (split) return;
      split = Split([graph, inspector], {
        sizes,
        minSize: 0,
        gutterSize: 8,
        snapOffset: 0,
        gutter() {
          gutter = document.createElement("div");
          gutter.className = "gutter";
          gutter.tabIndex = 0;
          gutter.setAttribute("role", "separator");
          gutter.setAttribute("aria-label", "Resize graph and code panes");
          gutter.setAttribute("aria-orientation", "vertical");
          gutter.setAttribute("aria-controls", "graph-pane inspector");
          gutter.setAttribute("aria-valuemin", "20");
          gutter.setAttribute("aria-valuemax", "80");
          gutter.setAttribute("aria-valuenow", Math.round(sizes[0]));
          gutter.addEventListener("keydown", (event) => {
            const increments = {
              ArrowLeft: -5,
              ArrowRight: 5,
              Home: 20 - sizes[0],
              End: 80 - sizes[0],
            };
            if (!(event.key in increments)) return;
            event.preventDefault();
            const graphSize = Math.max(
              20,
              Math.min(80, sizes[0] + increments[event.key]),
            );
            split.setSizes([graphSize, 100 - graphSize]);
            remember(split.getSizes());
          });
          return gutter;
        },
        onDrag(nextSizes) {
          const graphSize = Math.max(20, Math.min(80, nextSizes[0]));
          split.setSizes([graphSize, 100 - graphSize]);
          remember(split.getSizes());
        },
        onDragEnd: remember,
      });
    },
    close() {
      split?.destroy();
      split = null;
      inspector.hidden = true;
    },
  };
}

import assert from "node:assert/strict";
import test from "node:test";
import { layoutMap, nodeWidth, nodeHeight } from "../layout.js";

test("automatic layout separates cards and labels in branching and cyclic flows", () => {
  const map = {
    nodes: ["request", "validate", "queue", "store", "context"].map((id) => ({
      id,
    })),
    edges: [
      { from: "request", to: "validate", label: "validate input" },
      { from: "validate", to: "queue", label: "dispatch background job" },
      { from: "validate", to: "store", label: "persist validated input" },
      { from: "queue", to: "store", label: "save result" },
      { from: "queue", to: "store", label: "save failure" },
      { from: "store", to: "request", label: "retry" },
    ],
  };
  const overlaps = (a, b) =>
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;

  for (const direction of ["LR", "TB"]) {
    const layout = layoutMap(
      { ...map, direction },
      (label) => label.length * 7,
    );
    const cards = layout.nodes.map((node) => ({
      ...node.position,
      width: nodeWidth,
      height: nodeHeight,
    }));

    assert.deepEqual(
      layout.nodes.map((node) => node.id),
      map.nodes.map((node) => node.id),
    );
    for (const [index, card] of cards.entries()) {
      assert.ok(Number.isFinite(card.x) && Number.isFinite(card.y));
      assert.ok(
        cards.slice(index + 1).every((other) => !overlaps(card, other)),
      );
    }
    assert.equal(layout.edges.length, map.edges.length);
    for (const edge of layout.edges) {
      const { x, y, width, height, points } = edge.data;
      assert.ok(points.length >= 2);
      assert.ok(
        points.every(
          (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
        ),
      );
      assert.ok(
        cards.every(
          (card) =>
            !overlaps(card, {
              x: x - width / 2,
              y: y - height / 2,
              width,
              height,
            }),
        ),
      );
    }
  }
});

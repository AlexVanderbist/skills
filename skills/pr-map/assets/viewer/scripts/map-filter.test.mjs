import assert from "node:assert/strict";
import test from "node:test";
import { filterMap } from "../map-filter.js";

test("layer views retain shared nodes and only connections with visible endpoints", () => {
  const map = {
    nodes: [
      { id: "api", file: "api.ts", layer: "backend" },
      { id: "form", file: "resources/views/form.blade.php" },
      { id: "contract", layer: "shared" },
      { id: "legacy", file: "app/Models/Post.php" },
    ],
    edges: [
      { from: "form", to: "contract" },
      { from: "contract", to: "api" },
      { from: "api", to: "legacy" },
      { from: "form", to: "api" },
    ],
  };

  const backend = filterMap(map, "backend");
  const frontend = filterMap(map, "frontend");

  assert.deepEqual(
    backend.nodes.map((node) => node.id),
    ["api", "contract", "legacy"],
  );
  assert.deepEqual(backend.edges, map.edges.slice(1, 3));
  assert.deepEqual(
    frontend.nodes.map((node) => node.id),
    ["form", "contract"],
  );
  assert.deepEqual(frontend.edges, [map.edges[0]]);
  assert.deepEqual(filterMap(map, "all"), map);
  assert.equal(
    filterMap({ nodes: [map.nodes[0]], edges: [] }, "frontend").nodes.length,
    0,
  );
});

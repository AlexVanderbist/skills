import assert from "node:assert/strict";
import test from "node:test";
import { selectChapter } from "../chapters.js";

test("chapters show their own nodes in reading order and the full map is the default", () => {
  const map = {
    nodes: [{ id: "job" }, { id: "request" }, { id: "store" }],
    edges: [
      { from: "request", to: "store" },
      { from: "job", to: "store" },
    ],
    chapters: [
      { id: "http", title: "Request", intro: [], nodes: ["request", "store"] },
      { id: "queue", title: "Job", intro: [], nodes: ["job", "store"] },
    ],
  };

  const queue = selectChapter(map, "queue");

  assert.equal(queue.index, 1);
  assert.deepEqual(
    queue.steps.map((node) => node.id),
    ["job", "store"],
  );
  assert.deepEqual(queue.map.edges, [map.edges[1]]);
  assert.deepEqual(selectChapter(map, null).map, map);
  assert.equal(selectChapter(map, "missing").chapter, null);
});

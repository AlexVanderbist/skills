# Map format

Save `map.json` beside `pr-data.json` in the generated viewer directory. The map contains nodes and their connections. React Flow and Dagre calculate the layout. The snapshot and source builder supply file contents and diffs.

The example uses invented names. Replace its commit ID, file paths, and methods with the pinned PR source.

```json
{
  "headRefOid": "REPLACE_WITH_PR_HEAD_COMMIT",
  "direction": "LR",
  "nodes": [
    {
      "id": "request",
      "kind": "HTTP ENTRY POINT",
      "layer": "backend",
      "title": "POST /api/posts",
      "description": "CreatePostRequest → Post",
      "summary": "An authenticated request creates a post through the controller.",
      "methods": []
    },
    {
      "id": "controller",
      "kind": "HTTP CONTROLLER",
      "layer": "backend",
      "title": "PostController",
      "file": "app/Http/Controllers/PostController.php",
      "methods": ["store"],
      "description": "Validate input and create the post",
      "summary": "The store method passes validated input to the creation action and returns the new post."
    }
  ],
  "edges": [
    {
      "from": "request",
      "to": "controller",
      "label": "request",
      "async": false
    }
  ]
}
```

## Layout and nodes

The viewer automatically places 240 × 128 pixel nodes and reserves space for edge labels. Set optional `direction` to `LR` (left to right, the default) or `TB` (top to bottom). Drag nodes to adjust their positions, or drag the background to pan. Connections and labels follow moved nodes. Manual positions survive filtering within the current page session; they are not written to `map.json`. Reset layout clears manual positions and restores the automatic arrangement for the current view. Zooming and fit-to-view are also available.

Do not write canvas dimensions, node coordinates, lanes, SVG paths, or label coordinates. Old geometry fields are ignored by the new viewer. Use descriptive node kinds and edge labels to explain each flow.

Set `layer` to `backend`, `frontend`, or `shared` for every node, including conceptual nodes. Classify by responsibility, not extension alone: server-side JavaScript is back-end; Blade templates are front-end. Shared contracts and boundaries remain visible in both filtered views. The viewer removes connections to filtered-out nodes and recalculates the layout. Older maps without `layer` use common path/extension hints, falling back to shared.

Omit test files and test-only nodes from generated maps unless requested.

Node IDs must be unique. `file` is an exact repository-relative path. Omit it for conceptual entry points. A file outside the changed-file list is loaded as unchanged context. Added, modified, deleted, and unchanged statuses come from the snapshot.

`methods` selects the functions that belong to this node's flow. PHP method names and named JavaScript or TypeScript functions are extracted from syntax trees. An empty array means file scope. A node without a file also needs an empty array.

The same file can appear in multiple nodes with different methods. For example, give an action's `execute` path and its `restore` path separate nodes when their callers differ.

Descriptions are short card captions. Summaries appear above the code. Source code, titles, descriptions, and labels render as escaped text. Edges connect `from` and `to` node IDs; Dagre calculates their paths and label positions. `async` draws a dashed edge for queued or indirect data movement. Keep its label precise about what the edge represents.

## Explicit method ranges

For unsupported syntax, ambiguous names, or languages without a parser, add named ranges under the optional `symbols` object. Each range includes its signature and body. Lines are one-based and inclusive.

```json
{
  "symbols": {
    "src/worker.py": [
      {
        "name": "Worker.process",
        "before": [12, 28],
        "after": [15, 35]
      },
      {
        "name": "Worker.retry",
        "before": null,
        "after": [37, 45]
      }
    ]
  }
}
```

Add these names to the node's `methods` array. Use `null` when the method does not exist in one revision. An explicit name replaces an automatically extracted symbol with the same name. Inspect both pinned file versions before choosing line ranges. Update ranges when the PR changes.

The builder reports parser failures and duplicate method names. It rejects a selected method that it cannot locate. Unselected unsupported files remain readable at file scope, with plain text as the highlighting fallback. Binary files show a source link instead of a text diff.

## Snapshot and generated source

`pr-data.json` contains `repository`, `number`, `title`, `url`, `headRefOid`, `baseRefOid`, `mergeBaseOid`, `files`, and `patches`. The helper uses the merge base as the before revision. Renames appear as deletion and addition, so map both paths when that distinction matters.

`.pr-map-state.json` records the source checkout path and PR identity. The builder reads files from that checkout's Git objects. It compares patches with complete source before it writes `code-data/manifest.json`. The browser loads highlighted source by pinned commit, which prevents cached data from a previous snapshot appearing in a refreshed map.

These generated files contain repository source. Keep the viewer local unless the user requests publication. The template contains no PR data and requests no external fonts or browser scripts.

# Map format

Save `map.json` beside `pr-data.json` in the generated viewer directory. The map contains layout and flow descriptions. The snapshot and source builder supply file contents and diffs.

The example uses invented names. Replace its commit ID, file paths, and methods with the pinned PR source.

```json
{
  "headRefOid": "REPLACE_WITH_PR_HEAD_COMMIT",
  "width": 1050,
  "height": 600,
  "lanes": [
    { "title": "CREATE A POST", "x": 30, "y": 45 }
  ],
  "nodes": [
    {
      "id": "request",
      "x": 30,
      "y": 95,
      "kind": "HTTP ENTRY POINT",
      "title": "POST /api/posts",
      "description": "CreatePostRequest → Post",
      "summary": "An authenticated request creates a post through the controller.",
      "methods": []
    },
    {
      "id": "controller",
      "x": 340,
      "y": 95,
      "kind": "HTTP CONTROLLER",
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
      "path": "M270 159 H340",
      "label": "request",
      "x": 305,
      "y": 145,
      "async": false
    }
  ]
}
```

## Layout and nodes

Coordinates use the unscaled canvas. Nodes are 240 pixels wide and 128 pixels tall. Leave room for edge labels. The viewer fits the declared width and height, and supports dragging and zooming.

Node IDs must be unique. `file` is an exact repository-relative path. Omit it for conceptual entry points. A file outside the changed-file list is loaded as unchanged context. Added, modified, deleted, and unchanged statuses come from the snapshot.

`methods` selects the functions that belong to this node's flow. PHP method names and named JavaScript or TypeScript functions are extracted from syntax trees. An empty array means file scope. A node without a file also needs an empty array.

The same file can appear in multiple nodes with different methods. For example, give an action's `execute` path and its `restore` path separate nodes when their callers differ.

Descriptions are short card captions. Summaries appear above the code. Source code, titles, descriptions, and labels render as escaped text. Edges use an SVG `path` plus label coordinates. `async` draws a dashed edge for queued or indirect data movement. Keep its label precise about what the edge represents.

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

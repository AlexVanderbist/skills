import { createRoot } from "react-dom/client";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  Handle,
  Position,
  BaseEdge,
  MarkerType,
  applyNodeChanges,
  getSmoothStepPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { layoutMap } from "./layout.js";

function MapNode({ data }) {
  const { node, file, selected, direction } = data;
  const status = {
    context: "CONTEXT",
    new: "NEW",
    deleted: "DELETED",
    modified: "CHANGED",
  };
  return (
    <>
      <Handle
        type="target"
        position={direction === "TB" ? Position.Top : Position.Left}
      />
      <button
        className={`node ${node.type} ${selected ? "selected" : ""} nopan`}
        data-node={node.id}
        aria-label={`Inspect ${node.title}`}
        aria-pressed={selected}
      >
        <div className="node-top">
          <span>{node.kind}</span>
          <span className="node-status" title="File status in this PR">
            {status[node.type]}
          </span>
        </div>
        <h3>{node.title}</h3>
        <p>{node.description || ""}</p>
        <span className="node-methods">
          {(node.methods || []).map((method) => `${method}()`).join(" · ") ||
            (node.path ? "script" : "entry point")}
        </span>
        {file && (
          <span className="counts">
            file +{file.additions} −{file.deletions}
          </span>
        )}
      </button>
      <Handle
        type="source"
        position={direction === "TB" ? Position.Bottom : Position.Right}
      />
    </>
  );
}

function RoutedEdge({ id, data, label, markerEnd, ...coordinates }) {
  const routedPath = data.points
    .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
    .join(" ");
  const [path, labelX, labelY] = data.moved
    ? getSmoothStepPath(coordinates)
    : [routedPath, data.x, data.y];
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      label={label}
      labelX={labelX}
      labelY={labelY}
      labelStyle={{ font: "10px ui-monospace, monospace", fill: "#898390" }}
      labelBgStyle={{ fill: "#f9f9f7" }}
      labelBgPadding={[8, 6]}
      style={{
        stroke: "#b7accc",
        strokeWidth: 1.5,
        strokeDasharray: data.async ? "6 5" : undefined,
      }}
    />
  );
}

const nodeTypes = { card: MapNode };
const edgeTypes = { routed: RoutedEdge };
const fitViewOptions = { padding: 0.15, maxZoom: 1.15 };

export function mountMap(element, map, files, inspect) {
  const context = document.createElement("canvas").getContext("2d");
  context.font = "10px ui-monospace, monospace";
  let layout;
  let edges;
  const positions = new Map();
  function arrange(nextMap) {
    map = nextMap;
    layout = layoutMap(nextMap, (label) => context.measureText(label).width);
    layout.nodes = layout.nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) ?? node.position,
    }));
    edges = layout.edges.map((edge) => ({
      ...edge,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#b7accc" },
    }));
  }
  arrange(map);
  const root = createRoot(element);
  let instance;
  function render(selectedId) {
    const nodes = layout.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        file: files.find((file) => file.path === node.data.node.path),
        selected: selectedId === node.id,
        direction: map.direction,
      },
    }));
    root.render(
      <ReactFlow
        nodes={nodes}
        edges={edges.map((edge) => ({
          ...edge,
          data: {
            ...edge.data,
            moved: positions.has(edge.source) || positions.has(edge.target),
          },
        }))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => inspect(node.data.node)}
        nodesDraggable
        nodeDragThreshold={4}
        onNodesChange={(changes) => {
          const movements = changes.filter((change) => change.type === "position");
          if (!movements.length) return;
          layout.nodes = applyNodeChanges(movements, layout.nodes);
          for (const change of movements) {
            if (change.position) positions.set(change.id, change.position);
          }
          render(selectedId);
        }}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        deleteKeyCode={null}
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={2}
        fitView
        fitViewOptions={fitViewOptions}
        onInit={(flow) => {
          instance = flow;
        }}
      >
        {!nodes.length && (
          <Panel position="top-center" className="empty-map">
            No nodes in this view.
          </Panel>
        )}
        <Background gap={19} size={0.8} color="#dadad6" />
        <Controls
          position="bottom-right"
          showInteractive={false}
          fitViewOptions={fitViewOptions}
        />
        <Panel position="top-right">
          <button
            type="button"
            className="reset-layout"
            onClick={() => {
              positions.clear();
              arrange(map);
              render(selectedId);
              requestAnimationFrame(fit);
            }}
          >
            Reset layout
          </button>
        </Panel>
        <Panel position="bottom-left" className="map-note">
          Drag nodes to move · drag background to pan · click to inspect
        </Panel>
      </ReactFlow>,
    );
  }
  render(null);
  const fit = () => instance?.fitView(fitViewOptions);
  let resizeFrame;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(fit);
  }).observe(element);
  return {
    select: render,
    fit,
    update(nextMap, selectedId) {
      arrange(nextMap);
      render(selectedId);
      requestAnimationFrame(fit);
    },
  };
}

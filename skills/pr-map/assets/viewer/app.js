import { mountMap } from "./flow.jsx";
import "./style.css";
import { renderCode } from "./code-view.js";
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const data = await fetch("./pr-data.json", { cache: "no-store" }).then(
  (response) => {
    if (!response.ok) throw new Error("Unable to load PR snapshot");
    return response.json();
  },
);
const codeManifest = await fetch(
  `./code-data/manifest.json?v=${data.headRefOid}`,
).then((response) => response.json());
const sourceCache = new Map();
const map = await fetch(`./map.json?v=${data.headRefOid}`, {
  cache: "no-store",
}).then((response) => response.json());
const nodes = map.nodes;
if (map.headRefOid !== data.headRefOid)
  throw new Error(
    "The map does not match the PR snapshot. Update map.json and rebuild the source data.",
  );
nodes.forEach((node) => {
  node.path = node.file || null;
  const file = data.files.find((file) => file.path === node.path);
  node.type = file
    ? file.changeType === "ADDED"
      ? "new"
      : file.changeType === "DELETED"
        ? "deleted"
        : "modified"
    : "context";
});
$("#pr-title").textContent = `${data.repository} / #${data.number}`;
$("#pr-title").title = `${data.title} · ${data.headRefOid.slice(0, 7)}`;
$("#pr-link").href = data.url;
document.title = `${data.repository} #${data.number} · PR map`;
let selectedNode = null;
let selectedPath = null;
let codeMode = "inline";
let methodScope = "flow";
let showImports = false;
let expandedContext = false;
let renderRequest = 0;
function methodsForNode(node = selectedNode) {
  return node?.methods || [];
}
async function renderInspector() {
  const request = ++renderRequest;
  const node = selectedNode;
  const path = selectedPath;
  $("#inspector-summary").innerHTML =
    `<span class="eyebrow">${escapeHtml(node?.kind || "CHANGED FILE")}</span><h2>${escapeHtml(node?.title || path?.split("/").pop() || "Context")}</h2><div class="filepath">${escapeHtml(path || "Contextual entry point · no file diff")}</div>${node?.summary ? `<div class="behavior-summary"><p>${escapeHtml(node.summary)}</p></div>` : ""}`;
  $("#source-link").href = path
    ? `https://github.com/${data.repository}/blob/${data.files.find((file) => file.path === path)?.changeType === "DELETED" ? data.mergeBaseOid : data.headRefOid}/${path.split("/").map(encodeURIComponent).join("/")}`
    : data.url;
  $("#inspector").classList.toggle(
    "split-mode",
    codeMode === "split" && Boolean(path),
  );
  $("#code-controls").hidden = !path;
  $(".inspector-footer").hidden = !path;
  const entry = codeManifest[path];
  if (!entry || entry.unavailable) {
    $("#code-controls").hidden = true;
    $("#inspector-content").innerHTML =
      `<div class="code-empty">${escapeHtml(entry?.unavailable || "No source file for this context node.")}</div>`;
    return;
  }
  const methods = methodsForNode();
  if (methods.some((name) => !entry.symbols.includes(name)))
    throw new Error(
      "A mapped method is missing from the source snapshot. Rebuild the map.",
    );
  const availableMethods = [...new Set([...methods, ...entry.symbols])];
  const scope =
    methodScope === "flow"
      ? methods.length
        ? methods
        : null
      : methodScope === "file"
        ? null
        : [methodScope];
  const methodOptions = `${methods.length ? `<option value="flow" ${methodScope === "flow" ? "selected" : ""}>Methods in this flow (${methods.length})</option>` : ""}<option value="file" ${!scope ? "selected" : ""}>Entire file</option>${availableMethods.map((name) => `<option value="${escapeHtml(name)}" ${methodScope === name ? "selected" : ""}>${escapeHtml(name)}()</option>`).join("")}`;
  $("#code-controls").innerHTML =
    `<div class="code-scope"><label for="method-scope">Scope</label><select id="method-scope">${methodOptions}</select></div><div class="code-mode-bar" role="group" aria-label="Code view"><button data-code-mode="inline" class="${codeMode === "inline" ? "active" : ""}" aria-pressed="${codeMode === "inline"}">Inline diff</button><button data-code-mode="split" class="${codeMode === "split" ? "active" : ""}" aria-pressed="${codeMode === "split"}">Side by side</button><button data-code-mode="result" class="${codeMode === "result" ? "active" : ""}" aria-pressed="${codeMode === "result"}">Resulting code</button></div><label class="imports-toggle"><input type="checkbox" id="show-imports" ${showImports ? "checked" : ""}>Show imports</label>`;
  $("#scope-note").textContent = scope
    ? `${scope.join("(), ")}() · ${codeMode === "result" ? "complete resulting source" : "changes within selected methods"}`
    : "Entire file · pinned PR source";
  if (!sourceCache.has(path)) {
    $("#inspector-content").innerHTML =
      '<div class="code-empty">Loading highlighted source…</div>';
    sourceCache.set(
      path,
      fetch(`./code-data/${entry.file}?v=${data.headRefOid}`).then(
        (response) => {
          if (!response.ok) throw new Error("Source could not be loaded.");
          return response.json();
        },
      ),
    );
  }
  try {
    const code = await sourceCache.get(path);
    if (request !== renderRequest) return;
    $("#inspector-content").innerHTML = renderCode(code, {
      names: scope,
      mode: codeMode,
      showImports,
      expanded: expandedContext,
    });
  } catch (error) {
    sourceCache.delete(path);
    if (request === renderRequest)
      $("#inspector-content").innerHTML =
        `<div class="code-empty">${escapeHtml(error.message)} Reopen the node to retry.</div>`;
  }
}
function inspect(node) {
  selectedNode = node;
  selectedPath = node?.path || null;
  methodScope = "flow";
  expandedContext = false;
  $("#inspector").hidden = false;
  $("#inspector").scrollTop = 0;
  renderInspector();
  flow.select(selectedNode?.id);
  $("#status").textContent = `Opened ${node.title}`;
}
function closeInspector() {
  renderRequest++;
  $("#inspector").hidden = true;
  selectedNode = null;
  selectedPath = null;
  flow.select(selectedNode?.id);
}
$(".app").addEventListener("click", (event) => {
  const mode = event.target.closest("[data-code-mode]");
  if (mode) {
    codeMode = mode.dataset.codeMode;
    renderInspector();
  }
  if (event.target.closest("[data-expand-context]")) {
    expandedContext = true;
    renderInspector();
  }
});
$("#close-inspector").addEventListener("click", closeInspector);
const flow = mountMap($("#viewport"), map, data.files, inspect);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeInspector();
  if (event.key === "0" && !event.target.closest("input, select, textarea"))
    flow.fit();
});

$("#code-controls").addEventListener("change", (event) => {
  if (event.target.id === "method-scope") {
    methodScope = event.target.value;
    expandedContext = false;
  }
  if (event.target.id === "show-imports") showImports = event.target.checked;
  renderInspector();
});
$("#expand-inspector").addEventListener("click", () => {
  const expanded = $("#inspector").classList.toggle("expanded");
  $("#expand-inspector").setAttribute(
    "aria-label",
    expanded ? "Shrink code panel" : "Expand code panel",
  );
  $("#expand-inspector").setAttribute("aria-pressed", expanded);
});

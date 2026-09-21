const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const inside = (line, ranges) =>
  line !== null && ranges.some(([start, end]) => line >= start && line <= end);

function methodRanges(version, names) {
  return version.symbols
    .filter((symbol) => names.includes(symbol.name))
    .map((symbol) => [symbol.start, symbol.end]);
}

export function scopedRows(code, names, showImports) {
  const rows = names
    ? names.flatMap((name) => code.methodRows[name] || [])
    : code.rows;
  return rows.filter((row) => {
    if (
      !showImports &&
      (inside(row.old, code.before.imports) ||
        inside(row.new, code.after.imports))
    )
      return false;
    return true;
  });
}

function sourceCell(code, line, side, type, marker = "") {
  if (line === null)
    return `<div class="code-cell empty" aria-label="No corresponding line"></div>`;
  const source = code[side].lines[line - 1];
  return `<div class="code-cell ${type}"><span class="code-line-number">${line}</span><span class="change-marker">${marker}</span><code>${source.html || " "}</code></div>`;
}

function collapseRows(rows, expanded) {
  const changed = rows.flatMap((row, index) =>
    row.type === "context" ? [] : [index],
  );
  if (expanded || !changed.length) return rows;
  const visible = new Set();
  for (const index of changed)
    for (
      let position = Math.max(0, index - 4);
      position <= Math.min(rows.length - 1, index + 4);
      position++
    )
      visible.add(position);
  const result = [];
  let hidden = 0;
  for (const [index, row] of rows.entries()) {
    if (!visible.has(index)) {
      hidden++;
      continue;
    }
    if (hidden) {
      result.push({ type: "gap", count: hidden });
      hidden = 0;
    }
    result.push(row);
  }
  if (hidden) result.push({ type: "gap", count: hidden });
  return result;
}

function gapRow(count) {
  return `<button class="code-gap" data-expand-context>↕ Show ${count} unchanged lines</button>`;
}

function inlineRows(code, rows) {
  return rows
    .map((row) => {
      if (row.type === "gap") return gapRow(row.count);
      const side = row.type === "remove" ? "before" : "after";
      const line = row.type === "remove" ? row.old : row.new;
      const marker =
        row.type === "add" ? "+" : row.type === "remove" ? "−" : " ";
      return `<div class="inline-row ${row.type}"><span class="code-line-number">${row.old ?? ""}</span><span class="code-line-number">${row.new ?? ""}</span><span class="change-marker">${marker}</span><code>${code[side].lines[line - 1].html || " "}</code></div>`;
    })
    .join("");
}

function splitRows(code, rows) {
  let html = "";
  for (let index = 0; index < rows.length;) {
    const row = rows[index];
    if (row.type === "gap") {
      html += gapRow(row.count);
      index++;
      continue;
    }
    if (row.type === "context") {
      html += `<div class="split-row">${sourceCell(code, row.old, "before", "context")}${sourceCell(code, row.new, "after", "context")}</div>`;
      index++;
      continue;
    }
    const removed = [],
      added = [];
    while (
      index < rows.length &&
      ["add", "remove"].includes(rows[index].type)
    ) {
      const change = rows[index++];
      if (change.type === "remove") removed.push(change.old);
      else added.push(change.new);
    }
    for (
      let position = 0;
      position < Math.max(removed.length, added.length);
      position++
    ) {
      html += `<div class="split-row">${sourceCell(code, removed[position] ?? null, "before", "remove", "−")}${sourceCell(code, added[position] ?? null, "after", "add", "+")}</div>`;
    }
  }
  return html;
}

export function renderCode(code, { names, mode, showImports, expanded }) {
  const sections = names
    ? names.map((name) => ({ name, names: [name] }))
    : [{ name: "Entire file", names: null }];
  const allRows = scopedRows(code, names, showImports);
  const added = allRows.filter((row) => row.type === "add").length;
  const removed = allRows.filter((row) => row.type === "remove").length;
  const imports = code.rows.filter(
    (row) =>
      row.type !== "context" &&
      (inside(row.old, code.before.imports) ||
        inside(row.new, code.after.imports)),
  ).length;
  const header = `<div class="code-meta"><span>${escapeHtml(code.language.toUpperCase())} · ${names ? `${names.length} method${names.length === 1 ? "" : "s"}` : "Entire file"}${!showImports && !names && imports ? ` · ${imports} import lines hidden` : ""}</span><span class="diff-totals"><b>+${added}</b><em>−${removed}</em></span></div>`;
  const html = sections
    .map((section) => {
      const rows = scopedRows(code, section.names, showImports);
      const sectionHeader = `<div class="method-heading"><span>${escapeHtml(section.name)}${section.names ? "()" : ""}</span><span>${mode === "result" ? "AFTER CHANGE" : "BEFORE → AFTER"}</span></div>`;
      if (mode === "result") {
        const ranges = section.names
          ? methodRanges(code.after, section.names)
          : [[1, code.after.lines.length]];
        const lineNumbers = code.after.lines
          .map((_, index) => index + 1)
          .filter(
            (line) =>
              inside(line, ranges) &&
              (showImports || !inside(line, code.after.imports)),
          );
        return (
          sectionHeader +
          (lineNumbers.length
            ? `<div class="code-lines result-code">${lineNumbers.map((line) => sourceCell(code, line, "after", "context")).join("")}</div>`
            : '<div class="code-empty">This method or file does not exist after the change.</div>')
        );
      }
      const visibleRows = collapseRows(rows, expanded);
      const notice = rows.some((row) => row.type !== "context")
        ? ""
        : '<div class="code-empty">This method is unchanged in the PR. Its code is shown for context.</div>';
      if (!rows.length)
        return (
          sectionHeader + '<div class="code-empty">No code in this scope.</div>'
        );
      return (
        sectionHeader +
        notice +
        (mode === "split"
          ? `<div class="split-headings"><span>Before</span><span>After</span></div><div class="code-lines split-code">${splitRows(code, visibleRows)}</div>`
          : `<div class="code-lines inline-code">${inlineRows(code, visibleRows)}</div>`)
      );
    })
    .join("");
  return header + html;
}

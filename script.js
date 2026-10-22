const board = document.querySelector("#felt-board");
const creationPanel = document.querySelector("#creation-panel");
const contextToolbar = document.querySelector("#context-toolbar");
const toolButtons = document.querySelectorAll(".tool-button");
const filterButtons = document.querySelectorAll(".filter");
const themeButtons = document.querySelectorAll(".theme-swatch");
const helpButton = document.querySelector("#help-button");
const helpDialog = document.querySelector("#help-dialog");

let selectedUnit = null;
let activeTool = null;
let currentAction = null;
let highestLayer = 20;

const noteTemplates = {
  plain: '<p class="note-kicker">A QUICK NOTE</p><p>Type anything here.</p>',
  checklist: '<p class="note-kicker">TO REMEMBER</p><div class="check-row"><input type="checkbox" aria-label="Complete First thing" /><span>First thing</span></div><div class="check-row"><input type="checkbox" aria-label="Complete Another thing" /><span>Another thing</span></div><div class="check-row"><input type="checkbox" aria-label="Complete One more thing" /><span>One more thing</span></div>',
  bullets: '<p class="note-kicker">LITTLE LIST</p><ul><li>First thought</li><li>Second thought</li></ul>',
};

function unitTemplate(type, content, style = "") {
  return `<article class="board-unit ${type}-unit" data-type="${type}" data-attachment="clear" style="--x: 43%; --y: 42%; --w: 210px; --rotation: -2deg; ${style}">
    <div class="attachment clear-pin" aria-hidden="true"></div>
    ${content}
    <button class="rotate-handle" aria-label="Rotate ${type}"></button>
    <button class="resize-handle" aria-label="Resize ${type}"></button>
  </article>`;
}

function setActiveTool(tool) {
  activeTool = tool;
  toolButtons.forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
  const panels = {
    photo: photoPanel(),
    file: filePanel(),
    contact: contactPanel(),
    sticky: stickyPanel(),
  };
  creationPanel.innerHTML = panels[tool];
  wireCreationPanel();
}

function closeCreationPanel() {
  activeTool = null;
  creationPanel.innerHTML = "";
  toolButtons.forEach((button) => button.classList.remove("active"));
}

function photoPanel() {
  return `<form class="creation-card" id="photo-form">
    <div class="creation-card-head"><h2>Add a Polaroid photo</h2><button class="dismiss-panel" type="button" aria-label="Close panel">×</button></div>
    <div class="creation-fields">
      <label class="form-field">Photo<input type="file" id="photo-file" accept="image/*" required /></label>
      <label class="form-field">Caption<input id="photo-caption" maxlength="45" placeholder="a small memory" /></label>
      <label class="form-field">Attachment<select id="photo-attachment"><option value="clear">Clear pin</option><option value="metal">Round metal pin</option><option value="washi">Washi tape</option></select></label>
    </div>
    <div class="creation-actions"><button class="soft-button dismiss-panel" type="button">Cancel</button><button class="submit-button" type="submit">Pin photo</button></div>
  </form>`;
}

function filePanel() {
  return `<form class="creation-card" id="file-form">
    <div class="creation-card-head"><h2>Add a linked document</h2><button class="dismiss-panel" type="button" aria-label="Close panel">×</button></div>
    <div class="creation-fields">
      <label class="form-field">Document image<input type="file" id="file-image-upload" accept="image/*" required /></label>
      <label class="form-field">Linked local file<input type="file" id="linked-file-upload" required /></label>
      <label class="form-field">Display title<input id="file-title" maxlength="36" placeholder="Important documents" /></label>
    </div>
    <p class="form-help">The image is displayed on the board as a document sheet. The lower-right arrow opens the local file you selected.</p>
    <div class="creation-actions"><button class="soft-button dismiss-panel" type="button">Cancel</button><button class="submit-button" type="submit">Pin document</button></div>
  </form>`;
}

function contactPanel() {
  return `<form class="creation-card" id="contact-form">
    <div class="creation-card-head"><h2>Add a contact card</h2><button class="dismiss-panel" type="button" aria-label="Close panel">×</button></div>
    <div class="creation-fields">
      <label class="form-field">Name<input id="contact-name" required maxlength="32" placeholder="Alex Chen" /></label>
      <label class="form-field">Relationship<input id="contact-relation" maxlength="40" placeholder="Friend · New York" /></label>
    </div>
    <div class="contact-detail-fields" id="contact-detail-fields">${contactDetailRow("Phone", "")}</div>
    <button class="add-detail" id="add-contact-detail" type="button">+ Add another contact detail</button>
    <div class="creation-actions"><button class="soft-button dismiss-panel" type="button">Cancel</button><button class="submit-button" type="submit">Pin contact</button></div>
  </form>`;
}

function contactDetailRow(type = "Phone", value = "") {
  return `<div class="contact-detail-row"><label class="form-field">Type<select class="contact-detail-type"><option${type === "Phone" ? " selected" : ""}>Phone</option><option${type === "Email" ? " selected" : ""}>Email</option><option${type === "Instagram" ? " selected" : ""}>Instagram</option><option${type === "Address" ? " selected" : ""}>Address</option><option${type === "Other" ? " selected" : ""}>Other</option></select></label><label class="form-field">Details<input class="contact-detail-value" maxlength="70" value="${escapeHtml(value)}" placeholder="Add details" /></label><button type="button" class="remove-detail" aria-label="Remove contact detail">×</button></div>`;
}

function stickyPanel() {
  return `<form class="creation-card" id="sticky-form">
    <div class="creation-card-head"><h2>Add a sticky note</h2><button class="dismiss-panel" type="button" aria-label="Close panel">×</button></div>
    <div class="creation-fields">
      <label class="form-field">Format<select id="sticky-type"><option value="plain">Plain note</option><option value="checklist">Checklist</option><option value="bullets">Bullet list</option></select></label>
      <label class="form-field">Color<select id="sticky-color"><option value="peach">Peach</option><option value="butter">Butter</option><option value="lavender">Lavender</option><option value="blue">Blue</option><option value="cream">Cream</option></select></label>
      <label class="form-field">Font<select id="sticky-font"><option value="handwritten">Handwritten</option><option value="rounded">Rounded serif</option><option value="clean">Clean sans</option></select></label>
    </div>
    <label class="form-field">Starting text<textarea id="sticky-text" maxlength="180" placeholder="Leave this blank to use a starter note."></textarea></label>
    <div class="creation-actions"><button class="soft-button dismiss-panel" type="button">Cancel</button><button class="submit-button" type="submit">Pin note</button></div>
  </form>`;
}

function wireCreationPanel() {
  document.querySelectorAll(".dismiss-panel").forEach((button) => button.addEventListener("click", closeCreationPanel));
  document.querySelector("#photo-form")?.addEventListener("submit", addPhoto);
  document.querySelector("#file-form")?.addEventListener("submit", addFile);
  document.querySelector("#contact-form")?.addEventListener("submit", addContact);
  document.querySelector("#sticky-form")?.addEventListener("submit", addSticky);
  document.querySelector("#add-contact-detail")?.addEventListener("click", () => {
    document.querySelector("#contact-detail-fields").insertAdjacentHTML("beforeend", contactDetailRow());
    wireContactDetailRows();
  });
  wireContactDetailRows();
}

function wireContactDetailRows() {
  document.querySelectorAll(".remove-detail").forEach((button) => button.addEventListener("click", () => {
    const rows = document.querySelectorAll(".contact-detail-row");
    if (rows.length > 1) button.closest(".contact-detail-row").remove();
  }));
}

function addPhoto(event) {
  event.preventDefault();
  const file = document.querySelector("#photo-file").files[0];
  const caption = document.querySelector("#photo-caption").value.trim() || "a little memory";
  const attachment = document.querySelector("#photo-attachment").value;
  const reader = new FileReader();
  reader.onload = () => {
    const unit = document.createElement("div");
    unit.innerHTML = unitTemplate("photo", `<div class="polaroid-frame"><img src="${reader.result}" alt="Your uploaded memory" /><p>${escapeHtml(caption)}</p></div>`);
    const photoUnit = unit.firstElementChild;
    board.append(photoUnit);
    setAttachment(photoUnit, attachment);
    selectUnit(photoUnit);
  };
  reader.readAsDataURL(file);
  closeCreationPanel();
}

function addFile(event) {
  event.preventDefault();
  const image = document.querySelector("#file-image-upload").files[0];
  const linkedFile = document.querySelector("#linked-file-upload").files[0];
  const title = document.querySelector("#file-title").value.trim() || linkedFile.name.replace(/\.[^/.]+$/, "");
  const reader = new FileReader();
  reader.onload = () => {
    const content = `<div class="file-topline"><span>LINKED FILE</span><span class="file-more">•••</span></div><div class="file-preview file-image-preview"><img src="${reader.result}" alt="Preview for ${escapeHtml(title)}" /></div><div class="file-footer"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(linkedFile.name)}</span></div><button class="file-open-link" type="button" title="Open linked local file" aria-label="Open linked local file">↗</button></div>`;
    const holder = document.createElement("div");
    holder.innerHTML = unitTemplate("file", content, "--w: 285px;");
    const fileUnit = holder.firstElementChild;
    fileUnit.querySelector(".file-open-link").addEventListener("click", (clickEvent) => {
      clickEvent.stopPropagation();
      window.open(URL.createObjectURL(linkedFile), "_blank", "noopener");
    });
    board.append(fileUnit);
    setAttachment(fileUnit, "metal");
    selectUnit(fileUnit);
  };
  reader.readAsDataURL(image);
  closeCreationPanel();
}

function addContact(event) {
  event.preventDefault();
  const name = document.querySelector("#contact-name").value.trim();
  const relation = document.querySelector("#contact-relation").value.trim() || "Someone important";
  const details = [...document.querySelectorAll(".contact-detail-row")].map((row) => ({ type: row.querySelector(".contact-detail-type").value, value: row.querySelector(".contact-detail-value").value.trim() })).filter((detail) => detail.value);
  const detailMarkup = details.length ? details.map((detail) => `<span><span class="contact-detail-type">${escapeHtml(detail.type)}</span> · ${escapeHtml(detail.value)}</span>`).join("") : "<span>Add a way to reach them</span>";
  const content = `<div class="contact-stripe"></div><div class="contact-content"><div class="avatar">${escapeHtml(name.charAt(0).toUpperCase())}</div><div><p class="contact-label">FAVORITE PEOPLE</p><h2>${escapeHtml(name)}</h2><p class="contact-relation">${escapeHtml(relation)}</p></div><div class="contact-details">${detailMarkup}</div></div>`;
  const holder = document.createElement("div");
  holder.innerHTML = unitTemplate("contact", content, "--w: 255px;");
  const contactUnit = holder.firstElementChild;
  board.append(contactUnit);
  setAttachment(contactUnit, "metal");
  selectUnit(contactUnit);
  closeCreationPanel();
}

function addSticky(event) {
  event.preventDefault();
  const type = document.querySelector("#sticky-type").value;
  const color = document.querySelector("#sticky-color").value;
  const font = document.querySelector("#sticky-font").value;
  const text = document.querySelector("#sticky-text").value.trim();
  const content = text ? `<div class="note-content" contenteditable="true" spellcheck="true"><p class="note-kicker">NEW NOTE</p><p>${escapeHtml(text).replace(/\n/g, "<br>")}</p></div>` : `<div class="note-content" contenteditable="true" spellcheck="true">${noteTemplates[type]}</div>`;
  const holder = document.createElement("div");
  holder.innerHTML = unitTemplate("note", content, "--w: 210px;");
  const note = holder.firstElementChild;
  note.classList.add("note-unit");
  note.dataset.noteColor = color;
  note.dataset.noteFont = font;
  note.dataset.noteSize = "medium";
  if (type === "checklist") note.classList.add("checklist");
  if (type === "bullets") note.classList.add("bullet-note");
  board.append(note);
  selectUnit(note);
  closeCreationPanel();
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function selectUnit(unit) {
  document.querySelectorAll(".board-unit.selected").forEach((item) => item.classList.remove("selected"));
  selectedUnit = unit;
  selectedUnit.classList.add("selected");
  selectedUnit.style.zIndex = ++highestLayer;
  renderContextToolbar();
}

function clearSelection() {
  selectedUnit?.classList.remove("selected");
  selectedUnit = null;
  contextToolbar.innerHTML = '<p class="context-empty">Select a board item to edit its style.</p>';
  contextToolbar.style.top = "";
  contextToolbar.style.bottom = "22px";
  contextToolbar.style.left = "50%";
}

function renderContextToolbar() {
  if (!selectedUnit) return;
  const isNote = selectedUnit.dataset.type === "note";
  const typeLabel = selectedUnit.dataset.type === "contact" ? "contact card" : selectedUnit.dataset.type;
  contextToolbar.innerHTML = `<div class="context-controls">
    <span class="unit-label">Editing ${typeLabel}</span>
    ${isNote ? `${noteColorPicker(selectedUnit.dataset.noteColor || "peach")}${noteFontPicker(selectedUnit.dataset.noteFont || "handwritten")}<label>Size <select id="edit-size"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label><button id="plain-button" title="Use normal text">Text</button><button id="list-button" title="Turn note into a bullet list">• List</button><button id="checklist-button" title="Turn note into a checklist">☐ Check</button>` : ""}
    <label>Attach <select id="edit-attachment"><option value="clear">Clear pin</option><option value="metal">Metal pin</option><option value="washi">Washi tape</option></select></label>
    <button id="front-button">Bring front</button>
    <button class="delete-button" id="delete-button">Delete</button>
  </div>`;
  if (isNote) {
    document.querySelector("#edit-size").value = selectedUnit.dataset.noteSize || "medium";
    document.querySelector("#edit-size").addEventListener("change", (event) => selectedUnit.dataset.noteSize = event.target.value);
    document.querySelectorAll(".picker-trigger").forEach((button) => button.addEventListener("click", () => {
      const picker = button.closest(".preview-picker");
      document.querySelectorAll(".preview-picker").forEach((item) => item.classList.toggle("open", item === picker && !item.classList.contains("open")));
      positionContextToolbar();
    }));
    document.querySelectorAll(".color-choice").forEach((button) => button.addEventListener("click", () => {
      selectedUnit.dataset.noteColor = button.dataset.color;
      renderContextToolbar();
    }));
    document.querySelectorAll(".font-choice").forEach((button) => button.addEventListener("click", () => {
      selectedUnit.dataset.noteFont = button.dataset.font;
      renderContextToolbar();
    }));
    document.querySelector("#plain-button").addEventListener("click", makePlainNote);
    document.querySelector("#list-button").addEventListener("click", makeBulletList);
    document.querySelector("#checklist-button").addEventListener("click", makeChecklist);
  }
  const attachmentSelect = document.querySelector("#edit-attachment");
  attachmentSelect.value = selectedUnit.dataset.attachment || "clear";
  attachmentSelect.addEventListener("change", (event) => setAttachment(selectedUnit, event.target.value));
  document.querySelector("#front-button").addEventListener("click", () => selectedUnit.style.zIndex = ++highestLayer);
  document.querySelector("#delete-button").addEventListener("click", () => { selectedUnit.remove(); clearSelection(); });
  requestAnimationFrame(positionContextToolbar);
}

function noteColorPicker(activeColor) {
  const colors = [
    ["peach", "#ffad9e"], ["butter", "#f7df93"], ["lavender", "#ccb8e3"], ["blue", "#b9d7e9"], ["cream", "#f7f0dc"],
  ];
  const selected = colors.find(([name]) => name === activeColor) || colors[0];
  return `<div class="preview-picker" id="color-picker"><button class="picker-trigger" type="button" aria-expanded="false"><span class="picker-color-dot" style="background:${selected[1]}"></span> Color</button><div class="picker-popout color-popout">${colors.map(([name, value]) => `<button class="color-choice ${name === activeColor ? "active" : ""}" type="button" data-color="${name}" style="background:${value}" aria-label="${name} sticky note"></button>`).join("")}</div></div>`;
}

function noteFontPicker(activeFont) {
  const fonts = [["handwritten", "Handwritten"], ["rounded", "Rounded"], ["clean", "Clean"]];
  const selected = fonts.find(([name]) => name === activeFont) || fonts[0];
  return `<div class="preview-picker" id="font-picker"><button class="picker-trigger ${selected[0]}" type="button" aria-expanded="false">${selected[1]}⌄</button><div class="picker-popout font-popout">${fonts.map(([name, label]) => `<button class="font-choice ${name === activeFont ? "active" : ""}" type="button" data-font="${name}">${label}</button>`).join("")}</div></div>`;
}

function positionContextToolbar() {
  if (!selectedUnit) return;
  const shell = document.querySelector(".app-shell").getBoundingClientRect();
  const unit = selectedUnit.getBoundingClientRect();
  const toolbarWidth = contextToolbar.offsetWidth;
  const toolbarHeight = contextToolbar.offsetHeight;
  const desiredX = unit.left - shell.left + unit.width / 2;
  const left = Math.min(Math.max(toolbarWidth / 2 + 10, desiredX), shell.width - toolbarWidth / 2 - 10);
  const above = unit.top - shell.top - toolbarHeight - 14;
  const below = unit.bottom - shell.top + 14;
  contextToolbar.style.left = `${left}px`;
  contextToolbar.style.top = `${above < 76 ? below : above}px`;
  contextToolbar.style.bottom = "auto";
}

function setAttachment(unit, style) {
  unit.dataset.attachment = style;
  const attachment = unit.querySelector(".attachment");
  attachment.className = "attachment";
  attachment.classList.add(style === "clear" ? "clear-pin" : style === "metal" ? "metal-pin" : "washi-tape");
}

function readNoteLines(content) {
  const rows = [...content.querySelectorAll(".check-row, li, p:not(.note-kicker)")];
  if (rows.length) return rows.map((row) => row.textContent.trim()).filter(Boolean);
  return content.textContent.split("\n").map((line) => line.trim()).filter(Boolean);
}

function getNoteHeading(content, fallback) {
  return content.querySelector(".note-kicker")?.textContent.trim() || fallback;
}

function setNoteFormat(format) {
  const content = selectedUnit.querySelector(".note-content");
  const lines = readNoteLines(content);
  const safeLines = lines.length ? lines : ["Type here"];
  const heading = getNoteHeading(content, format === "checklist" ? "TO REMEMBER" : format === "bullets" ? "LITTLE LIST" : "A QUICK NOTE");
  const escapedHeading = escapeHtml(heading);
  const escapedLines = safeLines.map(escapeHtml);

  if (format === "checklist") {
    content.innerHTML = `<p class="note-kicker">${escapedHeading}</p>${escapedLines.map((line) => `<div class="check-row"><input type="checkbox" aria-label="Complete ${line}" /><span>${line}</span></div>`).join("")}`;
  } else if (format === "bullets") {
    content.innerHTML = `<p class="note-kicker">${escapedHeading}</p><ul>${escapedLines.map((line) => `<li>${line}</li>`).join("")}</ul>`;
  } else {
    content.innerHTML = `<p class="note-kicker">${escapedHeading}</p>${escapedLines.map((line) => `<p>${line}</p>`).join("")}`;
  }
  selectedUnit.dataset.noteFormat = format;
  selectedUnit.classList.toggle("checklist", format === "checklist");
  selectedUnit.classList.toggle("bullet-note", format === "bullets");
  content.focus();
}

function makePlainNote() { setNoteFormat("plain"); }
function makeBulletList() { setNoteFormat("bullets"); }
function makeChecklist() { setNoteFormat("checklist"); }

function beginPointerAction(event, unit, mode) {
  event.preventDefault();
  event.stopPropagation();
  selectUnit(unit);
  const boardRect = board.getBoundingClientRect();
  const unitRect = unit.getBoundingClientRect();
  currentAction = {
    mode,
    unit,
    boardRect,
    startX: event.clientX,
    startY: event.clientY,
    startLeft: unit.offsetLeft,
    startTop: unit.offsetTop,
    startWidth: unit.offsetWidth,
    startHeight: unit.offsetHeight,
    centerX: unitRect.left + unitRect.width / 2,
    centerY: unitRect.top + unitRect.height / 2,
    startRotation: parseFloat(unit.style.getPropertyValue("--rotation")) || 0,
  };
  unit.setPointerCapture?.(event.pointerId);
}

board.addEventListener("pointerdown", (event) => {
  const unit = event.target.closest(".board-unit");
  if (!unit) { clearSelection(); return; }
  if (event.target.closest(".rotate-handle")) return beginPointerAction(event, unit, "rotate");
  if (event.target.closest(".resize-handle")) return beginPointerAction(event, unit, "resize");
  if (event.target.closest(".file-open-link")) { selectUnit(unit); return; }
  if (event.target.closest("input") || event.target.closest("[contenteditable=true]")) { selectUnit(unit); return; }
  beginPointerAction(event, unit, "drag");
});

window.addEventListener("pointermove", (event) => {
  if (!currentAction) return;
  const { unit, mode, boardRect } = currentAction;
  if (mode === "drag") {
    const nextLeft = Math.min(Math.max(0, currentAction.startLeft + event.clientX - currentAction.startX), board.clientWidth - unit.offsetWidth);
    const nextTop = Math.min(Math.max(0, currentAction.startTop + event.clientY - currentAction.startY), board.clientHeight - unit.offsetHeight);
    unit.style.left = `${nextLeft}px`;
    unit.style.top = `${nextTop}px`;
  }
  if (mode === "resize") {
    const nextWidth = Math.min(Math.max(115, currentAction.startWidth + event.clientX - currentAction.startX), Math.max(140, board.clientWidth - unit.offsetLeft));
    unit.style.width = `${nextWidth}px`;
    if (["file", "contact"].includes(unit.dataset.type)) {
      const minimumHeight = unit.dataset.type === "file" ? 258 : 150;
      const nextHeight = Math.min(Math.max(minimumHeight, currentAction.startHeight + event.clientY - currentAction.startY), Math.max(minimumHeight, board.clientHeight - unit.offsetTop));
      unit.style.height = `${nextHeight}px`;
    }
  }
  if (mode === "rotate") {
    const angle = Math.atan2(event.clientY - currentAction.centerY, event.clientX - currentAction.centerX) * 180 / Math.PI + 90;
    const nextAngle = Math.min(12, Math.max(-12, angle));
    unit.style.setProperty("--rotation", `${nextAngle}deg`);
  }
  if (selectedUnit === unit) positionContextToolbar();
});

window.addEventListener("pointerup", () => { currentAction = null; });
window.addEventListener("resize", positionContextToolbar);

toolButtons.forEach((button) => button.addEventListener("click", () => activeTool === button.dataset.tool ? closeCreationPanel() : setActiveTool(button.dataset.tool)));

themeButtons.forEach((button) => button.addEventListener("click", () => {
  board.dataset.theme = button.dataset.theme;
  themeButtons.forEach((swatch) => swatch.classList.toggle("active", swatch === button));
}));

filterButtons.forEach((button) => button.addEventListener("click", () => {
  const filter = button.dataset.filter;
  filterButtons.forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll(".board-unit").forEach((unit) => unit.classList.toggle("is-filtered", filter !== "all" && unit.dataset.type !== filter));
  clearSelection();
}));

helpButton.addEventListener("click", () => { helpDialog.showModal(); helpButton.setAttribute("aria-expanded", "true"); });
document.querySelector(".close-dialog").addEventListener("click", () => { helpDialog.close(); helpButton.setAttribute("aria-expanded", "false"); });
helpDialog.addEventListener("close", () => helpButton.setAttribute("aria-expanded", "false"));

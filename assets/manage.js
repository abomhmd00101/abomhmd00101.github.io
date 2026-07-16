const STORAGE_KEY = "laithPortfolioConfig";
const defaults = window.PORTFOLIO_DEFAULTS;

const socialFields = {
  github: document.querySelector("#social-github"),
  linkedin: document.querySelector("#social-linkedin"),
  discord: document.querySelector("#social-discord")
};
const achievementList = document.querySelector("#achievement-editors");
const formNote = document.querySelector("#manager-note");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return clone(defaults);
    return {
      social: { ...defaults.social, ...(saved.social || {}) },
      achievements: Array.isArray(saved.achievements) ? saved.achievements : clone(defaults.achievements)
    };
  } catch {
    return clone(defaults);
  }
}

let config = loadConfig();

function achievementEditor(item, index) {
  const article = document.createElement("article");
  article.className = "achievement-editor";
  article.dataset.index = String(index);
  article.innerHTML = `
    <div class="editor-topline">
      <strong>Achievement ${String(index + 1).padStart(2, "0")}</strong>
      <button class="danger-link" type="button" data-remove>Remove</button>
    </div>
    <label>Title<input data-field="title" value="${escapeAttribute(item.title || "")}"></label>
    <label>Description<textarea data-field="description" rows="3">${escapeHtml(item.description || "")}</textarea></label>
    <div class="editor-grid">
      <label>GitHub URL<input data-field="github" type="url" value="${escapeAttribute(item.github || "")}"></label>
      <label>Categories<input data-field="category" value="${escapeAttribute(item.category || "security")}"></label>
      <label>Status<input data-field="status" value="${escapeAttribute(item.status || "Documented")}"></label>
      <label>Type<input data-field="type" value="${escapeAttribute(item.type || "PROJECT")}"></label>
    </div>
    <label>Tags (comma separated)<input data-field="tags" value="${escapeAttribute((item.tags || []).join(", "))}"></label>
    <input data-field="id" type="hidden" value="${escapeAttribute(item.id || `custom-${Date.now()}-${index}`)}">
  `;
  article.querySelector("[data-remove]").addEventListener("click", () => {
    config.achievements.splice(index, 1);
    render();
  });
  return article;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function render() {
  Object.entries(socialFields).forEach(([key, input]) => {
    input.value = config.social[key] || "";
  });
  achievementList.replaceChildren(...config.achievements.map(achievementEditor));
}

function collect() {
  config.social = Object.fromEntries(
    Object.entries(socialFields).map(([key, input]) => [key, input.value.trim()])
  );
  config.achievements = [...achievementList.querySelectorAll(".achievement-editor")].map((editor) => {
    const get = (field) => editor.querySelector(`[data-field="${field}"]`).value.trim();
    return {
      id: get("id") || `custom-${Date.now()}`,
      title: get("title"),
      description: get("description"),
      github: get("github"),
      category: get("category") || "security",
      tags: get("tags").split(",").map((tag) => tag.trim()).filter(Boolean),
      status: get("status") || "Documented",
      type: get("type") || "PROJECT"
    };
  });
}

document.querySelector("#portfolio-manager").addEventListener("submit", (event) => {
  event.preventDefault();
  collect();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  formNote.textContent = "Saved locally. Refresh the portfolio pages to see the changes.";
  formNote.classList.add("success");
});

document.querySelector("#add-achievement").addEventListener("click", () => {
  collect();
  config.achievements.push({
    id: `custom-${Date.now()}`,
    title: "New achievement",
    description: "Describe what you built, learned, or delivered.",
    github: "",
    category: "security",
    tags: ["Project"],
    status: "Documented",
    type: "NEW PROJECT"
  });
  render();
  achievementList.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector("#reset-manager").addEventListener("click", () => {
  if (!confirm("Reset all local portfolio edits?")) return;
  localStorage.removeItem(STORAGE_KEY);
  config = clone(defaults);
  render();
  formNote.textContent = "Local edits were reset to the repository defaults.";
});

document.querySelector("#export-manager").addEventListener("click", () => {
  collect();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "portfolio-config.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.querySelector("#import-manager").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    config = {
      social: { ...defaults.social, ...(imported.social || {}) },
      achievements: Array.isArray(imported.achievements) ? imported.achievements : clone(defaults.achievements)
    };
    render();
    formNote.textContent = "Imported successfully. Press Save to keep it in this browser.";
  } catch {
    formNote.textContent = "The selected file is not valid portfolio JSON.";
  }
});

render();


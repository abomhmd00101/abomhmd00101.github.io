const currentPage = document.body.dataset.page;
document.querySelector(`[data-nav="${currentPage}"]`)?.classList.add("active");

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

menuButton?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 })
  : null;

document.querySelectorAll(".reveal").forEach((element) => {
  if (revealObserver) revealObserver.observe(element);
  else element.classList.add("visible");
});

const portfolioDefaults = window.PORTFOLIO_DEFAULTS;
const portfolioStorageKey = "laithPortfolioConfig";

function loadPortfolioConfig() {
  if (!portfolioDefaults) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(portfolioStorageKey) || "null");
    if (!saved) return portfolioDefaults;
    return {
      social: { ...portfolioDefaults.social, ...(saved.social || {}) },
      achievements: Array.isArray(saved.achievements) ? saved.achievements : portfolioDefaults.achievements
    };
  } catch {
    return portfolioDefaults;
  }
}

function applySocialLinks(config) {
  document.querySelectorAll("[data-social]").forEach((link) => {
    const network = link.dataset.social;
    const url = config?.social?.[network]?.trim();
    const label = link.querySelector("strong");
    const arrow = link.querySelector("b");

    if (!url) {
      link.href = "manage.html";
      link.removeAttribute("target");
      link.removeAttribute("rel");
      if (label) label.textContent = "Add from Manage";
      if (arrow) arrow.textContent = "→";
      return;
    }

    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    if (label) {
      label.textContent = network === "github"
        ? `@${url.replace(/\/$/, "").split("/").pop()}`
        : `${network[0].toUpperCase() + network.slice(1)} profile`;
    }
    if (arrow) arrow.textContent = "↗";
  });
}

function updateAchievementRow(row, achievement) {
  const title = row.querySelector(".row-main h2");
  const description = row.querySelector(".row-main > p");
  const status = row.querySelector(".row-meta .status");
  const type = row.querySelector(".row-meta > span:last-child");
  const resource = row.querySelector(".project-resource");
  const tags = row.querySelector(".row-tags");

  row.dataset.category = achievement.category || "security";
  if (title) title.textContent = achievement.title;
  if (description) description.textContent = achievement.description;
  if (status) status.textContent = achievement.status || "Documented";
  if (type) type.textContent = achievement.type || "PROJECT";
  if (resource) {
    if (achievement.github) {
      resource.href = achievement.github;
      resource.target = "_blank";
      resource.rel = "noreferrer";
      resource.hidden = false;
    } else {
      resource.hidden = true;
    }
  }
  if (tags) {
    tags.replaceChildren(...(achievement.tags || []).map((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      return item;
    }));
  }
}

function createAchievementRow(achievement, index) {
  const article = document.createElement("article");
  article.className = "project-row";
  article.id = achievement.id;
  article.dataset.category = achievement.category || "security";

  const number = document.createElement("div");
  number.className = "row-number";
  number.textContent = String(index + 1).padStart(2, "0");

  const main = document.createElement("div");
  main.className = "row-main";
  const meta = document.createElement("div");
  meta.className = "row-meta";
  const status = document.createElement("span");
  status.className = "status complete";
  status.textContent = achievement.status || "Documented";
  const type = document.createElement("span");
  type.textContent = achievement.type || "PROJECT";
  meta.append(status, type);

  const title = document.createElement("h2");
  title.textContent = achievement.title;
  const description = document.createElement("p");
  description.textContent = achievement.description;
  const resource = document.createElement("a");
  resource.className = "text-link project-resource";
  resource.href = achievement.github || "manage.html";
  resource.target = achievement.github ? "_blank" : "";
  resource.rel = achievement.github ? "noreferrer" : "";
  resource.textContent = achievement.github ? "View on GitHub ↗" : "Add a GitHub link →";
  main.append(meta, title, description, resource);

  const tags = document.createElement("ul");
  tags.className = "tag-list row-tags";
  (achievement.tags || []).forEach((tag) => {
    const item = document.createElement("li");
    item.textContent = tag;
    tags.append(item);
  });

  article.append(number, main, tags);
  return article;
}

const portfolioConfig = loadPortfolioConfig();
if (portfolioConfig) {
  applySocialLinks(portfolioConfig);
  const knownIds = new Set();
  portfolioConfig.achievements.forEach((achievement) => {
    const row = document.getElementById(achievement.id);
    if (row) {
      knownIds.add(achievement.id);
      updateAchievementRow(row, achievement);
    }
  });
  const customContainer = document.querySelector("[data-custom-achievements]");
  if (customContainer) {
    const customAchievements = portfolioConfig.achievements.filter((item) => !knownIds.has(item.id));
    customContainer.replaceChildren(
      ...customAchievements.map((item, index) => createAchievementRow(item, knownIds.size + index))
    );
  }
}

const filterButtons = document.querySelectorAll("[data-filter]");
const projectRows = document.querySelectorAll(".project-row");
const emptyState = document.querySelector(".empty-state");

filterButtons.forEach((button) => {
  const filter = button.dataset.filter;
  const count = [...projectRows].filter((project) => {
    const categories = project.dataset.category?.split(" ") ?? [];
    return filter === "all" || categories.includes(filter);
  }).length;
  const countNode = button.querySelector("span");
  if (countNode) countNode.textContent = String(count);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    let visibleCount = 0;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    projectRows.forEach((project) => {
      const categories = project.dataset.category?.split(" ") ?? [];
      const shouldShow = filter === "all" || categories.includes(filter);
      project.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;
  });
});

const demoForm = document.querySelector("#demo-contact-form");
demoForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const note = document.querySelector("#form-note");
  note.textContent = "Previewed locally only — no data was sent or stored.";
  note.classList.add("success");
});

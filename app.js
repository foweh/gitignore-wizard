/**
 * .gitignore Wizard — 应用逻辑
 *
 * 功能: 模板选择、搜索、实时生成、逐行解释、复制下载
 */

(() => {
  "use strict";

  // ---- 状态 ----
  const state = {
    selectedTemplates: new Set(),
    activeCategory: "all",
    searchQuery: "",
    extraOptions: {
      optEnv: false,
      optDSStore: true,
      optThumbsdb: true,
      optVscode: false,
      optIdea: false,
      optLogs: false,
    },
  };

  // ---- DOM 引用 ----
  const $ = (id) => document.getElementById(id);
  const els = {
    categoryTabs: $("categoryTabs"),
    templateList: $("templateList"),
    selectedTags: $("selectedTags"),
    selectedCount: $("selectedCount"),
    gitignoreOutput: $("gitignoreOutput"),
    explanation: $("explanation"),
    resultContent: $("resultContent"),
    resultHint: $("resultHint"),
    searchInput: $("searchInput"),
    copyBtn: $("copyBtn"),
    downloadBtn: $("downloadBtn"),
    resetBtn: $("resetBtn"),
    toast: $("toast"),
  };

  // ---- 辅助 ----
  const escapeHtml = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const showToast = (msg, duration = 2000) => {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(els.toast._timer);
    els.toast._timer = setTimeout(() => els.toast.classList.remove("show"), duration);
  };

  // 从 localStorage 恢复状态
  const loadState = () => {
    try {
      const saved = localStorage.getItem("gitignore-wizard-state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedTemplates) {
          state.selectedTemplates = new Set(parsed.selectedTemplates);
        }
        if (parsed.extraOptions) {
          Object.assign(state.extraOptions, parsed.extraOptions);
        }
        if (parsed.activeCategory) {
          state.activeCategory = parsed.activeCategory;
        }
        // 更新 checkbox UI
        for (const [key, val] of Object.entries(state.extraOptions)) {
          const el = $(key);
          if (el) el.checked = val;
        }
      }
    } catch (e) {
      // 忽略
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem(
        "gitignore-wizard-state",
        JSON.stringify({
          selectedTemplates: [...state.selectedTemplates],
          extraOptions: state.extraOptions,
          activeCategory: state.activeCategory,
        })
      );
    } catch (e) {
      // 忽略
    }
  };

  // ---- 渲染分类标签 ----
  const renderTabs = () => {
    els.categoryTabs.innerHTML = CATEGORIES.map(
      (cat) =>
        `<button class="tab${state.activeCategory === cat.id ? " active" : ""}" data-cat="${cat.id}">${cat.name}</button>`
    ).join("");

    els.categoryTabs.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeCategory = btn.dataset.cat;
        saveState();
        renderTabs();
        renderTemplateList();
      });
    });
  };

  // ---- 渲染模板列表 ----
  const renderTemplateList = () => {
    const query = state.searchQuery.toLowerCase().trim();

    let filtered = TEMPLATE_DATA;

    // 分类过滤
    if (state.activeCategory !== "all") {
      filtered = filtered.filter((t) => t.category === state.activeCategory);
    }

    // 搜索过滤
    if (query) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query)
      );
    }

    if (filtered.length === 0) {
      els.templateList.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px;">没有找到匹配的模板</div>`;
      return;
    }

    els.templateList.innerHTML = filtered
      .map(
        (t) => `
          <label class="template-item${state.selectedTemplates.has(t.id) ? " selected" : ""}" data-id="${t.id}">
            <input type="checkbox" ${state.selectedTemplates.has(t.id) ? "checked" : ""} />
            <span class="tmpl-name">${t.name}</span>
          </label>
        `
      )
      .join("");

    els.templateList.querySelectorAll(".template-item").forEach((item) => {
      const cb = item.querySelector("input[type='checkbox']");
      const id = item.dataset.id;

      item.addEventListener("click", (e) => {
        if (e.target === cb) return; // 让 checkbox 原生事件处理
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });

      cb.addEventListener("change", () => {
        if (cb.checked) {
          state.selectedTemplates.add(id);
        } else {
          state.selectedTemplates.delete(id);
        }
        item.classList.toggle("selected", cb.checked);
        saveState();
        renderSelectedTags();
        generateGitignore();
      });
    });
  };

  // ---- 渲染已选标签 ----
  const renderSelectedTags = () => {
    const names = [...state.selectedTemplates].map((id) => {
      const t = TEMPLATE_DATA.find((t) => t.id === id);
      return t ? t.name : id;
    });

    els.selectedCount.textContent = state.selectedTemplates.size;

    if (state.selectedTemplates.size === 0) {
      els.selectedTags.innerHTML =
        '<span style="color:var(--text-muted);font-size:0.85rem;">还没选模板，快去左边点选吧</span>';
      return;
    }

    els.selectedTags.innerHTML = names
      .map(
        (name, i) =>
          `<span class="selected-tag">${escapeHtml(name)} <span class="remove" data-idx="${i}" data-id="${[...state.selectedTemplates][i]}">✕</span></span>`
      )
      .join("");

    els.selectedTags.querySelectorAll(".remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        state.selectedTemplates.delete(id);
        saveState();
        renderSelectedTags();
        renderTemplateList();
        generateGitignore();
      });
    });
  };

  // ---- 生成 .gitignore ----
  const generateGitignore = () => {
    const templateIds = [...state.selectedTemplates];
    const hasSelection = templateIds.length > 0;

    // 是否有额外选项选中
    const activeExtras = Object.entries(state.extraOptions).filter(
      ([, v]) => v
    );

    if (!hasSelection && activeExtras.length === 0) {
      els.resultHint.style.display = "block";
      els.resultContent.classList.remove("visible");
      return;
    }

    els.resultHint.style.display = "none";
    els.resultContent.classList.add("visible");

    // 收集所有行，保留来源用于解释
    const lines = [];
    const explanations = [];

    for (const id of templateIds) {
      const t = TEMPLATE_DATA.find((t) => t.id === id);
      if (!t) continue;

      // 添加模板标题注释
      lines.push("", `# === ${t.name} ===`);

      const contentLines = t.content.split("\n");
      for (const line of contentLines) {
        lines.push(line);
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          explanations.push({
            pattern: trimmed,
            source: t.name,
            desc: getExplanation(trimmed, t.name),
          });
        }
      }
    }

    // 添加额外选项
    for (const [key, _val] of activeExtras) {
      const extra = EXTRA_PATTERNS[key];
      if (!extra) continue;

      lines.push("", `# === ${getExtraLabel(key)} ===`);
      const extraLines = extra.content.split("\n");
      for (const line of extraLines) {
        lines.push(line);
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          explanations.push({
            pattern: trimmed,
            source: getExtraLabel(key),
            desc: extra.explanation,
          });
        }
      }
    }

    // 去重（保留首次出现）
    const seen = new Set();
    const uniqueExplanations = explanations.filter((e) => {
      if (seen.has(e.pattern)) return false;
      seen.add(e.pattern);
      return true;
    });

    // 渲染输出
    const output = lines.join("\n").replace(/^\n/, ""); // 去掉开头的空行
    els.gitignoreOutput.innerHTML = escapeHtml(output);

    // 渲染解释
    if (uniqueExplanations.length > 0) {
      els.explanation.innerHTML = `
        <h3>逐行解释（${uniqueExplanations.length} 条）</h3>
        ${uniqueExplanations
          .map(
            (e) => `
            <div class="explain-item">
              <span class="explain-pattern">${escapeHtml(e.pattern)}</span>
              <span class="explain-desc">
                <strong>${escapeHtml(e.source)}</strong> — ${escapeHtml(e.desc)}
              </span>
            </div>
          `
          )
          .join("")}
      `;
    } else {
      els.explanation.innerHTML = "";
    }
  };

  // 内置解释库（保持轻量）
  function getExplanation(pattern, source) {
    const known = {
      node_modules: "npm/yarn/pnpm 安装的依赖包目录，体积巨大，每个人独立安装",
      "dist/": "构建输出目录，每次构建都会重新生成",
      build: "构建产物目录",
      ".next/": "Next.js 构建缓存和产物",
      ".nuxt/": "Nuxt.js 构建缓存",
      ".env": "环境变量配置文件，可能包含密钥",
      __pycache__: "Python 字节码缓存目录",
      "*.pyc": "Python 编译后的字节码文件",
      "*.pyo": "Python 优化编译后的字节码文件",
      target: "构建目标目录（Rust / Java Maven 等）",
      ".git/": "Git 仓库元数据目录",
      node_modules: "Node.js 依赖包",
      ".DS_Store": "macOS 访达文件夹设置缓存",
      "Thumbs.db": "Windows 图片缩略图缓存",
      "*.log": "运行时产生的日志文件",
      "*.class": "Java 编译后的字节码文件",
      "*.o": "C/C++ 编译后的对象文件",
      "*.exe": "Windows 可执行文件",
      "*.so": "Unix/Linux 共享库文件",
      "*.dll": "Windows 动态链接库文件",
      ".idea/": "JetBrains IDE 项目配置",
      ".vscode/": "VS Code 编辑器配置",
      coverage: "测试覆盖率报告输出目录",
      vendor: "PHP Composer / Go 依赖目录",
      ".terraform/": "Terraform 工作目录，包含 provider 缓存和状态锁",
      "*.tfstate": "Terraform 状态文件，可能包含基础设施敏感信息",
      ".serverless/": "Serverless Framework 构建产物",
      ".turbo/": "Turborepo 缓存目录",
    };

    // 精确匹配
    const trimmed = pattern.replace(/\/$/, ""); // 去掉末尾斜杠
    if (known[pattern]) return known[pattern];
    if (known[trimmed]) return known[trimmed];

    // 模糊匹配
    for (const [key, desc] of Object.entries(known)) {
      if (pattern.includes(key) || key.includes(pattern)) return desc;
    }

    return `来自 ${source} 的忽略规则`;
  }

  function getExtraLabel(key) {
    const labels = {
      optEnv: "环境变量文件",
      optDSStore: "macOS 系统文件",
      optThumbsdb: "Windows 系统文件",
      optVscode: "VS Code 配置",
      optIdea: "JetBrains IDE 配置",
      optLogs: "日志文件",
    };
    return labels[key] || key;
  }

  // ---- 搜索 ----
  els.searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderTemplateList();
  });

  // ---- 额外选项 ----
  document.querySelectorAll(".extra-options input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", () => {
      state.extraOptions[cb.id] = cb.checked;
      saveState();
      generateGitignore();
    });
  });

  // ---- 复制 ----
  els.copyBtn.addEventListener("click", async () => {
    const text = els.gitignoreOutput.textContent;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      showToast("已复制到剪贴板！");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("已复制到剪贴板！");
    }
  });

  // ---- 下载 ----
  els.downloadBtn.addEventListener("click", () => {
    const text = els.gitignoreOutput.textContent;
    if (!text) return;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".gitignore";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("已下载 .gitignore 文件！");
  });

  // ---- 重置 ----
  els.resetBtn.addEventListener("click", () => {
    state.selectedTemplates.clear();
    state.extraOptions = {
      optEnv: false,
      optDSStore: true,
      optThumbsdb: true,
      optVscode: false,
      optIdea: false,
      optLogs: false,
    };

    // 重置 checkbox
    for (const [key, val] of Object.entries(state.extraOptions)) {
      const el = $(key);
      if (el) el.checked = val;
    }

    state.searchQuery = "";
    els.searchInput.value = "";

    saveState();
    renderTemplateList();
    renderSelectedTags();
    generateGitignore();

    showToast("已重置所有选择");
  });

  // ---- 键盘快捷键 ----
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K → 聚焦搜索
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      els.searchInput.focus();
    }
  });

  // ---- 初始化 ----
  const init = () => {
    loadState();

    // 应用额外选项状态到 checkbox
    for (const [key, val] of Object.entries(state.extraOptions)) {
      const el = $(key);
      if (el) el.checked = val;
    }

    renderTabs();
    renderTemplateList();
    renderSelectedTags();
    generateGitignore();

    // 如果搜索有内容，重新渲染
    if (state.searchQuery) {
      els.searchInput.value = state.searchQuery;
    }
  };

  init();
})();

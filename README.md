# 🧙 .gitignore Wizard

> **交互式 .gitignore 生成器** — 点选你的项目类型，一键生成 .gitignore，**逐行解释**为什么忽略。

[![GitHub Stars](https://img.shields.io/github/stars/foweh/gitignore-wizard?style=social)]()
[![License MIT](https://img.shields.io/badge/license-MIT-blue)]()
[![纯前端](https://img.shields.io/badge/纯前端-离线可用-green)]()

---

## ✨ 它能做什么

| 功能 | 说明 |
|------|------|
| 🎯 **点选模板** | 30+ 内置模板，覆盖 Python / Node / Go / Rust / Java / React / Vue / Docker…… |
| 🔍 **逐行解释** | 每一行忽略规则都告诉你「为什么」 |
| 🔎 **实时搜索** | 按语言/框架名搜索，快速定位 |
| 📋 **一键复制** | 点击即复制到剪贴板 |
| ⬇ **下载文件** | 直接下载 `.gitignore` 文件 |
| ✏️ **额外选项** | 勾选 .env / .DS_Store / Thumbs.db / IDE 配置等通用忽略项 |
| 💾 **自动保存** | 你的选择保存在浏览器，下次打开自动恢复 |
| 📱 **响应式** | 桌面和移动端都能用 |

## 🚀 快速使用

### 在线版（推荐）

👉 **[使用 .gitignore Wizard](https://foweh.github.io/gitignore-wizard/)**（如果已部署 GitHub Pages）

### 本地运行

```bash
# 克隆
git clone https://github.com/foweh/gitignore-wizard.git
cd gitignore-wizard

# 直接用浏览器打开即可
open index.html
# 或
start index.html
```

> 纯前端，**零依赖**，不需要 npm install，不需要构建工具。

## 🏗 项目结构

```
gitignore-wizard/
├── index.html      # 主页面
├── style.css       # 样式（GitHub Dark 风格）
├── templates.js    # 30+ 内置 .gitignore 模板数据
├── app.js          # 交互逻辑（选择、生成、复制、下载）
└── README.md
```

## 🧠 设计理念

1. **零配置** — 不需要注册、不需要后端、不依赖 npm
2. **教育优先** — 每行规则都有解释，帮新手理解 gitignore
3. **离线可用** — 所有数据打包在 JS 中，Service Worker 后可离线
4. **隐私友好** — 所有数据在浏览器本地处理，不上传任何信息

## 🔮 未来计划

- [ ] **团队规范模式** — 生成 `.gitignore` 的同时生成 `.gitignore_team`
- [ ] **更多模板** — 自动同步 github/gitignore 仓库的最新模板
- [ ] **导出为 GitHub 仓库模板** — 一键创建带 .gitignore 的新仓库
- [ ] **暗色/亮色主题切换**
- [ ] **PWA 支持** — 安装到桌面使用

## 🤝 贡献

想加一个新模板？欢迎 PR！

1. 在 `templates.js` 中添加你的模板
2. 确保内容来自 [github/gitignore](https://github.com/github/gitignore) 或经过验证
3. 提交 PR

## 📄 License

MIT

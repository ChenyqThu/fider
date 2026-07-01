# Research Summary: 把 Astro/Starlight 站搬进主仓 `site/`、直读 `docs/`、删同步脚本（方案 C）

- **Query**: 方案 C 技术可行性总调研（4 个子问题）
- **Scope**: mixed
- **Date**: 2026-07-01
- **Versions**: `@astrojs/starlight` **0.41.1**, `astro` **7.0.3**（两仓 node_modules 实测）

## 现状（实测事实，供 implement 参照）

### 主仓 `/Users/chenyuanquan/Documents/Omada-Beacon/`
- GitHub: `ChenyqThu/Omada-Beacon`（Fider fork，Go + React）。根有 `Dockerfile`，Fider 走 **Docker/自托管**，**不在 Vercel**。
- 文档源：`docs/`，纯 markdown、**首行 `# H1`、无 YAML frontmatter**：
  - `docs/01-overview.md` … `docs/08-original-proposal.md`（8 个编号文档）
  - `docs/design/content-site-architecture.md`、`docs/design/custom-forms-and-notion-sync.md`（Starlight 当前 sidebar 引用这 2 个）
  - `docs/design/` 另有 `poll-voting.md`、`rename-to-omada-beacon.md`（sidebar 未引用）
  - 另有 `docs/README.md`、`docs/OAUTH_ROLE_RESTRICTION.md`、`docs/Omada Design System/`（当前 sync 脚本只取 `0*.md` 和 `design/*.md`，其余未纳入站点）
  - 实测源 md 内含相对链接（如 `01-overview.md` 里 `./04-database.md`）。

### 独立仓 `/Users/chenyuanquan/Documents/omada-beacon-docs/`
- GitHub: `ChenyqThu/omada-beacon-docs`，连 Vercel 项目 `omada-beacon-docs`（域名 `beacon.omada.ink`）。
- Astro + Starlight 站：
  - `astro.config.mjs`：`site: https://beacon.omada.ink`，Starlight `title/description`、`zh-CN` locale、写死的 sidebar（8 编号文档 + 2 设计提案，用 `slug`）。**未开 lastUpdated**。
  - `src/content.config.ts`：`docs: defineCollection({ loader: docsLoader(), schema: docsSchema() })`（官方默认）。
  - `src/content/docs/*`：当前是 sync 脚本从主仓 `docs/` **拷贝**来的结果（已带注入的 frontmatter title、已删正文 H1）。另有手写 `index.mdx`（splash hero 首页，非同步产物）。
  - `scripts/sync-docs.sh`：拷贝式同步——`grep` 首个 `# ` 当 title 写进 frontmatter、`awk` 删首个 H1。源路径写死 `/Users/chenyuanquan/Documents/fider/docs`（已过时）。
  - deps：`@astrojs/starlight ^0.41.1`、`astro ^7.0.3`、`sharp`。

## 四问结论速览

1. **读外部目录**：`docsLoader()`（0.41）**不接受** `base`/`pattern`，只接受 `generateId`；`base` 写死 `src/content/docs`。底层确是 Astro `glob()`。**Astro 原生 `glob({ base:'../docs' })` 支持外部目录**，可替换 `docsLoader()`，但会丢 Starlight remark 增强（需 `markdown.processedDirs` 补）。Starlight 官方源码自认"自定义 content 目录位置尚未支持"。→ 详 `01-starlight-external-docs-dir.md`。
2. **无 title**：源 md 无 frontmatter → schema 必填 `title` 校验失败。**(a) 自定义 loader 注入 title = 唯一可行**（loader 直接写 `data`，schema 在其上校验）；**(b) remark 注入 frontmatter 不行**（remark 在 schema 校验之后、写的是渲染产物而非 collection `data`）；(c) docsLoader 无此选项。给了 0.41/astro7 最小 loader 代码。→ 详 `02-title-from-h1.md`。
3. **软链**：git 可提交（mode 120000，需 `core.symlinks=true`）；Vercel clone 会保留仓内相对软链，同仓目标可解析（**建议预览部署实测**）。好处=路径不变可继续用官方 `docsLoader()`；**但软链不解决 title**，且 lastUpdated/Windows 有坑。→ 详 `03-symlink-and-git-lastupdated.md`。
4. **Vercel 子目录**：Settings → Root Directory=`site` + **开启 "Include files outside Root Directory"**（因 Starlight 读 `../docs`）+ Ignored Build Step 只在 `site/`|`docs/` 变化时构建。Fider 走 Docker，**不受影响**。迁移=把现有 Vercel 项目 Git 源改连主仓、设 Root Directory、域名原地保留。→ 详 `04-vercel-subdir-build-and-migration.md`。

## 推荐路径（给决策，非强制）

**要真正"单一源头、零同步"，两条主路：**

- **路 A（最干净，推荐）：自定义 loader 读 `../docs` + 注入 H1 title**
  - 一步解决"外部目录 + 无 title"；无拷贝、无软链。
  - 代价：自写 ~40 行 loader；可能配 `markdown.processedDirs: ['../docs']` 补 Starlight remark（源 md 未用 asides，标题锚点缺失可接受）；需实测相对链接不 404、slug 与 sidebar 对齐。
  - lastUpdated 若要用需另解（现状未开，非阻塞）。

- **路 B（最大化复用官方 `docsLoader()`）：软链 `src/content/docs -> ../../docs`**
  - 路径不变，继续用官方 loader + Starlight remark。
  - **但仍需解决 title**（软链不解决）：要么构建前脚本补 frontmatter（又有同步步骤，违背零同步），要么仍上自定义 loader——此时软链没意义。故**路 B 单独并不能达成"零同步 + 无 title 自动解决"**。
  - 另有 Windows symlink 坑、lastUpdated symlink 失真、Vercel 需实测跟随软链。

→ **综合：路 A（自定义 loader）最契合方案 C 的"零同步"目标**。软链更适合"源 md 本来就有 frontmatter"的项目，本项目源 md 无 frontmatter，软链省不掉 title 这步。

**Vercel 侧（两路通用）**：Root Directory=`site` + 开启外部文件 + Ignored Build Step；原地改现有 Vercel 项目的 Git 源到主仓，域名不动。

## 全部需实测/未验证项（交给 implement）

- 自定义 loader 代码为源码推导的最小实现，**未实机 `astro build`**：需验 title 正确、正文首 H1 去重、相对链接不 404、slug 与现有 sidebar `slug` 对齐、`index.mdx` splash 首页保留。
- `markdown.processedDirs` 是否接受 `../` 外部目录，官方无示例，需实测。
- Vercel 是否跟随仓内相对软链 + "外部文件开关 + `../docs`"组合，需一次预览部署验证。
- `fast-glob` 是否已在 site 依赖树（自定义 loader 里用到；可改 `node:fs`）。

## 文件清单

- `00-summary-and-current-setup.md`（本文）— 现状事实 + 四问速览 + 推荐
- `01-starlight-external-docs-dir.md` — docsLoader 签名 / glob base / processedDirs
- `02-title-from-h1.md` — title 注入三方案评估 + 自定义 loader 最小代码
- `03-symlink-and-git-lastupdated.md` — 软链 git/Vercel 可靠性 + lastUpdated 坑 + 方案对比表
- `04-vercel-subdir-build-and-migration.md` — Root Directory / 外部文件开关 / Ignored Build Step / 迁移步骤

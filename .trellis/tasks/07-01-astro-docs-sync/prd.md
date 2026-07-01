# 文档站并入主仓：Astro 直读 docs、移除 sync 脚本

## 背景 / 现状

文档目前"源 → 拷贝 → 发布站"两地维护，已脱节：

- **源**：主仓 `docs/`（`01-overview.md`…`08-original-proposal.md` + `design/*.md`），纯 markdown，首行 `# H1`，**无 frontmatter**。跟 Fider 代码一起版本管理。
- **发布站**：独立仓 `~/Documents/omada-beacon-docs/`，Astro + Starlight，部署 Vercel（beacon.omada.ink）。靠 `scripts/sync-docs.sh` 把源 md **拷贝**进 `src/content/docs/`，拷贝时提取首个 H1 当 frontmatter title、删正文 H1。

脱节根因：**手动拷贝 + 脚本源路径写死**。症状：
1. `sync-docs.sh` 默认源路径 `/Users/chenyuanquan/Documents/fider/docs` 已失效（项目改名 Omada-Beacon）。
2. 站点内容停在 6/26，源 6/30 更新过（改名、Poll 规划、architecture/roadmap 扩写）。
3. 站点缺 2 篇新提案：`design/poll-voting.md`、`design/rename-to-omada-beacon.md`。
4. `astro.config.mjs` sidebar 手动维护，新文档不加就不显示。

## 目标（方案 C：单一源头、零同步）

把 Astro 站点工程搬进主仓 `site/` 子目录，让 Starlight **直接读主仓 `docs/`**，删除拷贝式 sync。以后只改 `docs/`，站点自动最新。完成后 `omada-beacon-docs` 独立仓库退役（可归档/删除）。

## 技术方案（已由 research 定案，见 `research/00-summary.md`）

1. **直读外部目录**：`site/src/content.config.ts` 用 `docsLoader({ base: '../docs' })` 直读主仓 `docs/`。
   - 代价：dev 模式下 `src/content/` 外的文件**不被 watch**（改 `docs/` 后需手动重启 dev）；**生产 build 不受影响**。文档站以 build 产物为准，可接受。
2. **title 不改源（关键约束）**：Starlight `docsLoader()` 用硬编码内部 glob loader，**不接受自定义 loader 函数**，无法在 load 期注入 title。采用 **remark 插件**（`site/remark-h1-title.mjs`）：构建期从 markdown AST 取首个 H1 → 写入 `data.astro.frontmatter.title` → 删除该 H1 节点。本质是把 `sync-docs.sh` 的转换逻辑搬到构建期。挂到 `astro.config.mjs` 的 `markdown.remarkPlugins`。
   - ⚠️ **风险点**：research 无法对 Starlight 0.41.1 源码证实"remark 注入的 title 能被 Starlight schema 校验认到"（时序问题）。**执行第一步必须 spike 验证**（见下）。
3. **sidebar 自动化**：改用 Starlight `autogenerate`，按 `docs/` 目录 + 文件名编号前缀（01-…08-）自动排序，根治"新文档漏加"。design/ 无编号按字母序，可接受。

### ⚠️ 执行第一步：spike 验证（阻塞后续全量迁移）

搭最小 `site/`：`base: '../docs'` + remark 插件，只跑 1 篇源 md（如 `01-overview.md`）跑 `astro build`，确认：
- 页面能生成，title = "01 · 项目总览"（来自 H1），正文不重复 H1。
- 若通过 → 全量迁移；**若失败 → 退化方案**（见风险节），并回头跟开发者确认。

## 迁移清单

**搬进主仓 `site/`（从 `omada-beacon-docs/` 复制工程骨架）：**
- `astro.config.mjs`（加 remark 插件、sidebar 改 autogenerate、site 保持 beacon.omada.ink）
- `package.json`、`tsconfig.json`
- `src/content.config.ts`（loader 改 `base: '../docs'`）
- `src/content/docs/index.mdx`（splash 首页，站点独有，保留）
- 新增 `site/remark-h1-title.mjs`（title 提取插件）
- `.gitignore`：主仓忽略 `site/node_modules`、`site/dist`、`site/.astro`

**删除（不再需要）：**
- `scripts/sync-docs.sh`
- `omada-beacon-docs/src/content/docs/*.md` + `design/*.md`（拷贝副本，改由直读源）

## 验证标准

- [ ] spike 通过：最小 site 能 build 出带正确 title 的页面。
- [ ] `cd site && npm install && npm run build` 成功，无报错。
- [ ] 页面覆盖全部源文档：01–08 共 8 页 + design/ 下 **4 篇**（含新的 poll-voting、rename-to-omada-beacon）+ 首页。
- [ ] 每页 title 正确（= 源 md 的 H1），正文不重复 H1。
- [ ] 改 `docs/` 任一 md → 重新 build → 站点内容更新（验证直读、零拷贝）。
- [ ] sidebar 自动含全部文档（新增无需手工登记）。
- [ ] 主仓 `make lint` / `make test` 不被 `site/` 干扰。
- [ ] `git status` 干净；`site/node_modules`、`site/dist`、`site/.astro` 已 gitignore。

## 风险 / 超出代码范围（需开发者操作）

- **remark 时序不确定**（见技术方案 2）：spike 先验证；失败则退化——(a) 给源 `docs/*.md` 补 frontmatter（改源，影响 GitHub 观感，需开发者确认）或 (b) 保留一个构建期 prebuild 转换脚本（非纯直读，但仍消除手动 sync）。
- **Vercel 重新接线（开发者手动）**：当前 Vercel 连 `omada-beacon-docs` 仓库。迁移后需在 Vercel 后台改为"连主仓 + Root Directory = `site/`"，域名 beacon.omada.ink 重新指向。代码侧无法完成，交付后由开发者操作。
- **主仓多一套 Node/Astro 子工程**：主仓根已有 Fider 的 `package.json`。`site/` 独立 `package.json`+`node_modules`，需确认不干扰 Fider 构建/CI（列入验证）。
- **splash 首页硬编码链接**：`index.mdx` 有 `/01-overview/`、`/design/custom-forms-and-notion-sync/` 等链接，迁移后确认路由不变、链接不失效。

## 明确不做（维持现状，避免顺手扩范围）

- `docs/README.md`、`docs/OAUTH_ROLE_RESTRICTION.md`、`docs/Omada Design System/` 维持"不上站"（与当前 sync 范围一致）。如需上站另开任务。
- 不动 Fider 应用本身的代码/构建。
- 不在本任务执行 Vercel 后台迁移（留给开发者）。

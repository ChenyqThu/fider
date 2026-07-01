# Research 摘要：Astro/Starlight 直读 docs + Vercel 子目录迁移

> ⚠️ **本文件已过时/含错误，勿据此实现。请以同目录 `00-summary-and-current-setup.md` 及 `01`~`04` 为准。**
> 下面这份是上一轮 research（结论未经源码核实）留下的。2026-07-01 第二轮已用两仓 `node_modules` 的 Starlight 0.41.1 / Astro 7.0.3 **源码逐行核实**，纠正了本文件的两处关键错误：
> - **Q1 错误**：本文件称 `docsLoader({ base: '../docs' })` 可读外部目录——**假的**。0.41.1 源码里 `docsLoader()` **只接受 `{ generateId }`**，`base` 写死为 `src/content/docs`，无法传参。要读外部目录须改用 Astro 原生 `glob({ base })` 或自定义 loader。见 `01-starlight-external-docs-dir.md`。
> - **Q2 错误**：本文件把 "remark 注入 `data.astro.frontmatter.title`" 当推荐路径——**这条不满足 schema 校验**。源码证实 remark 在 `parseData()`（schema 校验）之后才跑，且写的是渲染产物而非 collection `data`；源 md 无 frontmatter 会在 render 前就因必填 `title` 校验失败。正确解是**自定义 loader 注入 title**。见 `02-title-from-h1.md`。
>
> 以下原文仅为存档，**不要采信 Q1 的 `base` 选项与 Q2 的 remark 结论**。

---

（以下为上一轮未核实的原始摘要，保留仅作历史记录）

## Q1 — Starlight 读外部目录 `../docs`
- ~~`docsLoader()` 接受 `base` 选项~~ ❌ 见上方纠正：0.41 无此选项。
- caveat：`src/content/` 之外的文件在 dev 模式不被 watch（生产 build 不受影响）。（此点方向上成立，见 `02-*.md` 第 3 条 watcher 说明）
- 底层是 Astro glob loader。（✅ 属实）

## Q2 — 无 frontmatter 时生成 title
- ~~remark 插件设 `data.astro.frontmatter.title`~~ ❌ 见上方纠正：不满足 schema。正确解见 `02-*.md`（自定义 loader）。

## Q3 — 软链方案
- `site/src/content/docs -> ../../docs` 在 git 与 Vercel checkout 可保留。（大体属实，细节/坑见 `03-*.md`：软链**不解决 title**、lastUpdated 失真、Windows 坑。）

## Q4 — Vercel 子目录构建
- Root Directory 设 `site/`。（✅ 属实，补充：须开"Include files outside Root Directory"因读 `../docs`；迁移步骤见 `04-*.md`。）

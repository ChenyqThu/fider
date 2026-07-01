# Research: 软链方案（`site/src/content/docs -> ../../docs`）+ git/Vercel 可靠性 + Starlight lastUpdated 坑

- **Query**: 若改用软链 `site/src/content/docs -> ../../docs`，git 提交 + Vercel 构建时是否可靠？Vercel 检出仓库是否跟随软链？有无已知坑。另：Starlight lastUpdated 对外部目录的坑。
- **Scope**: mixed（git 行为 + Vercel 文档 + Starlight 0.41.1 源码）
- **Date**: 2026-07-01

## 结论（TL;DR）

- **软链在 git 层**：可提交。Git 把符号链接存成一个 mode `120000` 的 blob（内容=链接目标路径）。前提是 `core.symlinks=true`（macOS/Linux 默认 true；实测本仓未显式设置=默认 true）。
- **软链在 Vercel 构建层**：Vercel 用 `git clone` 检出，**会保留仓库里提交的符号链接**（clone 出来仍是 symlink，指向 `../../docs`）。只要**链接目标 `docs/` 也在同一个仓库、同一次 checkout 内**，构建时 `site/src/content/docs` 能解析到真实文件。→ **本方案 C 场景下（docs 和 site 同仓）软链通常可用**。
- **软链最大好处**：`src/content/docs` 路径**不变**，于是可以**继续用官方 `docsLoader()`**——避开 `01-*.md`/`02-*.md` 里"换 loader 丢 remark""自定义 loader 注入 title"的全部复杂度。**但 title 问题仍在**：软链只是让 Starlight 在原位读到文件，源 md 仍无 frontmatter → schema 必填 `title` 仍会失败。软链**不解决 title**，需配合"构建前生成 frontmatter"或仍走自定义 loader。
- **已知坑**：跨平台（Windows/CI `core.symlinks=false`）、Docker 构建 context、以及 Starlight `lastUpdated` 的 docsPath 假设（见下）。

## Findings

### 1. Git 如何存符号链接

- Git 原生支持 symlink：以特殊 mode `120000` 存储，blob 内容是链接的目标相对/绝对路径字符串。
- `git add site/src/content/docs`（当它是 symlink 时）提交的是"链接"本身，不是被链接的文件副本。
- **条件**：clone/checkout 端 `core.symlinks=true`。类 Unix 默认 true；Windows 默认 false（会把 symlink 检出成一个"内容是目标路径的普通文本文件"，构建即坏）。
- 实测：`git -C <repo> config --get core.symlinks` 为空 = 用默认（macOS 上 true）。

### 2. Vercel 是否跟随/保留符号链接

- Vercel Build 阶段通过 `git clone` 拉取仓库源码，**提交进 git 的 symlink 会原样出现在构建环境**（Linux 容器，`core.symlinks` 生效）。
- 因此 `site/src/content/docs -> ../../docs` 在 Vercel 上会解析到**同一仓库检出的** `docs/`。**关键前提：目标必须在仓库内且被同一次 checkout 拉到**（方案 C 满足：docs 与 site 同仓）。
- 反例（不可靠）：软链指向仓库**外**的绝对路径（如旧 sync 脚本里的 `/Users/.../docs`）——Vercel 环境没有该路径，构建必坏。方案 C 用相对软链 `../../docs`，不踩这个。
- ⚠️ **置信度**：Vercel 官方文档未单列 "symlink support" 明确条款；上述为 git + 标准 clone 行为的通用推断 + 社区普遍实践。**建议 implement 阶段用一次真实 Vercel 预览部署验证软链是否被跟随**（这是最省事的证伪方式）。

### 3. 软链方案的已知坑（逐条）

1. **不解决 title**：软链只改"文件在哪读"，源 md 仍无 frontmatter → Starlight `docsSchema` 必填 `title` 仍失败。软链需**叠加**下列之一：
   - 构建前用脚本给 `docs/*.md` 生成/补 frontmatter（又回到"有同步步骤"，与"零同步"目标矛盾）；
   - 或干脆不用软链，直接上自定义 loader（`02-*.md` 的 a 方案，一步到位解决"外部目录 + title"）。
2. **Windows / `core.symlinks=false` 环境**：clone 出来 symlink 变普通文本文件，本地 dev 或某些 CI 直接坏。团队若有 Windows 开发者需注意。
3. **`.gitignore` 冲突**：docs-repo 现有 `.gitignore` 忽略了 `dist/`、`.astro/` 等；迁到主仓 `site/` 后要确保**不误 ignore 软链本身或 `docs/`**。
4. **Astro/Vite 对 symlink 的 watch**：dev 模式下对通过 symlink 暴露的目录做文件监听，个别版本有 HMR 不触发的历史问题；对纯构建（Vercel）无影响，对本地 dev 体验可能有轻微影响。
5. **双重路径**：`docs/01-overview.md` 会同时以 `docs/…` 和 `site/src/content/docs/…`(软链) 两个路径存在于仓库视图，工具（搜索、其它脚本）需理解这是同一文件。

### 4. Starlight `lastUpdated`（git 最后更新时间）对外部目录/软链的坑

> 本项目当前 `astro.config.mjs` **未开启** `lastUpdated`，故**当前非阻塞**；但若日后开启，且内容走"外部目录/自定义 loader"，会踩以下坑，先记录。

源码实测：
- `node_modules/@astrojs/starlight/integrations/vite-virtual-modules.ts:61`：
  ```ts
  const docsPath = resolveCollectionPath('docs', srcDir); // 写死 <srcDir>/content/docs
  ```
- 同文件 build 分支（生产构建走这条）：
  ```ts
  const api = makeAPI(getAllNewestCommitDate(rootPath, docsPath)); // 只预扫 docsPath 的 git 历史
  ```
- 即：**生产构建时 Starlight 只对 `src/content/docs` 目录预取 git commit 时间**。
  - **软链方案**：`src/content/docs` 是软链 → git 对该路径记录的是"symlink 的提交历史"，不是被链接 `docs/` 里各文件的真实历史 → lastUpdated 会失真/取不到。
  - **自定义 loader 读 `../docs`**：文件根本不在 `src/content/docs` 下 → 预扫扫不到 → lastUpdated 失效。
- 运行时单页取值 `getLastUpdated`（`utils/routing/data.ts`）用的是 `getNewestCommitDate(entry.filePath)`（按每个 entry 的真实 filePath），这层**能**拿到外部文件的历史；但生产构建用的是上面那个"预扫 docsPath"的 inlined 版本，所以外部目录仍有问题。

结论：**要么不开 lastUpdated（现状），要么内容留在 `src/content/docs`（即软链或复制）并保证该路径 git 历史真实**。这与"外部目录 + 零同步"存在天然张力。

## 方案对比小结（供决策）

| 维度 | 复制式 sync（现状） | 软链 `content/docs -> ../../docs` | 自定义 loader 读 `../docs` |
|---|---|---|---|
| 零同步/单一源头 | ❌ 有拷贝步骤 | ✅ 无拷贝（但需 title 方案） | ✅ 真·单一源头 |
| 复用官方 `docsLoader()` | ✅ | ✅（路径不变） | ❌（自写 loader） |
| 解决无-title | 脚本注入 frontmatter | ❌ 仍需额外方案 | ✅ loader 内注入 |
| Starlight remark 增强 | ✅ | ✅ | ⚠️ 需 `processedDirs` 补 |
| lastUpdated 可用性 | ✅ | ⚠️ symlink 历史失真 | ⚠️ 预扫扫不到 |
| Vercel 可靠性 | ✅ 稳 | ⚠️ 需实测跟随软链 | ✅ 纯文件读，稳 |
| Windows dev | ✅ | ⚠️ symlink 坑 | ✅ |

→ 若"零同步 + 一步解决 title"权重最高：**自定义 loader（`02-*.md` a 方案）最干净**，代价是自写 loader + 可能配 `processedDirs`。
→ 若"最大化复用官方 `docsLoader()`、最小改 Starlight"权重最高：**软链**，但必须再解决 title（且失去 lastUpdated、有 Windows 坑）。

## Caveats / Not Found

- Vercel "是否跟随仓库内 symlink" **无官方明确文档条款**，结论基于 git clone 通用行为 + 社区实践，**置信度中等，建议一次预览部署实测**。
- `core.symlinks` 在各 CI/开发者机器的实际值未逐一核实。
- lastUpdated 坑仅在**开启该功能**时触发，当前配置未开启。

## 官方文档链接

- Git symlink 存储（`120000` mode）: https://git-scm.com/docs/gitattributes（symlink 处理）/ https://github.com/git/git/blob/master/Documentation/technical/index-format.txt
- Git `core.symlinks`: https://git-scm.com/docs/git-config#Documentation/git-config.txt-coresymlinks
- Vercel Build Step / Git 集成: https://vercel.com/docs/deployments/git
- Vercel Monorepos（Root Directory）: https://vercel.com/docs/monorepos
- Starlight `lastUpdated`: https://starlight.astro.build/reference/configuration/#lastupdated

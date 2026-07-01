# Research: Vercel 从子目录 `site/` 构建 Astro + 迁移现有 Vercel 项目

- **Query**: 一个 git 仓库里 `site/` 是独立 Astro 项目，Vercel 如何配置从子目录构建（Root Directory）？是否影响原有 Fider 部署？把现连 `omada-beacon-docs` 仓库的 Vercel 项目迁到"主仓 + Root Directory=site/"需要哪些步骤？
- **Scope**: mixed（Vercel 文档 + 本地仓库实测）
- **Date**: 2026-07-01

## 关键前提（实测本地）

- **主仓** = `github.com/ChenyqThu/Omada-Beacon`（Fider fork）。根有 `Dockerfile`（Fider 是 **Docker/自托管** 部署），**主仓的 Fider 应用本身不在 Vercel 上**（仓库内无任何 `vercel.json`/`.vercel`/Vercel 相关配置，实测）。
- **docs 站** = 独立仓 `github.com/ChenyqThu/omada-beacon-docs`，当前连着 Vercel 项目 `omada-beacon-docs`（`.vercel/project.json`：`projectId=prj_f3XdN7JhEvIleEDWtKeXJGI3A3yq`, `orgId=team_HCr0AMJcAYsAaTQp8ssGBSSc`）。
- 方案 C：把 Astro 站搬进主仓 `site/` 子目录，让这个 Vercel 项目改从**主仓 + Root Directory=`site/`** 构建。

→ **对"原有 Fider 部署"的影响：基本无关**。Fider 走 Docker，不经 Vercel。Vercel 侧只有 docs 站这一个项目，迁移只动这一个项目的 Git 源与 Root Directory。**唯一需留意**：把 Vercel 项目连到主仓后，主仓的 push 会触发 Vercel 构建——需用 Root Directory + Ignored Build Step 保证"只有 `site/` 或 `docs/` 变化才构建"，避免主仓每次 Go/React 提交都白跑一次 docs 构建。

## Findings

### 1. Vercel "Root Directory" 从子目录构建

- Vercel 项目设置 **Settings → Build and Deployment → Root Directory**，填 `site`。之后：
  - Vercel 把 `site/` 当作项目根：在 `site/` 里跑 install/build（找 `site/package.json`、`site/astro.config.mjs`）。
  - Framework Preset 会检测到 Astro（`site/package.json` 有 `astro`）。Build Command 默认 `astro build`（或 `npm run build`），Output Directory 默认 `dist`（相对 `site/`，即 `site/dist`）。
- **"Include files outside of the root directory"** 选项：Root Directory 设了 `site` 后，Vercel 默认**仅**上传/使用 `site/` 内文件到构建环境。**方案 C 里 Starlight 要读 `../docs`（仓库根的 docs/，在 `site/` 之外）**，因此必须**勾选** "Include files outside of the Root Directory in the Build Step"（默认开启，但务必确认为开），否则 `../docs` 在构建环境不存在 → 构建失败。
  - 官方：Root Directory 文档明确有此开关；用 monorepo/需要访问上层文件时要开。
  - 软链方案同理：软链目标 `../../docs` 在 `site/` 之外，也必须开这个开关。

### 2. 只在 `site/` 或 `docs/` 变化时才构建（避免主仓无关提交触发 docs 构建）

- Vercel **Settings → Git → Ignored Build Step**：可填命令，退出码 0 = 跳过构建，非 0 = 构建。
- 常用：`git diff --quiet HEAD^ HEAD -- ./`（Vercel 提供的 `Automatically ignore builds` 也可，但对 monorepo 精确控制建议自定义）。针对本场景应检测 `site/` 与 `docs/` 两个目录：
  ```bash
  # Ignored Build Step 命令（示意）：仅当 site/ 或 docs/ 有改动才构建
  git diff --quiet HEAD^ HEAD -- site docs || exit 1 && exit 0
  ```
  （注意 Vercel 跑 Ignored Build Step 的 cwd 是 Root Directory=`site`，写相对/仓库路径时需用 `git -C` 或指向仓库根，具体命令 implement 时按 Vercel 当时行为核对。）
- 官方也提供内建 "Only build if there are changes in a folder" 的 monorepo 行为（Turborepo/`turbo-ignore` 或 skew-based），但对单 Astro 子目录，自定义 `git diff` 最直接。

### 3. `vercel.json` 放哪

- 若用 Root Directory=`site`，`vercel.json` 一般放 **`site/vercel.json`**（Vercel 在 Root Directory 下找）。多数情况本方案不需要 `vercel.json`（Astro preset 足够）。若要显式声明 buildCommand/outputDirectory 再加。

### 4. 迁移现有 Vercel 项目（保留域名 `beacon.omada.ink`，避免重建）

**目标**：把现有项目 `omada-beacon-docs`（当前连 docs 独立仓）改为连主仓 `ChenyqThu/Omada-Beacon` + Root Directory=`site`，**域名与项目配置尽量原地保留**。

推荐步骤（在 Vercel Dashboard 操作；无停机、可回滚）：

1. **先把 site 工程搬进主仓 `site/` 并 push**（含 `astro.config.mjs`、`package.json`、`src/`、以及读 `../docs` 的 loader/config），确认主仓 `site/` 能本地 `npm --prefix site run build` 通过。
2. **Vercel 项目 → Settings → Git**：
   - Disconnect 当前的 `omada-beacon-docs` Git 仓库，Connect 到 `ChenyqThu/Omada-Beacon`。
   - （Vercel 支持在同一 Git 集成/组织下切换项目连接的仓库；若 UI 不允许直接切换，则需 Disconnect 再 Connect。）
3. **Settings → Build and Deployment → Root Directory** = `site`；确认 "Include files outside of the Root Directory" **开启**。
4. **Framework Preset** 确认为 Astro；Build Command / Output Directory 用默认（`astro build` / `dist`）。
5. **Settings → Git → Ignored Build Step** 填上 §2 的命令（可选但推荐）。
6. **Settings → Environment Variables**：docs 站当前无自定义 env（`.gitignore` 提到 `.env` 但仓库无实际 env 依赖），一般无需迁移。若有则同步。
7. **Deploy 一次**（可先在一个分支/预览验证），确认：
   - 构建能读到 `../docs`（外部文件开关生效）；
   - 页面 title、sidebar、相对链接正常（依赖 title 方案，见 `02-*.md`）。
8. **Domains**：项目仍是同一个 Vercel 项目 → 绑定的 `beacon.omada.ink` **保持不变，无需改 DNS**。这是"迁移现有项目"而非"新建项目"的最大好处。
9. **收尾**：删除主仓/新流程里过时的 `scripts/sync-docs.sh`（在 docs 独立仓里），归档或存档旧独立仓 `omada-beacon-docs`。

**替代方案（不原地迁移，而是新建）**：直接在 Vercel **New Project → Import `ChenyqThu/Omada-Beacon` → Root Directory=`site`**，新建一个项目，再把 `beacon.omada.ink` 域名从旧项目移到新项目。缺点：域名要在两个项目间搬（有短暂切换），且旧项目要删。**不如原地改 Git 源省事**，除非 Vercel 不允许切换已连仓库。

### 5. 对主仓其它部署的影响

- Fider 应用：Docker 部署，与 Vercel 无交集，**不受影响**。
- 主仓 CI（`make lint`/`make test` 等）：与 Vercel 无关。
- 唯一交叉点：Vercel 项目连到主仓后，主仓每次 push 都会被 Vercel 收到 webhook；靠 Root Directory + Ignored Build Step 把"非 site/docs 改动"过滤掉即可，避免浪费构建额度。

## Caveats / Not Found

- Vercel Dashboard 具体 UI 文案/位置随版本变动；上述路径名（Settings → Build and Deployment / Git）为当前普遍形态，**以操作时实际 UI 为准**。
- "是否允许原地切换已连接的 Git 仓库"个别情况下 Vercel 需 Disconnect+Connect；若受限，走 §4 替代方案（新建 + 迁域名）。
- Ignored Build Step 命令在 Root Directory=`site` 下的 cwd 与可见文件范围，需 implement 时按 Vercel 当时行为核对（可能需 `cd ..` 或 `git -C`）。
- 本次未实机在 Vercel 上验证"外部文件开关 + `../docs`"组合，**建议一次预览部署验证**。

## 官方文档链接

- Vercel Root Directory: https://vercel.com/docs/deployments/configure-a-build#root-directory
- Vercel Monorepos: https://vercel.com/docs/monorepos
- Vercel "Include files outside root" / build step: https://vercel.com/docs/deployments/configure-a-build
- Vercel Ignored Build Step: https://vercel.com/docs/project-configuration/git-settings#ignored-build-step
- Vercel Git 集成（连接/切换仓库）: https://vercel.com/docs/deployments/git
- Vercel 部署 Astro: https://vercel.com/docs/frameworks/astro / https://docs.astro.build/en/guides/deploy/vercel/
- Vercel 自定义域名（迁移域名到另一项目）: https://vercel.com/docs/projects/domains

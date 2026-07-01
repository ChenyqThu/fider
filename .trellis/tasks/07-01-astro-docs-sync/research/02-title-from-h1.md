# Research: 源 md 无 frontmatter，如何让 Starlight 拿到每页 title（不改源 md）

- **Query**: 源 md 首行是 `# H1`、无 YAML frontmatter。Starlight docs schema 要求 `title`（`z.string()` 必填）。在**不改源 md** 前提下，如何自动从 H1 拿到 title？评估 (a) 自定义 loader、(b) remark 注入 frontmatter、(c) docsLoader 选项。
- **Scope**: mixed（0.41.1 / astro 7.0.3 源码实测 + 官方文档）
- **Date**: 2026-07-01

## 结论（TL;DR）

| 路径 | 能否让 Starlight schema 拿到 title | 0.41 可行性 |
|---|---|---|
| **(a) 自定义 Astro loader**：读文件→抽 H1→`store.set({ data: { title } })` | ✅ **能**（loader 直接控制写入 collection 的 `data`，schema 在 `data` 上校验） | ✅ **唯一推荐**，0.41/astro7 可跑 |
| **(b) remark 插件把 title 写进 `astro.frontmatter`** | ❌ **不能满足 schema**（remark 在 render 阶段跑，晚于 schema 校验；它改的是渲染产物的 frontmatter，不是 collection 的 `data`） | ❌ 对"必填 title 的 schema 校验"无效 |
| **(c) `docsLoader()` 的某个选项** | ❌ 没有这种选项 | ❌ `docsLoader()` 只有 `generateId`，见 `01-*.md` |

**根因（为什么 b 不行）**：Astro content layer 的顺序是
`loader 读文件 → getEntryInfo()（只解析 YAML frontmatter）→ parseData()（用 schema 校验 data）→ 之后才 render（remark/rehype 在这里跑）`。
schema 校验发生在 remark **之前**，且校验对象是 `data`（来自 YAML frontmatter），不是 remark 产物。源 md 无 frontmatter ⇒ `data = {}` ⇒ 必填 `title` 校验直接失败，remark 再怎么注入都来不及。

## 证据（源码实测）

### schema 里 title 是必填

`node_modules/@astrojs/starlight/schema.ts`:
```ts
const StarlightFrontmatterSchema = (context) => z.object({
	/** The title of the current page. Required. */
	title: z.string(),   // <-- 必填，非 optional
	// ...
})
```

### Astro glob loader 的处理顺序（关键：先校验 data，后 render）

`node_modules/astro/dist/content/loaders/glob.js`（实测）:
```js
const { body, data } = await entryType.getEntryInfo({ contents, fileUrl });
//                     ^ 对 .md 而言，data = 仅解析 YAML frontmatter 的结果
const parsedData = await parseData({ id, data, filePath });  // <-- schema 在这里校验 data
// ... 之后才走 entryType.getRenderFunction → render()（remark/rehype 在此）
```

`getEntryInfo` 内部只 parse frontmatter：
`node_modules/astro/dist/content/utils.js:328` → `return parseFrontmatter(source, …)`（`import { parseFrontmatter } from "@astrojs/internal-helpers/frontmatter"`）——**不会**从 H1 生成 title。

### Starlight 读 title 用的是 `entry.data`（schema 后的数据）

`node_modules/@astrojs/starlight/utils/routing/data.ts` 全篇用 `entry.data.*`（如 `entry.data.template`、`entry.data.tableOfContents`）。title 同理走 `entry.data.title`。→ 必须让 title 进入 **collection 的 `data`**，(b) 的 `astro.frontmatter` 进不去这里。

### 自定义 loader 能直接写 `data`（这就是 a 可行的原因）

`node_modules/astro/dist/content/loaders/types.d.ts` — `LoaderContext` 暴露：
```ts
store.set<TData>(opts: DataEntry<TData>): boolean     // 直接写入 collection 数据
parseData(props: { id, data, filePath }): Promise<TData>  // 按 schema 校验
renderMarkdown(content: string, options?): Promise<RenderedContent>  // 渲染 md → html
generateDigest(...): string
config: AstroConfig
```
`DataEntry`（`data-store.d.ts`）字段：`id / data / body / filePath / digest / rendered`。
`renderMarkdown` 返回 `RenderedContent = { html, metadata?: { headings, frontmatter, imagePaths } }`。

→ 自定义 loader 可以：读原文件 → 正则/解析出首个 `# H1` 当 title → `parseData({ data: { title, ...frontmatter } })` → `renderMarkdown(body)` → `store.set({ id, data, body, rendered })`。schema 校验通过，Starlight 正常渲染。

## (a) 最小可跑实现（Starlight 0.41 / Astro 7）

> 目标：读**主仓根的 `docs/`**（site 在 `site/` 子目录时即 `../docs`），H1 当 title，删正文首个 H1（与旧 sync 脚本行为一致），交给 Starlight 渲染。

`site/src/loaders/external-docs-loader.ts`（新建，示意——**未实机跑通，需 implement 阶段验证**）:
```ts
import type { Loader } from 'astro/loaders'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob' // Astro 自带依赖树里通常已有；或用 node:fs 递归

const H1_RE = /^\s*#\s+(.+?)\s*$/m

export function externalDocsLoader(opts: { base: string; pattern?: string }): Loader {
  return {
    name: 'external-docs-loader',
    async load({ config, store, parseData, renderMarkdown, generateDigest, logger }) {
      store.clear()
      const baseUrl = new URL(opts.base, config.root)          // 支持 '../docs'
      const baseDir = fileURLToPath(baseUrl)
      const files = await fg(opts.pattern ?? '**/[^_]*.{md,mdx}', { cwd: baseDir })

      for (const rel of files) {
        const abs = new URL(rel, baseUrl)
        const raw = await fs.readFile(abs, 'utf-8')

        // 已有 frontmatter 的文件跳过注入（本项目源 md 都没有，但稳妥起见）
        const hasFm = raw.startsWith('---')
        const m = raw.match(H1_RE)
        const title = m?.[1] ?? rel.replace(/\.mdx?$/, '')

        // 删除首个 H1（与旧 sync-docs.sh 一致），其余正文保留
        const body = hasFm ? raw : raw.replace(H1_RE, '').replace(/^\s+/, '')

        const id = rel.replace(/\.mdx?$/, '')                  // slug
        const data = await parseData({ id, data: { title }, filePath: fileURLToPath(abs) })
        const rendered = await renderMarkdown(body, { fileURL: abs })

        store.set({
          id,
          data,
          body,
          filePath: fileURLToPath(abs),
          digest: generateDigest(raw),
          rendered,
        })
      }
    },
  }
}
```

`site/src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content'
import { docsSchema } from '@astrojs/starlight/schema'
import { externalDocsLoader } from './loaders/external-docs-loader'

export const collections = {
  docs: defineCollection({
    loader: externalDocsLoader({ base: '../docs' }),
    schema: docsSchema(),
  }),
}
```

**注意事项 / 待验证点**：
1. `renderMarkdown()`（Astro 7 的 content-loader API）产出的 HTML **不会**自动经过 Starlight 的 remark（asides / 标题锚点）。如需 Starlight 增强，配 `markdown.processedDirs: ['../docs']`（见 `01-*.md`），或在 loader 里接 Starlight 的 markdown 处理器（复杂，不推荐）。对纯文档站，`renderMarkdown` 的标准 md 渲染通常已够用。
2. 相对链接：源 md 里有 `./04-database.md` 这类相对链接（实测 `docs/01-overview.md` 有）。Starlight 对 `docsLoader()` 页面会重写这类链接为路由；自定义 loader 下这层重写可能缺失，**需实测链接是否 404**。
3. `store.clear()` 确保 dev 热更时不残留旧 entry。dev 下若要 watch `../docs` 变化触发重载，需用 `context.watcher`（`LoaderContext.watcher`）额外 `watcher.add(baseDir)`——本次未展开。
4. slug 生成要和现有 `astro.config.mjs` sidebar 里的 `slug`（`01-overview`、`design/content-site-architecture` 等）对齐，否则 sidebar 链接对不上。

## (b) 为什么 remark 注入 frontmatter 不行（详述）

社区常见 "remark inject title from H1" 插件（如把首个 heading 写进 `file.data.astro.frontmatter.title`）：
- 它挂在 Astro 的 markdown render 管线上，**在 `parseData()`（schema 校验）之后**执行；
- 它写的是 `astro.frontmatter`（渲染产物 / `Astro.props.frontmatter`），**不是 content collection 的 `entry.data`**；
- Starlight 用 `entry.data.title` 做侧边栏、`<title>`、面包屑等——拿不到 remark 注入的值；
- 而且源 md 无 title 会在 render **之前**就因 schema 必填校验直接构建报错，remark 根本没机会跑。

→ (b) 只适合"已经有 title、想额外派生别的 frontmatter"的场景，**不适合"补出必填 title"**。

（若坚持 remark 路线，唯一能过 schema 的变体是：把 `title` 改成 `z.string().optional()` 覆盖 docsSchema，再让 remark 注入 `astro.frontmatter.title` 供 `<Content>` 用——但 Starlight 侧边栏/SEO 仍读 `entry.data.title`，会拿到 undefined，**得不偿失**，不推荐。)

## Caveats / Not Found

- 上述自定义 loader 代码为**基于 0.41.1 / astro 7.0.3 类型与源码推导的最小实现，未实机构建验证**。implement 阶段必须跑 `astro build` 验证：title 正确、正文 H1 已去重、相对链接不 404、sidebar slug 对齐。
- `fast-glob`(`fg`) 是否在 site 依赖树内需确认；不想加依赖可改用 `node:fs` 递归或 Astro 未导出的内部 glob（不建议用内部 API）。
- 是否需要 Starlight remark 增强（asides 等）取决于源 md 是否用了这些语法。实测源 md 用的是标准 md + `>` 引用块，**未用** `:::` asides，故 `renderMarkdown` 基本够用；标题锚点缺失可接受或用 `processedDirs` 补。

## 官方文档链接

- Astro Content Loader API（`glob`、自定义 loader、`store`、`parseData`、`renderMarkdown`）: https://docs.astro.build/en/reference/content-loader-reference/
- Astro Content Collections（schema / defineCollection）: https://docs.astro.build/en/guides/content-collections/
- Starlight `docsSchema()`（frontmatter schema，title 必填）: https://starlight.astro.build/reference/frontmatter/
- Starlight `markdown.processedDirs`: https://starlight.astro.build/reference/configuration/#processeddirs
- 相关讨论（外部内容 / 自定义 loader 常见做法）: https://github.com/withastro/starlight/discussions（搜 "external content" / "custom loader" / "title from heading"）

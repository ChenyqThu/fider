# Research: Starlight 0.41 reading docs from a directory OUTSIDE `src/content/docs`

- **Query**: 能否让 Starlight 0.41 / Astro 7 直接读主仓 `../docs`（`src/content/docs` 之外、甚至项目根之外）？`docsLoader()` 是否接受 `pattern` / `base`？底层是不是 Astro glob loader？
- **Scope**: mixed（本地已装源码 ground-truth + 官方文档）
- **Date**: 2026-07-01
- **Versions verified**: `@astrojs/starlight` **0.41.1**, `astro` **7.0.3**（`node_modules` 实测）

## 结论（TL;DR）

| 方案 | Starlight 0.41 是否支持 | 结论 |
|---|---|---|
| `docsLoader({ base: '../docs' })` / `docsLoader({ pattern })` | ❌ **不支持** | `docsLoader()` 在 0.41 **只接受 `{ generateId }`**，没有 `base` / `pattern` 参数；`base` 被写死为 `<srcDir>/content/docs`。 |
| 用 Astro 原生 `glob({ pattern, base: '../docs' })` 替换 `docsLoader()` 作为 `docs` collection 的 loader | ✅ **技术可行**（Astro 层支持），但有代价 | `glob()` 的 `base` 明确支持相对根目录的路径（含 `../`）或绝对 file URL。但换掉 `docsLoader()` 会**丢掉 Starlight 的 remark/rehype 处理**（asides、标题锚点等），需要用 `markdown.processedDirs` 补回；且源 md 无 frontmatter 会导致 schema 校验失败（见 `02-title-from-h1.md`）。 |
| 自定义 loader（读 `../docs`，注入 title） | ✅ **推荐**（唯一能同时解决"外部目录 + 无 title"的路径） | 见 `02-title-from-h1.md`。 |

## Findings

### `docsLoader()` 的确切签名（0.41.1 实测源码）

文件：`node_modules/@astrojs/starlight/loaders.ts`

```ts
// @astrojs/starlight/loaders.ts (0.41.1) — 逐字摘录
import { glob, type Loader, type LoaderContext } from 'astro/loaders';
import { getCollectionPathFromRoot, type StarlightCollection } from './utils/collection';

const docsExtensions = ['markdown', 'mdown', 'mkdn', 'mkd', 'mdwn', 'md', 'mdx'];

export function docsLoader({
	generateId,
}: {
	generateId?: GenerateIdFunction;
} = {}): Loader {          // <-- 唯一参数是 generateId，没有 base / pattern
	return {
		name: 'starlight-docs-loader',
		load: createGlobLoadFn('docs', generateId),
	};
}

function createGlobLoadFn(collection, generateId) {
	return (context) => {
		const options = {
			base: getCollectionPathFromRoot(collection, context.config), // <-- 写死
			pattern: `**/[^_]*.{${extensions.join(',')}}`,
		};
		if (generateId) options.generateId = generateId;
		return glob(options).load(context);   // <-- 底层确实是 Astro 的 glob() loader
	};
}
```

关键点：
1. `docsLoader()` **底层就是 Astro 的 `glob()` loader**（`import { glob } from 'astro/loaders'`）。
2. `base` 由 `getCollectionPathFromRoot('docs', config)` 计算，**写死**为 `<srcDir 相对 root>/content/docs`（见下），调用方无法传参覆盖。
3. `docsLoader()` 目前**只暴露 `generateId` 一个选项**（该选项在 Starlight 0.34.0 / PR #3272 加入，CHANGELOG 有记录）；截至 0.41.1 **从未新增** `base` / `pattern` / 外部目录相关选项。

### `base` 写死的证据

文件：`node_modules/@astrojs/starlight/utils/collection.ts`

```ts
export function getCollectionPathFromRoot(collection, { root, srcDir }) {
	return (
		(srcDir).replace(root, '') + 'content/' + collection   // => "src/content/docs"
	);
}
```

同文件顶部注释（0.41.1 逐字，**官方明确说明外部目录尚未支持**）：

> We still rely on the content collection folder structure to be **fixed for now** …
> When **user-defined content folder locations are supported**, these helper functions should be updated…

→ 官方在源码里承认："自定义 content 目录位置" 是**尚未实现**的功能。所以 `docsLoader()` 走外部目录这条路，在 0.41 上**没有官方支持**。

### Astro 7 原生 `glob()` 支持 `../` 外部目录（这是绕过 docsLoader 的关键）

文件：`node_modules/astro/dist/content/loaders/glob.d.ts`（Astro 7.0.3）

```ts
interface GlobOptions {
    /** The glob pattern to match files, relative to the base directory */
    pattern: string | Array<string>;
    /**
     * The base directory to resolve the glob pattern from.
     * Relative to the root directory, or an absolute file URL. Defaults to `.`
     */
    base?: string | URL;
    generateId?: (options: GenerateIdOptions) => string;
    retainBody?: boolean;
}
export declare function glob(globOptions: GlobOptions): Loader;
```

运行时解析（`node_modules/astro/dist/content/loaders/glob.js`，实测第 165 行）：

```js
baseDir = globOptions.base ? new URL(globOptions.base, config.root) : config.root;
```

→ `base` 用 `new URL(base, config.root)` 解析，**`'../docs'` 会被解析到项目根的上一级**，完全可以指向主仓 `docs/`。这是文档化行为（Astro content collections / glob loader 文档：`base` "Relative to the root directory, or an absolute file URL"）。

因此，**如果**要让 `docs` collection 读 `../docs`，写法是**直接用 `glob()` 代替 `docsLoader()`**：

```ts
// src/content.config.ts  —— 注意：这样会丢 Starlight 的 remark 处理，见下方"代价"
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: '../docs' }),
    schema: docsSchema(),
  }),
}
```

> ⚠️ 但方案 C 的目标是把 site 放进 `site/` 子目录，主仓 docs 在 `site/../docs`（即仓库根的 `docs/`）。此时 `config.root` = `<repo>/site/`，`base: '../docs'` 正好解析到 `<repo>/docs/`。**路径成立**。

### 换掉 `docsLoader()` 的代价（务必权衡）

Starlight 0.34.0 起有一条 **breaking change**（CHANGELOG 逐字）：

> This change **restricts the application of Starlight's remark and rehype plugins to only Markdown and MDX content loaded using Starlight's `docsLoader()`**.

含义：一旦把 `docs` collection 的 loader 从 `docsLoader()` 换成裸 `glob()`，**Starlight 的 remark/rehype 管线不再自动作用于这些页面**——会丢：
- asides 语法（`:::note` 等）
- 标题锚点链接（heading anchors）
- 其它 Starlight markdown 增强

**补救**：Starlight 0.37 起（PR #3332，0.41 中存在）提供 `markdown.processedDirs` 选项，可把额外目录纳入 Starlight markdown 管线：

```ts
// astro.config.mjs
starlight({
  // ...
  markdown: {
    processedDirs: ['../docs'],  // z.string().array()，实测 user-config.ts:257
  },
})
```

（`processedDirs` 的 schema 在 `node_modules/@astrojs/starlight/utils/user-config.ts:257` = `z.string().array().default([])`，确认存在于 0.41。官方文档：starlight.astro.build `reference/configuration/#processeddirs`。是否接受 `../` 外部目录官方文档未明确举例，**需实测**。）

### Starlight 加载 `docs` collection 的方式（说明"换 loader 不破坏 Starlight 路由"）

- `node_modules/@astrojs/starlight/utils/routing/index.ts:38` → `getCollection('docs', …)`：Starlight 只按 collection **名字** `docs` 取数据，**不关心用什么 loader**。所以只要 collection 叫 `docs` 且 schema 用 `docsSchema()`，换 loader 不影响 Starlight 取页面。
- 渲染路径 `node_modules/@astrojs/starlight/routes/common.astro:16` → `await render(route.entry)`：用 Astro 标准 `render()`，对 glob loader 产出的 `.md` entry（`deferredRender: true`）同样工作。

## Caveats / Not Found

- **官方"支持"结论**：Starlight 0.41 **没有官方的"读外部 docs 目录"能力**（源码注释自认未实现）。走 `glob()`/自定义 loader 是"用 Astro 的通用能力绕过 Starlight 约定"，能跑，但脱离 Starlight 的 happy path，升级 Starlight 时需回归验证。
- `markdown.processedDirs` 对 `../`（项目根之外）目录是否生效，官方文档无明确示例，**建议起一个最小实例实测**（本次未跑构建验证）。
- `git lastUpdated` 功能对外部目录有坑，详见 `03-git-lastupdated-and-symlink.md`（本项目当前未开启 lastUpdated，非阻塞）。

## 官方文档链接

- Astro Content Collections（glob loader / `base`）: https://docs.astro.build/en/guides/content-collections/
- Astro Content Loader API（`glob`, 自定义 loader, `renderMarkdown`）: https://docs.astro.build/en/reference/content-loader-reference/
- Astro `astro/loaders` glob 参考: https://docs.astro.build/en/reference/content-loader-reference/#glob-loader
- Starlight `docsLoader()` 配置: https://starlight.astro.build/reference/configuration/#docsloader
- Starlight `markdown.processedDirs`: https://starlight.astro.build/reference/configuration/#processeddirs
- Starlight CHANGELOG（0.34 remark 限制 / 0.41 Astro7）: https://github.com/withastro/starlight/blob/main/packages/starlight/CHANGELOG.md

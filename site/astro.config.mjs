// @ts-check
import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

export default defineConfig({
  site: "https://beacon.omada.ink",
  integrations: [
    starlight({
      title: "Omada Beacon",
      description: "Omada 产品反馈平台 · 项目文档与设计提案",
      defaultLocale: "root",
      locales: {
        root: { label: "简体中文", lang: "zh-CN" },
      },
      // 内容由 scripts/gen-content.mjs 在 build/dev 前从主仓 ../docs 生成到 src/content/docs/。
      // sidebar 结构说明：
      //  - Starlight 0.41 的 autogenerate 不支持根目录（directory: ""）—— 对"顶层文件"
      //    不生成任何链接（实测 sidebar 分组为空）。故顶层 01–08 采用手动列表。
      //    ⚠️ 顶层新增文档（如 09-xxx.md）需在此手动登记一行。
      //  - design/ 用 autogenerate：新设计提案（*.md）自动进 sidebar，无需在此登记，
      //    按文件名字母序排列。这正是本次要修的痛点（poll-voting / rename 曾漏加）。
      sidebar: [
        {
          label: "项目文档",
          items: [
            { label: "01 · 项目总览", slug: "01-overview" },
            { label: "02 · 技术架构", slug: "02-architecture" },
            { label: "03 · 路线图", slug: "03-roadmap" },
            { label: "04 · 数据库方案", slug: "04-database" },
            { label: "05 · 可定制范围", slug: "05-customization" },
            { label: "06 · 部署方案", slug: "06-deployment" },
            { label: "07 · 本地开发", slug: "07-local-development" },
            { label: "08 · 原始方案存档", slug: "08-original-proposal" },
          ],
        },
        {
          // 新增设计提案无需在此登记，autogenerate 会自动收录 docs/design/*.md
          // 注：Starlight ≥0.39 起 autogenerate 不能自带 label，须包在带 items 的分组里。
          label: "设计提案",
          items: [{ autogenerate: { directory: "design" } }],
        },
      ],
    }),
  ],
})

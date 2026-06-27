// Passthrough shim for @lingui/macro.
//
// @lingui/macro is a COMPILE-TIME macro (normally transformed by Babel). esbuild
// can't transform it, and resolving the real package drags in
// @lingui/babel-plugin-lingui-macro -> @lingui/conf -> cosmiconfig/jiti -> Node
// built-ins (tty/fs/path/...), which can't bundle for the browser.
//
// The design-sync tsconfig redirects @lingui/macro here. These exports are only
// needed so transitively-imported files (e.g. PostDetails) BUNDLE; preview cards
// never execute this i18n path in earnest, so a passthrough is sufficient.
export const t = (x?: any, ...rest: any[]): any => {
  if (Array.isArray(x)) return x.join("") // tagged template: t`...`
  if (x && typeof x === "object") return x.message ?? x.id ?? ""
  return x ?? ""
}
export const msg = t
export const defineMessage = (x?: any): any => x
export const Trans = (props: any): any => props?.children ?? null
export const Plural = (props: any): any => props?.other ?? null
export const Select = (props: any): any => props?.other ?? null
export const SelectOrdinal = (props: any): any => props?.other ?? null
export const plural = (_n?: any, opts?: any): any => opts?.other ?? ""
export const select = (_v?: any, opts?: any): any => opts?.other ?? ""
export const selectOrdinal = (_n?: any, opts?: any): any => opts?.other ?? ""

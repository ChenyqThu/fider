# design-sync notes — omada-beacon (Fider fork)

Synced to claude.ai/design project **"Omada Beacon"** (`d88b9ca9-3a11-4fbd-92c6-d8cb8a21c37f`,
pinned in `config.json`). 25 components, 20 authored previews (all graded good),
5 floor cards (Avatar, AvatarStack, Icon, Loader, Markdown).

## Repo shape

- This is a **full-stack app (Go + React SSR), not a publishable component package**.
  No `dist/` library entry. We sync the real `public/components/` primitives via the
  **package shape in synth-entry mode**, using a hand-written barrel as `cfg.entry`
  (`./.design-sync/scope-entry.tsx`).
- Components are discovered explicitly via `cfg.componentSrcMap` (synth-entry can't
  infer them). Add every scoped component there with its `public/components/...` path.
- Prop interfaces are hand-written in `cfg.dtsPropsFor.<Name>` (synth-entry prop
  extraction is too weak — left to itself `ButtonProps` came out `{[k]:unknown}`).

## ⚠️ Re-sync risk #1 — staged `bundle.mjs` is a customized fork (UNDECLARED)

`.ds-sync/lib/bundle.mjs` carries **essential local edits** that are NOT declared as
a `.design-sync/overrides/bundle.mjs` + `cfg.libOverrides`. The standard re-sync step
"re-copy the staged scripts (`cp -r <skill>/lib .ds-sync/`)" **WILL overwrite and wipe
them**, and the build then breaks. The edits (all esbuild *input resolution*, not the
output IIFE/`@ds-bundle` contract):
1. `.scss`/`.sass`/`.less` → esbuild `'empty'` loader (Fider components `import "./X.scss"`
   as a side effect; styles come from `cfg.cssEntry`). Also `.gif`/`.jpg` → `dataurl`.
2. tsconfig-paths plugin requires `statSync(cand).isFile()` — without it `@fider/components`
   resolves to the *directory* `public/components` before `/index.tsx` and esbuild errors
   "is a directory".
3. jsx/jsxs/jsxDEV automatic-runtime shim that spreads static children so React doesn't
   warn "missing key" on every 2+-child element.

**Before any re-sync:** either (a) do NOT re-copy `lib/bundle.mjs` (keep the customized
one), or (b) formalize it properly — move the fork to `.design-sync/overrides/bundle.mjs`,
add `"libOverrides": {"bundle.mjs": "scss-empty loader + isFile path resolution + jsx key shim"}`
to config, repoint its relative imports at `../../.ds-sync/lib/`, and `ln -sfn ../.ds-sync/node_modules .design-sync/node_modules`.
(Skill guidance says "don't fork bundle.mjs" because it defines the output contract — these
edits only touch input resolution, so the override mechanism is the correct way to persist
them across script refreshes.)

## Styling / tokens

- `cfg.cssEntry = .design-sync/omada-styles.css` — a **committed, stable** stylesheet
  (the old risk of pointing at hash-named gitignored `dist/css/*.css` is resolved).
- **Tokens are on `:root`** (not `body[data-theme=light]`). Confirmed: `:root` defines
  `--colors-*` and `--primary-color` (#0A7171). So rendered designs (which get only the
  `styles.css` import closure, no theme attr) resolve `var(--colors-*)` correctly. Dark
  mode is `[data-theme="dark"]`.
- ⚠️ **Re-sync risk #2 — `omada-styles.css` is a PURGED subset.** It contains only the
  utility classes the 25 components actually use, so e.g. `grid-cols-2`/`grid-cols-3` are
  ABSENT (only `grid-cols-1`/`grid-cols-4` ship). `conventions.md` was aligned to this
  reality (its Grid row now lists only shipped classes + a fallback). If you ever want the
  full utility vocabulary available to the design agent, ship the unpurged utility CSS
  (`public/assets/styles/utility/*.scss` compiled) as/with `cfg.cssEntry` and re-validate
  conventions.md. If `omada-styles.css` is regenerated, the available class set may shift —
  re-run the conventions validation grep against `_ds_bundle.css`.

## i18n / lingui (the node-toolchain trap)

`@fider/services` / the `@fider/components` barrel transitively reach Lingui **macro**
entry points → node built-ins, unbundlable for the browser. Fixed by redirecting the
three macro specifiers to a passthrough shim via the design-sync tsconfig `paths`:
- `@lingui/macro`, `@lingui/core/macro`, `@lingui/react/macro` → `./shims/lingui-macro.ts`
- The runtime packages `@lingui/core` / `@lingui/react` are browser-safe — do NOT redirect.
- `Trans` renders `props.children`, so cards show the literal English default — fine.

## Provider

`.design-sync/preview-providers.tsx` → `cfg.provider = { component: "PreviewProvider" }`.
The scoped components don't need `useFider()` context, so the provider is minimal. If you
later scope in components that call `useFider()` (TagsSelect, SignInControl, Logo, DevBanner,
Legal), layer a mock `FiderContext.Provider` into PreviewProvider.

## Per-component preview notes

- **Moment** — the `relative` format runs `timeSince()` → `Intl.RelativeTimeFormat` against
  the LIVE clock. `timeSince` has a quirk: for a FUTURE date `seconds` is negative, so it
  falls into the `seconds < 60` branch and prints raw seconds ("in 66,175,200 seconds"). The
  build machine's real clock is ~2 years behind the configured "today", so a hardcoded future
  date triggers this. **Fix in `previews/Moment.tsx`: relative uses `new Date(Date.now() - 2d)`,
  not a fixed date** → renders "2 days ago". Absolute formats (full/date) keep a fixed date.
- **Dropdown** — interaction-gated: the menu only renders after a click (`useState`, no
  `defaultOpen` prop), so the static card shows the styled trigger only. Honest render; the
  menu API is documented via `.d.ts`/`.prompt.md`. Not a defect.

## Known render warns

- None outstanding. Render check exits clean (0 bad). 5 floor cards (Avatar, AvatarStack,
  Icon, Loader, Markdown) are unauthored-by-design, not failures — authorable on any re-sync.

## guidelines/

`cfg.guidelinesGlob` default (`docs/*.md`) pulled the repo's general project docs
(overview, architecture, roadmap, database, deployment, local-development, original-proposal,
OAUTH_ROLE_RESTRICTION) into `guidelines/`. They're committed repo docs (no secrets), but
they're project docs, not design guidance. Narrow `cfg.guidelinesGlob` to a design-specific
path if the DS pane's Guidelines section should be focused.

## Re-sync checklist (read before running)

1. **Do NOT blindly `cp -r` the skill lib over `.ds-sync/lib/bundle.mjs`** (risk #1).
2. Rebuild via the driver: `node .ds-sync/resync.mjs --config .design-sync/config.json
   --node-modules ./node_modules --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json`
   (fetch the project's `_ds_sync.json` to that path first). No `--entry` needed (synth-entry
   via `cfg.entry`). `react`/`react-dom` resolve at the repo-root `./node_modules`.
3. If `omada-styles.css` changed, re-validate conventions.md class/token names (risk #2).
4. Grades carry forward from the uploaded `_ds_sync.json`; only changed/added components regrade.

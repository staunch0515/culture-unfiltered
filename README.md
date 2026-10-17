# Culture, Unfiltered

A digital anthropology exhibition made by teenagers. Personal stories, not national ones.

Built with Astro (static), TypeScript strict and Astro content collections validated by zod.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies (then `npx playwright install chromium` once for tests) |
| `npm run dev` | Local dev server at http://localhost:4321 |
| `npm run build` | Type-check, validate all content against the schema, build to `dist/` |
| `npm test` | Build the real site and a fixture site, then run Playwright smoke + axe tests at 375px and 1440px |
| `npm run preview` | Serve `dist/` locally |
| `npm run cms:local` | Local Decap CMS backend: with `npm run dev` running, open http://localhost:4321/admin/ |

## Content is data

Every person, country, theme, story and resource is one file in `src/content/`:

| Folder | Format | One file per |
| --- | --- | --- |
| `countries/` | JSON | country (name, flag emoji, lat/lng for the map, order) |
| `people/` | Markdown frontmatter | participant (first name only) |
| `themes/` | Markdown frontmatter | theme (title, emoji, question, description, order) |
| `stories/` | Markdown | story (frontmatter + body text) |
| `resources/` | Markdown | classroom resource |

The file name is the id used in URLs and in references (`country: kenya`, `contributors: [amani]`).
The schema lives in `src/content.config.ts`. A missing field, a surname, or a reference to an
id that does not exist fails the build.

All relationships (a person's themes, a country's people, a theme's side-by-side comparison)
are derived in `src/lib/content.ts`. Nothing is listed twice and no list is hard-coded.

## Content editing (CMS)

`/admin` runs Decap CMS. Editors log in with their own GitHub accounts (repository
collaborators with Write access), so every change is a commit authored by the editor.
The small stateless service in `cms-auth/` completes GitHub's OAuth login (it holds the
OAuth client secret); it has no database.

- Editor guides: [EDITORS.md](EDITORS.md) (English) · [EDITORS.zh-CN.md](EDITORS.zh-CN.md) (中文)
- CMS fields: `src/pages/admin/config.yml.ts` (mirrors the schema; choice lists read content files)
- Site settings (placeholder notice on/off and its text): `src/data/settings.json`, edited under "Site settings" in the CMS, validated in `src/lib/settings.ts`
- Server setup and deployment: [DEPLOY.md](DEPLOY.md)

## Tests

`tests/fixtures/content/` adds a 7th participant from a new country, a draft participant,
a new theme and a new story. They are only included when `CU_FIXTURES=1` (the fixture build in
`dist-fixtures/`). The tests prove these appear on People, in the filters, on the map and on
theme pages without any code change, and that they never leak into the real build.

## Placeholder content

All current people, stories and images are placeholders. Avatars and artwork are generated
geometric SVGs (`npm run placeholder-art`). Turn off the preview banner in `src/lib/site.ts`
when real content arrives.

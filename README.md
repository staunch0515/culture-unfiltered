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

## Tests

`tests/fixtures/content/` adds a 7th participant from a new country, a draft participant,
a new theme and a new story. They are only included when `CU_FIXTURES=1` (the fixture build in
`dist-fixtures/`). The tests prove these appear on People, in the filters, on the map and on
theme pages without any code change, and that they never leak into the real build.

## Placeholder content

All current people, stories and images are placeholders. Avatars and artwork are generated
geometric SVGs (`npm run placeholder-art`). Turn off the preview banner in `src/lib/site.ts`
when real content arrives.

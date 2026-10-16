/**
 * The single place where content is loaded and every relationship is derived.
 * Pages never hard-code countries, people or themes: they ask this module.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Country = CollectionEntry<'countries'>;
export type Theme = CollectionEntry<'themes'>;
export type PersonEntry = CollectionEntry<'people'>;
export type StoryEntry = CollectionEntry<'stories'>;
export type ResourceEntry = CollectionEntry<'resources'>;

export interface Person {
  id: string;
  entry: PersonEntry;
  data: PersonEntry['data'];
  country: Country;
}

export interface Perspective {
  person: Person;
  text?: string | undefined;
  video?: { provider: 'youtube' | 'vimeo'; id: string } | undefined;
}

export interface Story {
  id: string;
  entry: StoryEntry;
  data: StoryEntry['data'];
  contributors: Person[];
  themes: Theme[];
  countries: Country[];
  perspectives: Perspective[];
}

export interface Resource {
  id: string;
  entry: ResourceEntry;
  data: ResourceEntry['data'];
  stories: Story[];
}

export interface Contribution {
  person: Person;
  story: Story;
  perspective?: Perspective | undefined;
}

export interface Site {
  countries: Country[];
  people: Person[];
  themes: Theme[];
  stories: Story[];
  resources: Resource[];
  /** Countries that have at least one published participant. */
  activeCountries: Country[];
  peopleIn(countryId: string): Person[];
  storiesBy(personId: string): Story[];
  themesOf(personId: string): Theme[];
  storiesAbout(themeId: string): Story[];
  /** Theme page comparison: one group per country, in country order. */
  contributionsByCountry(themeId: string): { country: Country; items: Contribution[] }[];
  resourcesFor(storyId: string): Resource[];
  /** Other stories ranked by shared themes, then shared contributors, then date. */
  relatedTo(storyId: string, limit?: number): Story[];
}

const byOrderThenName = <T extends { data: { order: number } }>(label: (x: T) => string) =>
  (a: T, b: T) => a.data.order - b.data.order || label(a).localeCompare(label(b));

function fail(message: string): never {
  throw new Error(`[content] ${message}`);
}

async function build(): Promise<Site> {
  const [countryEntries, peopleEntries, themeEntries, storyEntries, resourceEntries] = await Promise.all([
    getCollection('countries'),
    getCollection('people'),
    getCollection('themes'),
    getCollection('stories'),
    getCollection('resources'),
  ]);

  const countries = [...countryEntries].sort(byOrderThenName((c) => c.data.name));
  const countryById = new Map(countries.map((c) => [c.id, c]));
  const countryRank = new Map(countries.map((c, i) => [c.id, i]));

  const themes = [...themeEntries].sort(byOrderThenName((t) => t.data.title));
  const themeById = new Map(themes.map((t) => [t.id, t]));
  const themeRank = new Map(themes.map((t, i) => [t.id, i]));

  const people: Person[] = peopleEntries
    .filter((p) => p.data.published)
    .map((entry) => ({
      id: entry.id,
      entry,
      data: entry.data,
      country: countryById.get(entry.data.country.id) ?? fail(`${entry.id}: unknown country "${entry.data.country.id}"`),
    }))
    .sort(
      (a, b) =>
        (countryRank.get(a.country.id) ?? 0) - (countryRank.get(b.country.id) ?? 0) ||
        a.data.name.localeCompare(b.data.name),
    );
  const personById = new Map(people.map((p) => [p.id, p]));
  const allPeopleIds = new Set(peopleEntries.map((p) => p.id));

  const uniqueCountries = (list: Person[]) =>
    countries.filter((c) => list.some((p) => p.country.id === c.id));

  const stories: Story[] = storyEntries
    .filter((s) => s.data.published)
    .map((entry): Story | undefined => {
      for (const ref of entry.data.contributors) {
        if (!allPeopleIds.has(ref.id)) fail(`${entry.id}: unknown contributor "${ref.id}"`);
      }
      const contributorIds = new Set(entry.data.contributors.map((r) => r.id));
      // Unpublished participants are silently left out everywhere.
      const contributors = entry.data.contributors
        .map((r) => personById.get(r.id))
        .filter((p): p is Person => Boolean(p));
      if (contributors.length === 0) return undefined;
      const perspectives: Perspective[] = [];
      for (const p of entry.data.perspectives) {
        if (!contributorIds.has(p.participant.id)) {
          fail(`${entry.id}: perspective by "${p.participant.id}", who is not listed as a contributor`);
        }
        const person = personById.get(p.participant.id);
        if (person) perspectives.push({ person, text: p.text, video: p.video });
      }
      return {
        id: entry.id,
        entry,
        data: entry.data,
        contributors,
        themes: entry.data.themes
          .map((r) => themeById.get(r.id) ?? fail(`${entry.id}: unknown theme "${r.id}"`))
          .sort((a, b) => (themeRank.get(a.id) ?? 0) - (themeRank.get(b.id) ?? 0)),
        countries: uniqueCountries(contributors),
        perspectives,
      };
    })
    .filter((s): s is Story => Boolean(s))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.data.title.localeCompare(b.data.title));
  const storyById = new Map(stories.map((s) => [s.id, s]));

  const resources: Resource[] = resourceEntries
    .map((entry) => ({
      id: entry.id,
      entry,
      data: entry.data,
      stories: entry.data.relatedStories
        .map((r) => storyById.get(r.id))
        .filter((s): s is Story => Boolean(s)),
    }))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));

  const storiesBy = (personId: string) => stories.filter((s) => s.contributors.some((p) => p.id === personId));
  const storiesAbout = (themeId: string) => stories.filter((s) => s.themes.some((t) => t.id === themeId));

  return {
    countries,
    people,
    themes,
    stories,
    resources,
    activeCountries: uniqueCountries(people),
    peopleIn: (countryId) => people.filter((p) => p.country.id === countryId),
    storiesBy,
    themesOf: (personId) => {
      const ids = new Set(storiesBy(personId).flatMap((s) => s.themes.map((t) => t.id)));
      return themes.filter((t) => ids.has(t.id));
    },
    storiesAbout,
    contributionsByCountry: (themeId) => {
      const items: Contribution[] = storiesAbout(themeId).flatMap((story) =>
        story.contributors.map((person) => ({
          person,
          story,
          perspective: story.perspectives.find((p) => p.person.id === person.id),
        })),
      );
      return countries
        .map((country) => ({ country, items: items.filter((i) => i.person.country.id === country.id) }))
        .filter((g) => g.items.length > 0);
    },
    resourcesFor: (storyId) => resources.filter((r) => r.stories.some((s) => s.id === storyId)),
    relatedTo: (storyId, limit = 3) => {
      const base = storyById.get(storyId);
      if (!base) return [];
      const themeIds = new Set(base.themes.map((t) => t.id));
      const personIds = new Set(base.contributors.map((p) => p.id));
      return stories
        .filter((s) => s.id !== storyId)
        .map((s) => ({
          s,
          score:
            s.themes.filter((t) => themeIds.has(t.id)).length * 10 +
            s.contributors.filter((p) => personIds.has(p.id)).length,
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || b.s.data.date.getTime() - a.s.data.date.getTime())
        .slice(0, limit)
        .map((x) => x.s);
    },
  };
}

let cached: Promise<Site> | undefined;
export function loadSite(): Promise<Site> {
  return (cached ??= build());
}

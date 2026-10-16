import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import path from 'node:path';
import { mediaTypes, resourceKinds } from './lib/constants';

/**
 * Content roots. The real site reads only `src/content`. The test suite sets
 * CU_FIXTURES=1 to layer extra fixture files on top, proving that new people,
 * countries, themes and stories need nothing but new files.
 */
const roots = ['src/content', ...(process.env.CU_FIXTURES ? ['tests/fixtures/content'] : [])];

/** One file per entry; the file name (without extension) is the entry's id/slug. */
const files = (folder: string, ext: string) =>
  glob({
    base: '.',
    pattern: roots.map((root) => `${root}/${folder}/*.${ext}`),
    generateId: ({ entry }) => path.basename(entry).replace(/\.[^.]+$/, ''),
  });

const nonEmpty = z.string().trim().min(1);

const countries = defineCollection({
  loader: files('countries', 'json'),
  schema: z.object({
    name: nonEmpty,
    flag: nonEmpty.max(16).describe('Flag emoji, used in navigation only'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    order: z.number().int().default(100),
  }),
});

const people = defineCollection({
  loader: files('people', 'md'),
  schema: ({ image }) =>
    z.object({
      name: nonEmpty
        .max(40)
        .refine((v) => !/\s/.test(v), 'First name only, no surname (participants are minors)'),
      country: reference('countries'),
      location: nonEmpty.max(60).describe('Region or city at most, never a school or street'),
      photo: image(),
      photoAlt: nonEmpty,
      bio: nonEmpty,
      interests: z.array(nonEmpty).min(1),
      languages: z.array(nonEmpty).default([]),
      perspective: nonEmpty.describe('"My Perspective" paragraph'),
      reflection: z.string().trim().optional(),
      published: z.boolean().default(true),
    }),
});

const themes = defineCollection({
  loader: files('themes', 'md'),
  schema: z.object({
    title: nonEmpty,
    emoji: nonEmpty.max(16),
    question: nonEmpty,
    description: nonEmpty,
    order: z.number().int().default(100),
  }),
});

const stories = defineCollection({
  loader: files('stories', 'md'),
  schema: ({ image }) =>
    z.object({
      title: nonEmpty,
      description: nonEmpty,
      date: z.coerce.date(),
      contributors: z.array(reference('people')).min(1),
      themes: z.array(reference('themes')).min(1),
      mediaType: z.enum(mediaTypes),
      thumbnail: image(),
      thumbnailAlt: nonEmpty,
      video: z
        .object({
          provider: z.enum(['youtube', 'vimeo']),
          id: z.string().regex(/^[A-Za-z0-9_-]{4,32}$/, 'Video id only, not a full URL'),
          captions: z.boolean().default(false),
        })
        .optional(),
      audio: z
        .object({ src: nonEmpty, transcript: z.string().trim().optional() })
        .optional(),
      photos: z.array(z.object({ src: image(), alt: nonEmpty, caption: z.string().optional() })).default([]),
      perspectives: z
        .array(
          z
            .object({
              participant: reference('people'),
              text: z.string().trim().optional(),
              video: z
                .object({ provider: z.enum(['youtube', 'vimeo']), id: z.string().regex(/^[A-Za-z0-9_-]{4,32}$/) })
                .optional(),
            })
            .refine((p) => p.text || p.video, 'Each perspective needs text or a video'),
        )
        .default([]),
      reflection: z
        .object({ surprised: nonEmpty, assumed: nonEmpty, learned: nonEmpty })
        .optional(),
      published: z.boolean().default(true),
    }),
});

const resources = defineCollection({
  loader: files('resources', 'md'),
  schema: z.object({
    title: nonEmpty,
    description: nonEmpty,
    kind: z.enum(resourceKinds),
    ageGroup: nonEmpty,
    duration: nonEmpty,
    pdf: z.string().trim().optional(),
    relatedStories: z.array(reference('stories')).default([]),
  }),
});

export const collections = { countries, people, themes, stories, resources };

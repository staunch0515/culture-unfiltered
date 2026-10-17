/**
 * Site settings edited in the CMS ("Site settings" in /admin), stored in
 * src/data/settings.json. Validated at build time: a bad value fails the build.
 */
import { z } from 'astro/zod';
import raw from '../data/settings.json';

const schema = z.object({
  /** Shows a notice at the top of every page while the site still runs on placeholder content. */
  showSampleNotice: z.boolean().default(true),
  sampleNoticeText: z
    .string()
    .trim()
    .max(140, 'Keep the notice under 140 characters')
    .default('Preview: all people and stories are placeholders')
    .transform((t) => t || 'Preview: all people and stories are placeholders'),
});

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  throw new Error(`[settings] src/data/settings.json is invalid: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
}

export const settings = parsed.data;

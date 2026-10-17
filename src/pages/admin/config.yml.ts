/**
 * Decap CMS configuration, generated at build time (JSON is valid YAML).
 * Fields mirror the zod schemas in src/content.config.ts (and src/lib/settings.ts); choice lists for
 * countries, people, themes and stories are relation widgets that read the
 * content files, so nothing here lists actual content.
 */
import type { APIRoute } from 'astro';
import { site } from '@/lib/site';
import { mediaTypes, mediaLabels, resourceKinds, resourceKindLabels } from '@/lib/constants';

const req = { required: true };
const opt = { required: false };
const VIDEO_ID = ['^[A-Za-z0-9_-]{4,32}$', 'Only the video id, e.g. aqz-KE-bpKQ, not the full link'];

const relation = (collection: string, label: string, name: string, multiple = false, extra = {}) => ({
  label, name, widget: 'relation', collection, value_field: '{{slug}}',
  search_fields: [collection === 'stories' || collection === 'themes' ? 'title' : 'name'],
  display_fields: [collection === 'stories' || collection === 'themes' ? 'title' : 'name'],
  multiple, ...extra,
});
const videoFields = (withCaptions: boolean) => [
  { label: 'Provider', name: 'provider', widget: 'select', options: [{ label: 'YouTube', value: 'youtube' }, { label: 'Vimeo', value: 'vimeo' }], ...opt },
  { label: 'Video id', name: 'id', widget: 'string', pattern: VIDEO_ID, ...opt },
  ...(withCaptions ? [{ label: 'Has captions', name: 'captions', widget: 'boolean', default: false, ...opt }] : []),
];

export const GET: APIRoute = ({ site: siteUrl }) => {
  const origin = new URL(siteUrl ?? 'http://localhost:4321').origin;
  const by = '(via CMS by {{author-login}})';
  const config = {
    backend: {
      name: 'github',
      repo: site.cms.repo,
      branch: site.cms.branch,
      base_url: origin,
      auth_endpoint: 'cms-auth/auth',
      auth_scope: 'public_repo',
      commit_messages: {
        create: `Create {{collection}} “{{slug}}” ${by}`,
        update: `Update {{collection}} “{{slug}}” ${by}`,
        delete: `Delete {{collection}} “{{slug}}” ${by}`,
        uploadMedia: `Upload “{{path}}” ${by}`,
        deleteMedia: `Delete “{{path}}” ${by}`,
      },
    },
    // `npx decap-server` lets editors try the CMS locally without logging in.
    local_backend: true,
    site_url: origin,
    display_url: origin,
    logo_url: "/favicon.svg",
    locale: 'en',
    media_folder: 'public/media/uploads',
    public_folder: '/media/uploads',
    slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },
    collections: [
      {
        name: 'stories', label: 'Stories', label_singular: 'Story', folder: 'src/content/stories',
        create: true, extension: 'md', format: 'frontmatter', slug: '{{slug}}', identifier_field: 'title',
        summary: '{{title}} · {{mediaType}} · {{date}}', sortable_fields: ['date', 'title'],
        media_folder: '/src/assets/stories', public_folder: '../../assets/stories',
        editor: { preview: false },
        fields: [
          { label: 'Title', name: 'title', widget: 'string', ...req },
          { label: 'Short description', name: 'description', widget: 'text', hint: 'One or two sentences, shown on cards.', ...req },
          { label: 'Date', name: 'date', widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, ...req },
          relation('people', 'Made by', 'contributors', true, { min: 1, ...req }),
          relation('themes', 'Themes', 'themes', true, { min: 1, ...req }),
          { label: 'Format', name: 'mediaType', widget: 'select', options: mediaTypes.map((m) => ({ label: mediaLabels[m], value: m })), ...req },
          { label: 'Cover image', name: 'thumbnail', widget: 'image', hint: 'Landscape works best. No faces of minors without consent.', ...req },
          { label: 'Cover image description (alt text)', name: 'thumbnailAlt', widget: 'string', hint: 'Describe the image for people who cannot see it.', ...req },
          { label: 'Video', name: 'video', widget: 'object', collapsed: true, hint: 'Only for video stories. Leave empty otherwise.', ...opt, fields: videoFields(true) },
          {
            label: 'Audio', name: 'audio', widget: 'object', collapsed: true, hint: 'Only for audio stories.', ...opt,
            fields: [
              { label: 'Audio file', name: 'src', widget: 'file', media_folder: '/public/media/audio', public_folder: '/media/audio', ...opt },
              { label: 'Transcript', name: 'transcript', widget: 'text', ...opt },
            ],
          },
          {
            label: 'Photos', name: 'photos', widget: 'list', ...opt, summary: '{{fields.alt}}',
            fields: [
              { label: 'Photo', name: 'src', widget: 'image', ...req },
              { label: 'Description (alt text)', name: 'alt', widget: 'string', ...req },
              { label: 'Caption', name: 'caption', widget: 'string', ...opt },
            ],
          },
          {
            label: 'Perspectives', name: 'perspectives', widget: 'list', ...opt, summary: '{{fields.participant}}',
            hint: 'One per participant. Each needs text or a video.',
            fields: [
              relation('people', 'Participant', 'participant', false, req),
              { label: 'Text', name: 'text', widget: 'text', ...opt },
              { label: 'Video', name: 'video', widget: 'object', collapsed: true, ...opt, fields: videoFields(false) },
            ],
          },
          {
            label: 'Reflection', name: 'reflection', widget: 'object', ...opt,
            fields: [
              { label: 'What surprised us?', name: 'surprised', widget: 'text', ...opt },
              { label: 'What did we assume?', name: 'assumed', widget: 'text', ...opt },
              { label: 'What did we learn?', name: 'learned', widget: 'text', ...opt },
            ],
          },
          { label: 'Published', name: 'published', widget: 'boolean', default: true, ...opt },
          { label: 'Story text', name: 'body', widget: 'markdown', ...opt },
        ],
      },
      {
        name: 'people', label: 'People', label_singular: 'Person', folder: 'src/content/people',
        create: true, extension: 'md', format: 'frontmatter', slug: '{{slug}}', identifier_field: 'name',
        summary: '{{name}} · {{country}}',
        media_folder: '/src/assets/people', public_folder: '../../assets/people',
        editor: { preview: false },
        fields: [
          { label: 'First name', name: 'name', widget: 'string', pattern: ['^\\S+$', 'First name only. Never a surname.'], hint: 'Participants are minors: first name only.', ...req },
          relation('countries', 'Country', 'country', false, req),
          { label: 'Region or city', name: 'location', widget: 'string', hint: 'Region or city at most. Never a school, street or neighbourhood.', ...req },
          { label: 'Portrait', name: 'photo', widget: 'image', hint: 'An illustration or a photo the participant and guardian agreed to.', ...req },
          { label: 'Portrait description (alt text)', name: 'photoAlt', widget: 'string', ...req },
          { label: 'Short bio', name: 'bio', widget: 'text', ...req },
          { label: 'Interests', name: 'interests', widget: 'list', min: 1, ...req },
          { label: 'Languages', name: 'languages', widget: 'list', ...opt },
          { label: 'My Perspective', name: 'perspective', widget: 'text', ...req },
          { label: 'Reflection', name: 'reflection', widget: 'text', ...opt },
          { label: 'Published', name: 'published', widget: 'boolean', default: true, hint: 'Turn off to hide this person everywhere on the site.', ...opt },
        ],
      },
      {
        name: 'themes', label: 'Themes', label_singular: 'Theme', folder: 'src/content/themes',
        create: true, extension: 'md', format: 'frontmatter', slug: '{{slug}}', identifier_field: 'title',
        summary: '{{emoji}} {{title}}', sortable_fields: ['order', 'title'], editor: { preview: false },
        fields: [
          { label: 'Title', name: 'title', widget: 'string', ...req },
          { label: 'Emoji', name: 'emoji', widget: 'string', ...req },
          { label: 'Question', name: 'question', widget: 'string', hint: 'e.g. What makes somewhere feel like home?', ...req },
          { label: 'Description', name: 'description', widget: 'text', ...req },
          { label: 'Order', name: 'order', widget: 'number', value_type: 'int', default: 100, ...opt },
        ],
      },
      {
        name: 'resources', label: 'Resources', label_singular: 'Resource', folder: 'src/content/resources',
        create: true, extension: 'md', format: 'frontmatter', slug: '{{slug}}', identifier_field: 'title',
        summary: '{{title}} · {{kind}}', editor: { preview: false },
        fields: [
          { label: 'Title', name: 'title', widget: 'string', ...req },
          { label: 'Short description', name: 'description', widget: 'text', ...req },
          { label: 'Type', name: 'kind', widget: 'select', options: resourceKinds.map((k) => ({ label: resourceKindLabels[k], value: k })), ...req },
          { label: 'Age group', name: 'ageGroup', widget: 'string', hint: 'e.g. 11–16', ...req },
          { label: 'Duration', name: 'duration', widget: 'string', hint: 'e.g. 45 minutes', ...req },
          { label: 'PDF', name: 'pdf', widget: 'file', media_folder: '/public/media/resources', public_folder: '/media/resources', ...opt },
          relation('stories', 'Related stories', 'relatedStories', true, opt),
          { label: 'Instructions', name: 'body', widget: 'markdown', ...opt },
        ],
      },
      {
        name: 'countries', label: 'Countries', label_singular: 'Country', folder: 'src/content/countries',
        create: true, extension: 'json', format: 'json', slug: '{{slug}}', identifier_field: 'name',
        summary: '{{flag}} {{name}}', sortable_fields: ['order', 'name'], editor: { preview: false },
        fields: [
          { label: 'Name', name: 'name', widget: 'string', ...req },
          { label: 'Flag emoji', name: 'flag', widget: 'string', hint: 'Shown only in filters and on the map.', ...req },
          { label: 'Latitude', name: 'lat', widget: 'number', value_type: 'float', min: -90, max: 90, hint: 'Map marker position in decimal degrees, e.g. 51.5', ...req },
          { label: 'Longitude', name: 'lng', widget: 'number', value_type: 'float', min: -180, max: 180, ...req },
          { label: 'ISO number', name: 'iso', widget: 'string', pattern: ['^\\d{3}$', 'Three digits, e.g. 404'], hint: 'Optional. Highlights the country outline on the map (ISO 3166-1 numeric).', ...opt },
          { label: 'Order', name: 'order', widget: 'number', value_type: 'int', default: 100, ...opt },
        ],
      },
      {
        name: 'settings', label: 'Site settings', editor: { preview: false },
        files: [
          {
            name: 'site', label: 'Site settings', file: 'src/data/settings.json', format: 'json',
            fields: [
              {
                label: 'Show the placeholder notice', name: 'showSampleNotice', widget: 'boolean', default: true,
                hint: 'The thin notice at the top of every page. Turn it off once real people and stories have replaced the sample content.',
                ...opt,
              },
              {
                label: 'Notice text', name: 'sampleNoticeText', widget: 'string', default: 'Preview: all people and stories are placeholders',
                hint: 'Up to 140 characters.', pattern: ['^.{0,140}$', 'Keep it under 140 characters'], ...opt,
              },
            ],
          },
        ],
      },
    ],
  };
  return new Response(JSON.stringify(config, null, 2), { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
};

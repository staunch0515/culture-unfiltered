/** Fixed vocabularies. These describe formats, not people or places, so they live in code. */
export const mediaTypes = ['video', 'article', 'photo', 'interview', 'audio'] as const;
export type MediaType = (typeof mediaTypes)[number];

export const mediaLabels: Record<MediaType, string> = {
  video: 'Video',
  article: 'Article',
  photo: 'Photo essay',
  interview: 'Interview',
  audio: 'Audio',
};

export const resourceKinds = ['classroom', 'discussion', 'reflection', 'language'] as const;
export type ResourceKind = (typeof resourceKinds)[number];

export const resourceKindLabels: Record<ResourceKind, string> = {
  classroom: 'Classroom activity',
  discussion: 'Discussion guide',
  reflection: 'Reflection prompt',
  language: 'Language exchange',
};

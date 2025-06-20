import { z } from 'zod';
import { 
  VideoId, 
  ChannelId, 
  CategoryId,
  ISO8601Date, 
  NonEmptyString, 
  URL,
  VideoStatus,
  createBrandedString
} from './common';

// Schémas de base avec validation
const NonEmptyStringSchema = z.string().min(1).transform(val => createBrandedString<'NonEmptyString'>(val));
const URLSchema = z.string().url().transform(val => createBrandedString<'URL'>(val));
const ISO8601DateSchema = z.string().datetime().transform(val => createBrandedString<'ISO8601Date'>(val));
const VideoIdSchema = z.string().min(1).transform(val => createBrandedString<'VideoId'>(val));
const ChannelIdSchema = z.string().min(1).transform(val => createBrandedString<'ChannelId'>(val));
const CategoryIdSchema = z.string().min(1).transform(val => createBrandedString<'CategoryId'>(val));

// Schéma pour les miniatures YouTube
const ThumbnailSchema = z.object({
  url: URLSchema.optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const ThumbnailsSchema = z.object({
  default: ThumbnailSchema.optional(),
  medium: ThumbnailSchema.optional(),
  high: ThumbnailSchema.optional(),
  standard: ThumbnailSchema.optional(),
  maxres: ThumbnailSchema.optional(),
});

// Schéma pour Category
export const CategorySchema = z.object({
  id: CategoryIdSchema,
  name: NonEmptyStringSchema,
  description: z.string().default(''),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#6B7280'), // Couleur hex
  isDefault: z.boolean().default(false), // Pour les catégories par défaut
  createdAt: ISO8601DateSchema,
}).strict();

// Schéma pour Channel
export const ChannelSchema = z.object({
  id: ChannelIdSchema,
  title: NonEmptyStringSchema,
  description: z.string().default(''),
  thumbnail: z.string().url().optional().default(''),
  categoryId: CategoryIdSchema.optional(), // Référence à la catégorie
}).strict();

// Schéma pour Video
export const VideoSchema = z.object({
  id: VideoIdSchema,
  title: NonEmptyStringSchema,
  description: z.string().default(''),
  thumbnail: URLSchema.optional(),
  channelId: ChannelIdSchema,
  channelTitle: NonEmptyStringSchema,
  channelThumbnail: z.string().url().optional().default(''),
  publishedAt: ISO8601DateSchema,
  is_deleted: z.boolean().default(false), // 🆕 Suppression intelligente
}).strict();

// Schémas pour les réponses API YouTube
export const YouTubeChannelSnippetSchema = z.object({
  title: z.string(),
  description: z.string(),
  thumbnails: ThumbnailsSchema.optional(),
});

export const YouTubeChannelSchema = z.object({
  id: z.string(),
  snippet: YouTubeChannelSnippetSchema,
});

export const YouTubeSearchResultSchema = z.object({
  id: z.object({
    channelId: z.string(),
  }),
  snippet: YouTubeChannelSnippetSchema,
});

export const YouTubeVideoSnippetSchema = z.object({
  title: z.string(),
  description: z.string(),
  channelId: z.string(),
  channelTitle: z.string(),
  publishedAt: z.string().datetime(),
  thumbnails: ThumbnailsSchema.optional(),
  resourceId: z.object({
    videoId: z.string(),
  }).optional(),
});

export const YouTubeVideoSchema = z.object({
  id: z.string(),
  snippet: YouTubeVideoSnippetSchema,
});

export const YouTubePlaylistItemSchema = z.object({
  snippet: YouTubeVideoSnippetSchema.extend({
    resourceId: z.object({
      videoId: z.string(),
    }),
  }),
});

// Schémas pour les réponses API complètes
export const YouTubeSearchResponseSchema = z.object({
  items: z.array(YouTubeSearchResultSchema).default([]),
  nextPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number(),
    resultsPerPage: z.number(),
  }).optional(),
});

export const YouTubeChannelsResponseSchema = z.object({
  items: z.array(YouTubeChannelSchema).default([]),
});

export const YouTubePlaylistItemsResponseSchema = z.object({
  items: z.array(YouTubePlaylistItemSchema).default([]),
});

export const YouTubeVideosResponseSchema = z.object({
  items: z.array(YouTubeVideoSchema).default([]),
});

export const YouTubeChannelContentDetailsSchema = z.object({
  items: z.array(z.object({
    contentDetails: z.object({
      relatedPlaylists: z.object({
        uploads: z.string(),
      }),
    }),
  })).default([]),
});

export const YouTubeVideoContentDetailsSchema = z.object({
  items: z.array(z.object({
    contentDetails: z.object({
      duration: z.string(), // Format ISO 8601 duration (e.g., "PT4M13S")
    }),
  })).default([]),
});

// Types inférés des schémas
export type Channel = z.infer<typeof ChannelSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type YouTubeSearchResponse = z.infer<typeof YouTubeSearchResponseSchema>;
export type YouTubeChannelsResponse = z.infer<typeof YouTubeChannelsResponseSchema>;
export type YouTubePlaylistItemsResponse = z.infer<typeof YouTubePlaylistItemsResponseSchema>;
export type YouTubeVideosResponse = z.infer<typeof YouTubeVideosResponseSchema>;
export type YouTubeChannelContentDetailsResponse = z.infer<typeof YouTubeChannelContentDetailsSchema>;
export type YouTubeVideoContentDetailsResponse = z.infer<typeof YouTubeVideoContentDetailsSchema>;

// Helpers de validation
export const validateChannel = (data: unknown): Channel => {
  return ChannelSchema.parse(data);
};

export const validateVideo = (data: unknown): Video => {
  return VideoSchema.parse(data);
};

export const validateCategory = (data: unknown): Category => {
  return CategorySchema.parse(data);
};

export const validateYouTubeSearchResponse = (data: unknown): YouTubeSearchResponse => {
  return YouTubeSearchResponseSchema.parse(data);
};

export const validateYouTubeChannelsResponse = (data: unknown): YouTubeChannelsResponse => {
  return YouTubeChannelsResponseSchema.parse(data);
};

export const validateYouTubePlaylistItemsResponse = (data: unknown): YouTubePlaylistItemsResponse => {
  return YouTubePlaylistItemsResponseSchema.parse(data);
};

export const validateYouTubeVideosResponse = (data: unknown): YouTubeVideosResponse => {
  return YouTubeVideosResponseSchema.parse(data);
};

export const validateYouTubeChannelContentDetailsResponse = (data: unknown): YouTubeChannelContentDetailsResponse => {
  return YouTubeChannelContentDetailsSchema.parse(data);
};

export const validateYouTubeVideoContentDetailsResponse = (data: unknown): YouTubeVideoContentDetailsResponse => {
  return YouTubeVideoContentDetailsSchema.parse(data);
}; 
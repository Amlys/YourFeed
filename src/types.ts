// Re-export des types principaux depuis le nouveau système de validation
export type { Channel, Video } from './types/schemas';

// Re-export des types communs
export type { 
  VideoId,
  ChannelId, 
  UserId,
  ISO8601Date,
  NonEmptyString,
  URL,
  VideoStatus,
  LoadingState,
  AppError,
  Result,
  PaginatedResponse
} from './types/common';

// Re-export des helpers de validation depuis schemas
export { 
  validateChannel, 
  validateVideo
} from './types/schemas';

// Re-export des helpers depuis common
export {
  createSuccess,
  createError,
  isNonEmptyString,
  isValidUrl,
  isValidISO8601
} from './types/common';
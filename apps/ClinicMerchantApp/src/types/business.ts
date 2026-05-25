/**
 * Business Types for React Native
 * 
 * Local type definitions to avoid importing from shared-types
 * which causes Prisma client issues in React Native.
 */

export enum BusinessCategory {
  SALON = 'SALON',
  CLINIC = 'CLINIC', 
  SPA = 'SPA',
  BEAUTY_PARLOR = 'BEAUTY_PARLOR',
  FITNESS = 'FITNESS',
  OTHER = 'OTHER'
}

export type BusinessCategoryType = keyof typeof BusinessCategory;
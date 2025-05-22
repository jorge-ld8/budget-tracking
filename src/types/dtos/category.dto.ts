import { TRANSACTION_TYPES } from '../../utils/constants.ts';

export type CategoryType = typeof TRANSACTION_TYPES[number];

// DTO for creating a new category
export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

// DTO for updating an existing category
export interface UpdateCategoryDto {
  name?: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
}

// DTO for filtering category queries
export interface CategoryQueryFiltersDto {
  type?: CategoryType;
  name?: string; // For regex search
  sort?: string;
  fields?: string;
  page?: number;
  limit?: number;
  user?: string; // For admin/specific user filtering
  includeDeleted?: boolean;
} 
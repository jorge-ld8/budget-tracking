// src/types/common.ts
export interface Entity {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;
  }
  
//   export interface EntityFormData {
//     // Common form fields
//   }

  // Specific filter interfaces
export interface DateRangeFilter {
    startDate?: string;
    endDate?: string;
  }

// Pagination response from API
export interface PaginationData {
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationData;
}
  
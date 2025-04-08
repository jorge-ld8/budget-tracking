import { GenericApiService } from '../base/apiService';
import { Category } from '../../types/category';

type CategoryFormData = Omit<Category, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted'>;

export class CategoryService extends GenericApiService<
  Category,
  CategoryFormData,
  Partial<CategoryFormData>
> {
  constructor() {
    super('categories');
  }
  
  protected extractData(responseData: any): Category[] {
    return responseData.categories || [];
  }
  
  protected extractItem(responseData: any): Category {
    return responseData.category;
  }
  
  protected filtersToQueryParams(filters: any): Record<string, string> {
    return filters || {};
  }
}

export const categoryService = new CategoryService();
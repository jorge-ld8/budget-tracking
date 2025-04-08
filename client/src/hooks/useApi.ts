import { useState, useEffect, useCallback } from 'react';
import { Entity } from '../types/common';
import { ICrudService } from '../api/base/apiService';

interface UseApiOptions<F> {
  initialFilters?: F;
  loadOnMount?: boolean;
}

export function useApi<
  T extends Entity,
  C,
  U = Partial<C>,
  F = {}
>(service: ICrudService<T, C, U, F>, options: UseApiOptions<F> = {}) {
  const { initialFilters = {} as F, loadOnMount = true } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<F>(initialFilters);
  
  const fetchData = useCallback(async (queryFilters?: F) => {
    setIsLoading(true);
    setError(null);
    
    const appliedFilters = queryFilters || filters;
    if (queryFilters) setFilters(queryFilters);
    
    try {
      const result = await service.getAll(appliedFilters);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, filters]);
  
  const getById = useCallback(async (id: string): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.getById(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [service]);
  
  const create = useCallback(async (item: C): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.create(item);
      setData(prev => [...prev, result]);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [service]);
  
  const update = useCallback(async (id: string, item: U): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.update(id, item);
      setData(prev => prev.map(entity => entity._id === id ? result : entity));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [service]);
  
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await service.delete(id);
      setData(prev => prev.filter(entity => entity._id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [service]);
  
  useEffect(() => {
    if (loadOnMount) {
      fetchData();
    }
  }, [loadOnMount, fetchData]);
  
  return {
    data,
    isLoading,
    error,
    filters,
    fetchData,
    getById,
    create,
    update,
    remove,
    setFilters
  };
}

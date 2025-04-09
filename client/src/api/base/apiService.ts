import axios, { AxiosRequestConfig } from "axios";
import { AxiosInstance } from "axios";
import { Entity } from "../../types/common";

export interface IReadableService<T extends Entity, F ={}>{
    getAll(filters?: F): Promise<T[]>;
    getById(id: string): Promise<T>;
}

export interface IWritableService<T extends Entity, C, U = Partial<T>>{
    create(data: C): Promise<T>;
    update(id: string, data: U): Promise<T>;
    delete(id: string): Promise<void>;
}

export interface ICrudService<T extends Entity, F = {}, C = {}, U = Partial<T>>
    extends IReadableService<T, F>, IWritableService<T, C, U> {}

export abstract class BaseApiService{
    protected baseUrl: string;
    protected http: AxiosInstance;

    constructor(baseUrl: string){
        this.baseUrl = baseUrl;
        this.http = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.http.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if(token){
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        });
    }

    protected handleError(error: unknown): never{
        let errorMessage = 'An unknown error occurred';
        if(axios.isAxiosError(error)){
            errorMessage = error.response?.data?.message || error.message;
        }
        throw new Error(errorMessage);
    }
}

export abstract class GenericApiService<
    T extends Entity,
    F = {},
    C = {},
    U = Partial<T>
> extends BaseApiService implements ICrudService<T, F, C, U>{
    
    constructor(endpoint: string){
        super(`${import.meta.env.VITE_API_URL}/${endpoint}`);
    }

    async getAll(filters?: F): Promise<T[]> {
        try {
          const params = filters ? new URLSearchParams(this.filtersToQueryParams(filters)) : undefined;
          const config: AxiosRequestConfig = { params };
          const response = await this.http.get('', config);
          return this.extractData(response.data);
        } catch (error) {
          throw this.handleError(error);
        }
      }

    async getById(id: string): Promise<T> {
        try {
            const response = await this.http.get(`/${id}`);
                return this.extractItem(response.data);
              } catch (error) {
            throw this.handleError(error);
        }
    }

    async create(data: C): Promise<T> {
        try {
          const response = await this.http.post('', data);
          return this.extractItem(response.data);
        } catch (error) {
          throw this.handleError(error);
        }
    }
      
    async update(id: string, data: U): Promise<T> {
        try {
            const response = await this.http.put(`/${id}`, data);
            return this.extractItem(response.data);
        } catch (error) {
            throw this.handleError(error);
        }
    }
      
    async delete(id: string): Promise<void> {
        try {
            await this.http.delete(`/${id}`);
        } catch (error) {
            throw this.handleError(error);
        }
    }
      
    protected abstract extractData(responseData: any): T[];
    protected abstract extractItem(responseData: any): T;
    protected abstract filtersToQueryParams(filters: F): Record<string, string>;
}
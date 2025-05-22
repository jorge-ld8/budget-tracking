import { UnauthorizedError } from '../../../src/errors/index.js';
import type { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { describe, it, beforeEach, expect } from '@jest/globals';
import { authenticate } from '../../../src/middlewares/auth.js';
import User from '../../../src/models/users.ts';

jwt.verify = jest.fn().mockReturnValue({ id: '123456789012' }) as jest.Mock;
// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Mock the User model and jwt
jest.mock('../../../src/models/users.ts', () => ({
  findById: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: '123456789012',
      username: 'middleware-test',
      email: 'middleware@test.com',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    } as never)
  })
}));


// jest.mock('jsonwebtoken');


// // Create a mock of the authenticate middleware to avoid type issues
// const authenticate = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
//   const { authenticate: originalAuthenticate } = await import('../../../src/middlewares/auth.js');
//   return originalAuthenticate(req as any, res, next);
// };

describe('Auth Middleware', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should block requests without tokens', async () => {
    const req : any = { headers: {} } as Request & { user?: any };
    const res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn() 
    } as unknown as Response;
    const next = jest.fn();
    
    await authenticate(req, res, next);
    
    // expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    // expect(next).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect((next.mock.calls[0][0] as UnauthorizedError).message).toBe('Authentication required');
  });

  it('should block requests with invalid token format', async () => {
    // Setup
    const req : any  = { headers: { authorization: 'InvalidToken' } } as Request & { user?: any };
    const res = {} as Response;
    const next = jest.fn();
    
    // Execute
    await authenticate(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
  
  it('should allow requests with valid tokens', async () => {
    // Get mocked modules
    const mockUser = {
      _id: '123456789012',
      username: 'middleware-test',
      email: 'middleware@test.com',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    };
    
    // Mock the JWT verify method
    (jwt.verify as jest.Mock).mockReturnValue({ id: mockUser._id });
    
    // Mock the User.findById and select chain
    const mockSelect = jest.fn().mockResolvedValue(mockUser as never);
    User.findById = jest.fn().mockReturnValue({
      select: mockSelect
    }) as any;
    
    // Setup request
    const req : any= { 
      headers: { 
        authorization: 'Bearer valid-token' 
      } 
    };
    const res = {} as Response;
    const next = jest.fn();
    
    // Execute middleware
    await authenticate(req as any, res, next);
    
    // Verify correct behavior
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith(mockUser._id);
    expect(mockSelect).toHaveBeenCalledWith('-password');
    
    expect(req.user).toEqual(mockUser);
    
    expect(next).toHaveBeenCalledWith();
  });
}); 
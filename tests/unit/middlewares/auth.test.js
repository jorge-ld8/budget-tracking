const { authenticate } = require('../../../src/middlewares/auth');
const { StatusCodes } = require('http-status-codes');
const User = require('../../../src/models/users.ts');
const { UnauthorizedError } = require('../../../src/errors');
const jwt = require('jsonwebtoken');

// Mock the User model and jwt
jest.mock('../../../src/models/users.ts');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should block requests without tokens', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    
    await authenticate(req, res, next);
    
    // expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    // expect(next).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(next.mock.calls[0][0].message).toBe('Authentication required');
  });

  it('should block requests with invalid token format', async () => {
    // Setup
    const req = { headers: { authorization: 'InvalidToken' } };
    const res = {};
    const next = jest.fn();
    
    // Execute
    await authenticate(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
  
  it('should allow requests with valid tokens', async () => {
    // Create a mock user object DIRECTLY (not using User.create)
    const mockUser = {
      _id: '123456789012',
      username: 'middleware-test',
      email: 'middleware@test.com',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    };
    
    // Mock the JWT verify method
    jwt.verify.mockReturnValue({ id: mockUser._id });
    
    // Mock the User.findById and select chain
    const mockSelect = jest.fn().mockResolvedValue(mockUser);
    User.findById = jest.fn().mockReturnValue({
      select: mockSelect
    });
    
    // Setup request
    const req = { 
      headers: { 
        authorization: 'Bearer valid-token' 
      } 
    };
    const res = {};
    const next = jest.fn();
    
    // Execute middleware
    await authenticate(req, res, next);
    
    // Verify correct behavior
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith(mockUser._id);
    expect(mockSelect).toHaveBeenCalledWith('-password');
    
    expect(req.user).toEqual(mockUser);
    
    expect(next).toHaveBeenCalledWith();
  });
});

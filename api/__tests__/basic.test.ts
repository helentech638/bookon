import { AppError } from '../middleware/errorHandler';

describe('Basic Setup', () => {
  it('should create AppError instances', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
  });

  it('should handle AppError without code', () => {
    const error = new AppError('Test error', 500);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('UNKNOWN_ERROR');
  });
});

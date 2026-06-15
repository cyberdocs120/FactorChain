import { PaginationQuerySchema } from './pagination.dto';

describe('PaginationQuerySchema', () => {
  it('should use defaults for empty input', () => {
    const result = PaginationQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
  });

  it('should parse valid page and page_size', () => {
    const result = PaginationQuerySchema.parse({ page: '2', page_size: '50' });
    expect(result.page).toBe(2);
    expect(result.page_size).toBe(50);
  });

  it('should reject negative page', () => {
    expect(() => PaginationQuerySchema.parse({ page: '-1' })).toThrow();
  });

  it('should reject page_size over 100', () => {
    expect(() => PaginationQuerySchema.parse({ page_size: '101' })).toThrow();
  });
});

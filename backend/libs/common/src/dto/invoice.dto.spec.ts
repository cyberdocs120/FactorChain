import { CreateInvoiceSchema } from './invoice.dto';

describe('CreateInvoiceSchema', () => {
  it('should accept valid invoice creation', () => {
    const result = CreateInvoiceSchema.parse({
      seller: 'GABCDEF123456',
      buyer: 'GHIJKL789012',
      face_value: '100000',
      due_date: '2026-12-31T23:59:59Z',
    });
    expect(result.seller).toBe('GABCDEF123456');
    expect(result.face_value).toBe('100000');
  });

  it('should reject empty seller', () => {
    expect(() =>
      CreateInvoiceSchema.parse({
        seller: '',
        buyer: 'GHIJKL789012',
        face_value: '100000',
        due_date: '2026-12-31T23:59:59Z',
      }),
    ).toThrow();
  });

  it('should reject non-numeric face_value', () => {
    expect(() =>
      CreateInvoiceSchema.parse({
        seller: 'GABCDEF123456',
        buyer: 'GHIJKL789012',
        face_value: 'abc',
        due_date: '2026-12-31T23:59:59Z',
      }),
    ).toThrow();
  });
});

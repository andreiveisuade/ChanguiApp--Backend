const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
};

// Reset todos los mocks entre tests
beforeEach(() => {
  Object.values(mockSupabase).forEach((fn) => {
    if (typeof fn.mockClear === 'function') {
      fn.mockClear();
      // Re-setear mockReturnThis para los chainables
      if (fn !== mockSupabase.single && fn !== mockSupabase.maybeSingle) {
        fn.mockReturnThis();
      }
    }
  });
});

module.exports = mockSupabase;

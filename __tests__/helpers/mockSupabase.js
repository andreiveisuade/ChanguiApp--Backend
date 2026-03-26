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
  auth: {
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
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
  // Reset auth mocks
  Object.values(mockSupabase.auth).forEach((fn) => {
    if (typeof fn.mockClear === 'function') fn.mockClear();
  });
});

module.exports = mockSupabase;

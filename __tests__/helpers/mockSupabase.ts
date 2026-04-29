const mockSupabase: any = {
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
  upsert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    signUp: jest
      .fn()
      .mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithPassword: jest
      .fn()
      .mockResolvedValue({ data: { user: null, session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
};

beforeEach(() => {
  Object.keys(mockSupabase).forEach((key) => {
    const fn = mockSupabase[key];
    if (typeof fn?.mockClear === 'function') {
      fn.mockClear();
      if (fn !== mockSupabase.single && fn !== mockSupabase.maybeSingle) {
        fn.mockReturnThis();
      }
    }
  });
  Object.values(mockSupabase.auth).forEach((fn: any) => {
    if (typeof fn?.mockClear === 'function') fn.mockClear();
  });
});

// Soporta tanto `import supabase from '../config/supabase'` (default)
// como `import { supabase, supabaseAdmin } from '../config/supabase'` (named).
// El mismo cliente mock cubre ambos roles porque en tests no hay diferencia
// entre anon/service_role.
export default mockSupabase;
export const supabase = mockSupabase;
export const supabaseAdmin = mockSupabase;

module.exports = mockSupabase;
module.exports.default = mockSupabase;
module.exports.supabase = mockSupabase;
module.exports.supabaseAdmin = mockSupabase;

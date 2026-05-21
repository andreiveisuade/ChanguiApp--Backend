jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

import mockSupabase from '../../helpers/mockSupabase';
import * as syncJobsRepository from '../../../src/repositories/sync_jobs.repository';

const JOB_ID = 'job-uuid-1';

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    id: JOB_ID,
    type: 'precios_claros',
    status: 'running',
    total_target: null,
    processed: 0,
    errors: 0,
    last_offset: 0,
    error_message: null,
    started_at: '2026-05-21T00:00:00Z',
    completed_at: null,
    created_at: '2026-05-21T00:00:00Z',
    ...overrides,
  };
}

describe('SyncJobsRepository', () => {
  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('inserta un job con status running y devuelve la fila', async () => {
      const row = buildRow();
      mockSupabase.single.mockResolvedValue({ data: row, error: null });

      const result = await syncJobsRepository.create('precios_claros');

      expect(mockSupabase.from).toHaveBeenCalledWith('sync_jobs');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        type: 'precios_claros',
        status: 'running',
      });
      expect(result).toEqual(row);
    });

    it('lanza el error de supabase', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('insert failed'),
      });

      await expect(syncJobsRepository.create('precios_claros')).rejects.toThrow(
        'insert failed',
      );
    });
  });

  describe('findById', () => {
    it('devuelve el job cuando existe', async () => {
      const row = buildRow();
      mockSupabase.single.mockResolvedValue({ data: row, error: null });

      const result = await syncJobsRepository.findById(JOB_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith('sync_jobs');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', JOB_ID);
      expect(result).toEqual(row);
    });

    it('devuelve null si supabase responde con PGRST116 (no rows)', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await syncJobsRepository.findById('no-existe');

      expect(result).toBeNull();
    });

    it('lanza otros errores de supabase', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER', message: 'kaboom' },
      });

      await expect(syncJobsRepository.findById(JOB_ID)).rejects.toMatchObject({
        code: 'OTHER',
      });
    });
  });

  describe('findRunning', () => {
    it('filtra por type y status running', async () => {
      const row = buildRow();
      mockSupabase.maybeSingle.mockResolvedValue({ data: row, error: null });

      const result = await syncJobsRepository.findRunning('precios_claros');

      expect(mockSupabase.from).toHaveBeenCalledWith('sync_jobs');
      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'precios_claros');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'running');
      expect(mockSupabase.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(row);
    });

    it('devuelve null cuando no hay running', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await syncJobsRepository.findRunning('precios_claros');

      expect(result).toBeNull();
    });

    it('lanza el error de supabase', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: new Error('select failed'),
      });

      await expect(syncJobsRepository.findRunning('precios_claros')).rejects.toThrow(
        'select failed',
      );
    });
  });

  describe('setTotal', () => {
    it('updatea total_target', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      await syncJobsRepository.setTotal(JOB_ID, 8021);

      expect(mockSupabase.update).toHaveBeenCalledWith({ total_target: 8021 });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', JOB_ID);
    });

    it('lanza el error de supabase', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: new Error('update failed') });
      await expect(syncJobsRepository.setTotal(JOB_ID, 1)).rejects.toThrow('update failed');
    });
  });

  describe('updateProgress', () => {
    it('updatea processed, last_offset y errors', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      await syncJobsRepository.updateProgress(JOB_ID, 200, 200, 2);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        processed: 200,
        last_offset: 200,
        errors: 2,
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', JOB_ID);
    });

    it('lanza el error de supabase', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: new Error('boom') });
      await expect(
        syncJobsRepository.updateProgress(JOB_ID, 0, 0, 0),
      ).rejects.toThrow('boom');
    });
  });

  describe('markCompleted', () => {
    it('setea status completed y completed_at', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      await syncJobsRepository.markCompleted(JOB_ID);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String),
        }),
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', JOB_ID);
    });

    it('lanza el error de supabase', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: new Error('boom') });
      await expect(syncJobsRepository.markCompleted(JOB_ID)).rejects.toThrow('boom');
    });
  });

  describe('markFailed', () => {
    it('setea status failed, error_message y completed_at', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      await syncJobsRepository.markFailed(JOB_ID, 'algo se rompió');

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'algo se rompió',
          completed_at: expect.any(String),
        }),
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', JOB_ID);
    });

    it('lanza el error de supabase', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: new Error('boom') });
      await expect(syncJobsRepository.markFailed(JOB_ID, 'x')).rejects.toThrow('boom');
    });
  });
});

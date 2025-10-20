import { UnifiedApprovalService } from '../unifiedApprovalService';

// Mock Supabase client
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      }))
    }))
  }
}));

describe('UnifiedApprovalService', () => {
  describe('getApprovalLevels', () => {
    it('should fetch approval levels successfully', async () => {
      const result = await UnifiedApprovalService.getApprovalLevels();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('determineApprovalLevel', () => {
    it('should determine appropriate approval level for small loans', async () => {
      const result = await UnifiedApprovalService.determineApprovalLevel(100000, 'individual');
      expect(result).toBeDefined();
    });

    it('should determine appropriate approval level for large loans', async () => {
      const result = await UnifiedApprovalService.determineApprovalLevel(3000000, 'corporate');
      expect(result).toBeDefined();
    });
  });

  describe('getApprovalWorkflowState', () => {
    it('should get workflow state for a loan application', async () => {
      const result = await UnifiedApprovalService.getApprovalWorkflowState('test-loan-id');
      expect(result).toBeDefined();
      expect(result.loanApplicationId).toBe('test-loan-id');
    });
  });

  describe('processApprovalAction', () => {
    it('should process approval action successfully', async () => {
      const result = await UnifiedApprovalService.processApprovalAction(
        'test-loan-id',
        'approve',
        'test-user-id',
        'Test approval'
      );
      expect(result.success).toBe(true);
    });

    it('should process rejection action successfully', async () => {
      const result = await UnifiedApprovalService.processApprovalAction(
        'test-loan-id',
        'reject',
        'test-user-id',
        'Test rejection'
      );
      expect(result.success).toBe(true);
    });
  });
});









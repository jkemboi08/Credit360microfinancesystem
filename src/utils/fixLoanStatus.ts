import { supabase } from '../lib/supabaseClient';

// Approval levels configuration matching the database
const APPROVAL_LEVELS = [
  { min_amount: 0, max_amount: 500000, requires_committee_approval: false, approval_authority: 'loan_officer' },
  { min_amount: 500001, max_amount: 2000000, requires_committee_approval: false, approval_authority: 'senior_officer' },
  { min_amount: 2000001, max_amount: 5000000, requires_committee_approval: true, committee_threshold: 2000000, approval_authority: 'manager' },
  { min_amount: 5000001, max_amount: 999999999, requires_committee_approval: true, committee_threshold: 5000000, approval_authority: 'committee' }
];

function determineApprovalLevel(loanAmount: number) {
  return APPROVAL_LEVELS.find(level => 
    loanAmount >= level.min_amount && loanAmount <= level.max_amount
  );
}

export async function fixLoanStatus(applicationId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔍 Fixing loan status for application: ${applicationId}`);
    
    // Get the loan
    const { data: loan, error: loanError } = await supabase
      .from('loan_applications')
      .select('id, application_id, requested_amount, status')
      .eq('application_id', applicationId)
      .single();

    if (loanError || !loan) {
      return { success: false, message: 'Loan not found' };
    }

    console.log(`Found loan: ${loan.application_id}, Amount: ${loan.requested_amount}, Status: ${loan.status}`);

    // Determine correct approval level
    const correctApprovalLevel = determineApprovalLevel(loan.requested_amount);
    
    if (!correctApprovalLevel) {
      return { success: false, message: 'Could not determine approval level' };
    }

    // Check if committee review is actually required
    const isCommitteeRequired = correctApprovalLevel.requires_committee_approval && 
      loan.requested_amount >= (correctApprovalLevel.committee_threshold || 0);

    console.log(`Correct approval level: ${correctApprovalLevel.approval_authority}`);
    console.log(`Requires committee: ${isCommitteeRequired}`);

    // Determine correct status
    let correctStatus = loan.status;

    if (loan.status === 'pending_committee_review' && !isCommitteeRequired) {
      correctStatus = 'approved';
    } else if (loan.status !== 'pending_committee_review' && isCommitteeRequired) {
      correctStatus = 'pending_committee_review';
    } else {
      return { success: true, message: 'Status is already correct' };
    }

    console.log(`Updating status from ${loan.status} to ${correctStatus}`);

    // Try to update using the loan service approach
    const { data: updateData, error: updateError } = await supabase
      .from('loan_applications')
      .update({
        status: correctStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', loan.id)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      return { success: false, message: `Failed to update: ${updateError.message}` };
    }

    console.log('Update successful:', updateData);
    return { success: true, message: `Status updated from ${loan.status} to ${correctStatus}` };

  } catch (error) {
    console.error('Error fixing loan status:', error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to fix all loans with incorrect statuses
export async function fixAllLoanStatuses(): Promise<{ success: boolean; message: string; fixedCount: number }> {
  try {
    console.log('🔍 Fixing all loan statuses...');
    
    // Get all loans that might have incorrect statuses
    const { data: loans, error: loansError } = await supabase
      .from('loan_applications')
      .select('id, application_id, requested_amount, status')
      .in('status', ['pending_committee_review', 'approved', 'under_review']);

    if (loansError) {
      return { success: false, message: `Failed to fetch loans: ${loansError.message}`, fixedCount: 0 };
    }

    let fixedCount = 0;
    const results = [];

    for (const loan of loans) {
      const result = await fixLoanStatus(loan.application_id || loan.id);
      if (result.success && result.message.includes('updated')) {
        fixedCount++;
      }
      results.push({ loanId: loan.id, applicationId: loan.application_id, ...result });
    }

    console.log(`Fixed ${fixedCount} out of ${loans.length} loans`);
    return { 
      success: true, 
      message: `Fixed ${fixedCount} out of ${loans.length} loans`, 
      fixedCount 
    };

  } catch (error) {
    console.error('Error fixing all loan statuses:', error);
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      fixedCount: 0 
    };
  }
}








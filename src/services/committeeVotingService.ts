import { supabase } from '../lib/supabaseClient';

export interface CommitteeMember {
  id: string;
  user_id: string;
  committee_role: 'chairperson' | 'member' | 'secretary';
  is_active: boolean;
  voting_weight: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined user data
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CommitteeVote {
  id: string;
  loan_application_id: string;
  committee_member_id: string;
  vote_decision: 'approve' | 'reject' | 'abstain';
  vote_comments?: string;
  vote_weight: number;
  voted_at: string;
  // Joined data
  committee_member?: CommitteeMember;
}

export interface CommitteeDecision {
  id: string;
  loan_application_id: string;
  total_members: number;
  total_votes: number;
  approve_votes: number;
  reject_votes: number;
  abstain_votes: number;
  total_weight: number;
  approve_weight: number;
  reject_weight: number;
  abstain_weight: number;
  final_decision: 'approve' | 'reject' | 'pending';
  decision_reason?: string;
  quorum_met: boolean;
  quorum_required: number;
  decided_at: string;
  decided_by?: string;
  // Joined data
  loan_application?: {
    id: string;
    application_id: string;
    requested_amount: number;
    loan_purpose: string;
    status: string;
    clients?: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface VotingSummary {
  loan_application_id: string;
  total_members: number;
  total_votes: number;
  approve_votes: number;
  reject_votes: number;
  abstain_votes: number;
  total_weight: number;
  approve_weight: number;
  reject_weight: number;
  abstain_weight: number;
  quorum_met: boolean;
  final_decision: 'approve' | 'reject' | 'pending';
  votes_remaining: number;
  can_vote: boolean;
  has_voted: boolean;
  user_vote?: 'approve' | 'reject' | 'abstain';
  user_vote_comments?: string;
}

export class CommitteeVotingService {
  /**
   * Get all active committee members
   */
  static async getCommitteeMembers(): Promise<CommitteeMember[]> {
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select(`
          *,
          user:profiles!user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('is_active', true)
        .order('committee_role', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching committee members:', error);
      throw error;
    }
  }

  /**
   * Get voting summary for a loan application
   */
  static async getVotingSummary(loanApplicationId: string, userId: string): Promise<VotingSummary | null> {
    try {
      // Get committee decision data
      const { data: decision, error: decisionError } = await supabase
        .from('committee_decisions')
        .select('*')
        .eq('loan_application_id', loanApplicationId)
        .single();

      if (decisionError && decisionError.code !== 'PGRST116') {
        throw decisionError;
      }

      // Get user's vote if exists
      const { data: userVote, error: voteError } = await supabase
        .from('committee_votes')
        .select('vote_decision, vote_comments')
        .eq('loan_application_id', loanApplicationId)
        .eq('committee_member_id', (
          await supabase
            .from('committee_members')
            .select('id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single()
        ).data?.id)
        .single();

      if (voteError && voteError.code !== 'PGRST116') {
        throw voteError;
      }

      // Get total active members
      const { data: members, error: membersError } = await supabase
        .from('committee_members')
        .select('id')
        .eq('is_active', true);

      if (membersError) throw membersError;

      const totalMembers = members?.length || 0;
      const totalVotes = decision?.total_votes || 0;
      const votesRemaining = totalMembers - totalVotes;
      const hasVoted = !!userVote;
      const canVote = !hasVoted && decision?.final_decision === 'pending';

      return {
        loan_application_id: loanApplicationId,
        total_members: totalMembers,
        total_votes: totalVotes,
        approve_votes: decision?.approve_votes || 0,
        reject_votes: decision?.reject_votes || 0,
        abstain_votes: decision?.abstain_votes || 0,
        total_weight: decision?.total_weight || 0,
        approve_weight: decision?.approve_weight || 0,
        reject_weight: decision?.reject_weight || 0,
        abstain_weight: decision?.abstain_weight || 0,
        quorum_met: decision?.quorum_met || false,
        final_decision: decision?.final_decision || 'pending',
        votes_remaining: votesRemaining,
        can_vote: canVote,
        has_voted: hasVoted,
        user_vote: userVote?.vote_decision,
        user_vote_comments: userVote?.vote_comments
      };
    } catch (error) {
      console.error('Error fetching voting summary:', error);
      throw error;
    }
  }

  /**
   * Submit a committee vote
   */
  static async submitVote(
    loanApplicationId: string,
    userId: string,
    voteDecision: 'approve' | 'reject' | 'abstain',
    voteComments?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get committee member ID
      const { data: member, error: memberError } = await supabase
        .from('committee_members')
        .select('id, voting_weight')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (memberError) {
        return { success: false, message: 'You are not an active committee member' };
      }

      // Check if user has already voted
      const { data: existingVote, error: existingError } = await supabase
        .from('committee_votes')
        .select('id')
        .eq('loan_application_id', loanApplicationId)
        .eq('committee_member_id', member.id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingVote) {
        // Update existing vote
        const { error: updateError } = await supabase
          .from('committee_votes')
          .update({
            vote_decision: voteDecision,
            vote_comments: voteComments,
            voted_at: new Date().toISOString()
          })
          .eq('id', existingVote.id);

        if (updateError) throw updateError;
      } else {
        // Create new vote
        const { error: insertError } = await supabase
          .from('committee_votes')
          .insert({
            loan_application_id: loanApplicationId,
            committee_member_id: member.id,
            vote_decision: voteDecision,
            vote_comments: voteComments,
            vote_weight: member.voting_weight
          });

        if (insertError) throw insertError;
      }

      // The trigger will automatically update the committee decision
      return { 
        success: true, 
        message: `Vote submitted successfully. Decision: ${voteDecision}` 
      };
    } catch (error) {
      console.error('Error submitting vote:', error);
      return { 
        success: false, 
        message: 'Failed to submit vote. Please try again.' 
      };
    }
  }

  /**
   * Get all votes for a loan application
   */
  static async getVotesForApplication(loanApplicationId: string): Promise<CommitteeVote[]> {
    try {
      const { data, error } = await supabase
        .from('committee_votes')
        .select(`
          *,
          committee_member:committee_members!committee_member_id (
            *,
            user:profiles!user_id (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('loan_application_id', loanApplicationId)
        .order('voted_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching votes:', error);
      throw error;
    }
  }

  /**
   * Get committee decisions that need action
   */
  static async getPendingDecisions(): Promise<CommitteeDecision[]> {
    try {
      const { data, error } = await supabase
        .from('committee_decisions')
        .select(`
          *,
          loan_application:loan_applications!loan_application_id (
            id,
            application_id,
            requested_amount,
            loan_purpose,
            status,
            clients (
              first_name,
              last_name
            )
          )
        `)
        .eq('final_decision', 'pending')
        .order('decided_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending decisions:', error);
      throw error;
    }
  }

  /**
   * Get completed committee decisions
   */
  static async getCompletedDecisions(): Promise<CommitteeDecision[]> {
    try {
      const { data, error } = await supabase
        .from('committee_decisions')
        .select(`
          *,
          loan_application:loan_applications!loan_application_id (
            id,
            application_id,
            requested_amount,
            loan_purpose,
            status,
            clients (
              first_name,
              last_name
            )
          )
        `)
        .in('final_decision', ['approve', 'reject'])
        .order('decided_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completed decisions:', error);
      throw error;
    }
  }

  /**
   * Finalize a committee decision (only chairperson can do this)
   */
  static async finalizeDecision(
    loanApplicationId: string,
    userId: string,
    decisionReason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user is chairperson
      const { data: member, error: memberError } = await supabase
        .from('committee_members')
        .select('id, committee_role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (memberError || member?.committee_role !== 'chairperson') {
        return { success: false, message: 'Only committee chairperson can finalize decisions' };
      }

      // Get current decision
      const { data: decision, error: decisionError } = await supabase
        .from('committee_decisions')
        .select('*')
        .eq('loan_application_id', loanApplicationId)
        .single();

      if (decisionError) {
        return { success: false, message: 'No committee decision found' };
      }

      if (decision.final_decision === 'pending') {
        return { success: false, message: 'Decision is still pending - cannot finalize yet' };
      }

      // Update decision with reason and finalizer
      const { error: updateError } = await supabase
        .from('committee_decisions')
        .update({
          decision_reason: decisionReason,
          decided_by: userId,
          decided_at: new Date().toISOString()
        })
        .eq('id', decision.id);

      if (updateError) throw updateError;

      // Update loan application status based on decision
      const newStatus = decision.final_decision === 'approve' ? 'approved' : 'rejected';
      const { error: loanError } = await supabase
        .from('loan_applications')
        .update({
          status: newStatus,
          approval_status: newStatus,
          committee_voting_status: 'voting_complete'
        })
        .eq('id', loanApplicationId);

      if (loanError) throw loanError;

      return { 
        success: true, 
        message: `Decision finalized: ${decision.final_decision}` 
      };
    } catch (error) {
      console.error('Error finalizing decision:', error);
      return { 
        success: false, 
        message: 'Failed to finalize decision. Please try again.' 
      };
    }
  }

  /**
   * Check if user is a committee member
   */
  static async isCommitteeMember(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is committee chairperson
   */
  static async isCommitteeChairperson(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select('id')
        .eq('user_id', userId)
        .eq('committee_role', 'chairperson')
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}





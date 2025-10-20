import { supabase } from '../lib/supabaseClient';

export interface ConsensusDecision {
  id: string;
  group_id: string;
  decision_type: string;
  title: string;
  description?: string;
  proposed_by?: string;
  proposed_date: string;
  voting_deadline: string;
  status: 'voting' | 'approved' | 'rejected' | 'cancelled';
  total_members: number;
  votes_cast: number;
  votes_for: number;
  votes_against: number;
  abstentions: number;
  required_quorum: number;
  required_majority: number;
  decision_result?: string;
  created_at: string;
}

export interface ConsensusVote {
  id: string;
  decision_id: string;
  member_id: string;
  member_name: string;
  vote: 'for' | 'against' | 'abstain';
  vote_date: string;
  comments?: string;
}

export class GroupConsensusService {
  // Get consensus decisions for a group
  static async getConsensusDecisions(groupId: string): Promise<{ success: boolean; data?: ConsensusDecision[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_consensus_decisions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consensus decisions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching consensus decisions:', error);
      return { success: false, error: 'Failed to fetch consensus decisions' };
    }
  }

  // Create a new consensus decision
  static async createConsensusDecision(decision: Partial<ConsensusDecision>): Promise<{ success: boolean; data?: ConsensusDecision; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_consensus_decisions')
        .insert([decision])
        .select()
        .single();

      if (error) {
        console.error('Error creating consensus decision:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating consensus decision:', error);
      return { success: false, error: 'Failed to create consensus decision' };
    }
  }

  // Update a consensus decision
  static async updateConsensusDecision(decisionId: string, updates: Partial<ConsensusDecision>): Promise<{ success: boolean; data?: ConsensusDecision; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_consensus_decisions')
        .update(updates)
        .eq('id', decisionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating consensus decision:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating consensus decision:', error);
      return { success: false, error: 'Failed to update consensus decision' };
    }
  }

  // Cast a vote
  static async castVote(vote: Partial<ConsensusVote>): Promise<{ success: boolean; data?: ConsensusVote; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consensus_votes')
        .upsert([vote], { onConflict: 'decision_id,member_id' })
        .select()
        .single();

      if (error) {
        console.error('Error casting vote:', error);
        return { success: false, error: error.message };
      }

      // Update the decision vote counts
      await this.updateVoteCounts(vote.decision_id!);

      return { success: true, data };
    } catch (error) {
      console.error('Error casting vote:', error);
      return { success: false, error: 'Failed to cast vote' };
    }
  }

  // Update vote counts for a decision
  private static async updateVoteCounts(decisionId: string): Promise<void> {
    try {
      const { data: votes, error } = await supabase
        .from('consensus_votes')
        .select('vote')
        .eq('decision_id', decisionId);

      if (error) throw error;

      const voteCounts = votes.reduce((acc, vote) => {
        acc[vote.vote] = (acc[vote.vote] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await supabase
        .from('group_consensus_decisions')
        .update({
          votes_cast: votes.length,
          votes_for: voteCounts.for || 0,
          votes_against: voteCounts.against || 0,
          abstentions: voteCounts.abstain || 0
        })
        .eq('id', decisionId);
    } catch (error) {
      console.error('Error updating vote counts:', error);
    }
  }

  // Get votes for a decision
  static async getDecisionVotes(decisionId: string): Promise<{ success: boolean; data?: ConsensusVote[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consensus_votes')
        .select('*')
        .eq('decision_id', decisionId)
        .order('vote_date', { ascending: false });

      if (error) {
        console.error('Error fetching votes:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching votes:', error);
      return { success: false, error: 'Failed to fetch votes' };
    }
  }
}




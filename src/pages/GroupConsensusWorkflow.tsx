import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { GroupService, Group, GroupMember } from '../services/groupService';
import { GroupConsensusService } from '../services/groupConsensusService';
import {
  Users, Vote, CheckCircle, XCircle, Clock, AlertTriangle, MessageSquare,
  FileText, Download, Send, RefreshCw, Eye, UserCheck, Shield, DollarSign,
  TrendingUp, BarChart3, Calendar, Bell
} from 'lucide-react';

interface ConsensusDecision {
  id: string;
  group_id: string;
  decision_type: 'loan_approval' | 'member_expulsion' | 'rule_change' | 'fund_utilization' | 'meeting_schedule';
  title: string;
  description: string;
  proposed_by: string;
  proposed_date: string;
  voting_deadline: string;
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'expired';
  total_members: number;
  votes_cast: number;
  votes_for: number;
  votes_against: number;
  abstentions: number;
  required_quorum: number;
  required_majority: number;
  decision_result: string;
  implementation_date?: string;
  created_at: string;
}

interface GroupVote {
  id: string;
  decision_id: string;
  member_id: string;
  member_name: string;
  vote: 'for' | 'against' | 'abstain';
  comments: string;
  voted_at: string;
  is_leadership: boolean;
}

interface GroupConsensusSettings {
  group_id: string;
  quorum_percentage: number;
  majority_percentage: number;
  voting_duration_days: number;
  allow_abstentions: boolean;
  require_leadership_approval: boolean;
  auto_approve_threshold: number;
  notification_settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
  };
}

const GroupConsensusWorkflow: React.FC = () => {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [consensusDecisions, setConsensusDecisions] = useState<ConsensusDecision[]>([]);
  const [groupVotes, setGroupVotes] = useState<GroupVote[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [consensusSettings, setConsensusSettings] = useState<GroupConsensusSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateDecision, setShowCreateDecision] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDecisionDetails, setShowDecisionDetails] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<ConsensusDecision | null>(null);
  
  // Form states
  const [decisionForm, setDecisionForm] = useState({
    decision_type: '',
    title: '',
    description: '',
    voting_deadline: '',
    priority: 'medium'
  });
  
  const [voteForm, setVoteForm] = useState({
    vote: '',
    comments: ''
  });
  
  const [settingsForm, setSettingsForm] = useState({
    quorum_percentage: 75,
    majority_percentage: 51,
    voting_duration_days: 7,
    allow_abstentions: true,
    require_leadership_approval: false,
    auto_approve_threshold: 80,
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await GroupService.getGroups();
      
      if (result.success && result.data) {
        setGroups(result.data);
        if (result.data.length > 0) {
          setSelectedGroup(result.data[0]);
          loadConsensusData(result.data[0].id);
        }
      } else {
        setError(result.error || 'Failed to load groups');
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadConsensusData = async (groupId: string) => {
    try {
      const result = await GroupConsensusService.getConsensusDecisions(groupId);
      
      if (result.success && result.data) {
        setDecisions(result.data);
      } else {
        setError(result.error || 'Failed to load consensus data');
        // Fallback to empty array if no data
        setDecisions([]);
      }
    } catch (error) {
      console.error('Error loading consensus data:', error);
      setError('Failed to load consensus data');
      setDecisions([]);
    }
  };

  const loadConsensusDataMock = async (groupId: string) => {
    try {
      // Mock data - fallback when no real data available
      const mockDecisions: ConsensusDecision[] = [
        {
          id: '1',
          group_id: groupId,
          decision_type: 'loan_approval',
          title: 'Approve Sarah Mwangi Loan Application',
          description: 'Request for TZS 500,000 business loan for inventory purchase',
          proposed_by: 'Group Secretary',
          proposed_date: '2025-01-15',
          voting_deadline: '2025-01-22',
          status: 'voting',
          total_members: 8,
          votes_cast: 5,
          votes_for: 4,
          votes_against: 1,
          abstentions: 0,
          required_quorum: 6,
          required_majority: 4,
          decision_result: '',
          created_at: '2025-01-15T10:00:00Z'
        },
        {
          id: '2',
          group_id: groupId,
          decision_type: 'member_expulsion',
          title: 'Expel John Kimani for Non-Payment',
          description: 'Member has defaulted for 60+ days and failed to respond to recovery efforts',
          proposed_by: 'Group Chairman',
          proposed_date: '2025-01-10',
          voting_deadline: '2025-01-17',
          status: 'approved',
          total_members: 8,
          votes_cast: 7,
          votes_for: 6,
          votes_against: 1,
          abstentions: 0,
          required_quorum: 6,
          required_majority: 4,
          decision_result: 'Member expelled from group',
          implementation_date: '2025-01-18',
          created_at: '2025-01-10T10:00:00Z'
        },
        {
          id: '3',
          group_id: groupId,
          decision_type: 'rule_change',
          title: 'Increase Monthly Savings Contribution',
          description: 'Proposal to increase monthly savings from TZS 20,000 to TZS 30,000',
          proposed_by: 'Group Treasurer',
          proposed_date: '2025-01-12',
          voting_deadline: '2025-01-19',
          status: 'pending',
          total_members: 8,
          votes_cast: 0,
          votes_for: 0,
          votes_against: 0,
          abstentions: 0,
          required_quorum: 6,
          required_majority: 4,
          decision_result: '',
          created_at: '2025-01-12T10:00:00Z'
        }
      ];
      
      const mockVotes: GroupVote[] = [
        {
          id: '1',
          decision_id: '1',
          member_id: 'member_1',
          member_name: 'Sarah Mwangi',
          vote: 'for',
          comments: 'I support this loan application',
          voted_at: '2025-01-16T14:30:00Z',
          is_leadership: false
        },
        {
          id: '2',
          decision_id: '1',
          member_id: 'member_2',
          member_name: 'John Kimani',
          vote: 'against',
          comments: 'Concerned about repayment capacity',
          voted_at: '2025-01-16T15:45:00Z',
          is_leadership: true
        }
      ];
      
      const mockSettings: GroupConsensusSettings = {
        group_id: groupId,
        quorum_percentage: 75,
        majority_percentage: 51,
        voting_duration_days: 7,
        allow_abstentions: true,
        require_leadership_approval: false,
        auto_approve_threshold: 80,
        notification_settings: {
          email_notifications: true,
          sms_notifications: true,
          push_notifications: true
        }
      };
      
      setConsensusDecisions(mockDecisions);
      setGroupVotes(mockVotes);
      setConsensusSettings(mockSettings);
    } catch (error) {
      console.error('Error loading consensus data:', error);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const result = await GroupService.getGroupMembers(groupId);
      if (result.success && result.data) {
        setGroupMembers(result.data);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newDecision: ConsensusDecision = {
        id: Date.now().toString(),
        group_id: selectedGroup!.id,
        decision_type: decisionForm.decision_type as any,
        title: decisionForm.title,
        description: decisionForm.description,
        proposed_by: 'Current User', // In real app, this would be the current user
        proposed_date: new Date().toISOString().split('T')[0],
        voting_deadline: decisionForm.voting_deadline,
        status: 'pending',
        total_members: groupMembers.length,
        votes_cast: 0,
        votes_for: 0,
        votes_against: 0,
        abstentions: 0,
        required_quorum: Math.ceil(groupMembers.length * (consensusSettings?.quorum_percentage || 75) / 100),
        required_majority: Math.ceil(groupMembers.length * (consensusSettings?.majority_percentage || 51) / 100),
        decision_result: '',
        created_at: new Date().toISOString()
      };
      
      setConsensusDecisions(prev => [newDecision, ...prev]);
      setShowCreateDecision(false);
      setDecisionForm({
        decision_type: '',
        title: '',
        description: '',
        voting_deadline: '',
        priority: 'medium'
      });
      
      alert('Decision proposal created successfully!');
    } catch (error) {
      console.error('Error creating decision:', error);
      alert('Failed to create decision. Please try again.');
    }
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDecision) return;
    
    try {
      const newVote: GroupVote = {
        id: Date.now().toString(),
        decision_id: selectedDecision.id,
        member_id: 'current_user',
        member_name: 'Current User',
        vote: voteForm.vote as any,
        comments: voteForm.comments,
        voted_at: new Date().toISOString(),
        is_leadership: false
      };
      
      setGroupVotes(prev => [newVote, ...prev]);
      
      // Update decision vote counts
      const updatedDecisions = consensusDecisions.map(decision =>
        decision.id === selectedDecision.id
          ? {
              ...decision,
              votes_cast: decision.votes_cast + 1,
              votes_for: voteForm.vote === 'for' ? decision.votes_for + 1 : decision.votes_for,
              votes_against: voteForm.vote === 'against' ? decision.votes_against + 1 : decision.votes_against,
              abstentions: voteForm.vote === 'abstain' ? decision.abstentions + 1 : decision.abstentions,
              status: 'voting' as const
            }
          : decision
      );
      
      setConsensusDecisions(updatedDecisions);
      setShowVotingModal(false);
      setVoteForm({
        vote: '',
        comments: ''
      });
      
      alert('Vote cast successfully!');
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Failed to cast vote. Please try again.');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedSettings: GroupConsensusSettings = {
        group_id: selectedGroup!.id,
        quorum_percentage: settingsForm.quorum_percentage,
        majority_percentage: settingsForm.majority_percentage,
        voting_duration_days: settingsForm.voting_duration_days,
        allow_abstentions: settingsForm.allow_abstentions,
        require_leadership_approval: settingsForm.require_leadership_approval,
        auto_approve_threshold: settingsForm.auto_approve_threshold,
        notification_settings: {
          email_notifications: settingsForm.email_notifications,
          sms_notifications: settingsForm.sms_notifications,
          push_notifications: settingsForm.push_notifications
        }
      };
      
      setConsensusSettings(updatedSettings);
      setShowSettingsModal(false);
      
      alert('Consensus settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  const startVoting = async (decisionId: string) => {
    try {
      const updatedDecisions = consensusDecisions.map(decision =>
        decision.id === decisionId
          ? { ...decision, status: 'voting' as const }
          : decision
      );
      
      setConsensusDecisions(updatedDecisions);
      alert('Voting started successfully!');
    } catch (error) {
      console.error('Error starting voting:', error);
      alert('Failed to start voting. Please try again.');
    }
  };

  const finalizeDecision = async (decisionId: string) => {
    try {
      const decision = consensusDecisions.find(d => d.id === decisionId);
      if (!decision) return;
      
      const isQuorumMet = decision.votes_cast >= decision.required_quorum;
      const isMajorityMet = decision.votes_for > decision.votes_against;
      
      let newStatus: 'approved' | 'rejected' = 'rejected';
      let decisionResult = 'Decision rejected - insufficient votes';
      
      if (isQuorumMet && isMajorityMet) {
        newStatus = 'approved';
        decisionResult = 'Decision approved by group consensus';
      } else if (isQuorumMet && !isMajorityMet) {
        decisionResult = 'Decision rejected - majority against';
      } else {
        decisionResult = 'Decision rejected - quorum not met';
      }
      
      const updatedDecisions = consensusDecisions.map(d =>
        d.id === decisionId
          ? {
              ...d,
              status: newStatus,
              decision_result: decisionResult,
              implementation_date: newStatus === 'approved' ? new Date().toISOString().split('T')[0] : undefined
            }
          : d
      );
      
      setConsensusDecisions(updatedDecisions);
      alert(`Decision ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error finalizing decision:', error);
      alert('Failed to finalize decision. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'voting': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'loan_approval': return 'text-green-600 bg-green-100';
      case 'member_expulsion': return 'text-red-600 bg-red-100';
      case 'rule_change': return 'text-blue-600 bg-blue-100';
      case 'fund_utilization': return 'text-purple-600 bg-purple-100';
      case 'meeting_schedule': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateVotingProgress = (decision: ConsensusDecision) => {
    const quorumProgress = (decision.votes_cast / decision.required_quorum) * 100;
    const majorityProgress = decision.votes_cast > 0 ? (decision.votes_for / decision.votes_cast) * 100 : 0;
    
    return {
      quorumProgress: Math.min(quorumProgress, 100),
      majorityProgress: Math.min(majorityProgress, 100),
      isQuorumMet: decision.votes_cast >= decision.required_quorum,
      isMajorityMet: decision.votes_for > decision.votes_against
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Group Consensus Workflow...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Consensus Workflow</h1>
            <p className="text-gray-600">Manage group decision-making and voting processes</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
            <button
              onClick={() => setShowCreateDecision(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Propose Decision
            </button>
          </div>
        </div>

        {/* Group Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Group</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  loadConsensusData(group.id);
                  loadGroupMembers(group.id);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedGroup?.id === group.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <h4 className="font-medium text-gray-900">{group.name}</h4>
                <p className="text-sm text-gray-600">{group.total_members} members</p>
                <p className="text-xs text-gray-500 mt-1">
                  Consensus: {consensusSettings?.quorum_percentage}% quorum
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Consensus Decisions */}
        {selectedGroup && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Group Decisions - {selectedGroup.name}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Decision
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voting Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consensusDecisions.map((decision) => {
                    const progress = calculateVotingProgress(decision);
                    
                    return (
                      <tr key={decision.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{decision.title}</div>
                            <div className="text-sm text-gray-500">{decision.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Proposed by {decision.proposed_by} on {formatDate(decision.proposed_date)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDecisionTypeColor(decision.decision_type)}`}>
                            {decision.decision_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Quorum: {decision.votes_cast}/{decision.required_quorum}</span>
                                <span>{progress.quorumProgress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${progress.isQuorumMet ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${progress.quorumProgress}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Majority: {decision.votes_for} for, {decision.votes_against} against</span>
                                <span>{progress.majorityProgress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${progress.isMajorityMet ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${progress.majorityProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(decision.status)}`}>
                            {decision.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(decision.voting_deadline)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {decision.status === 'pending' && (
                              <button
                                onClick={() => startVoting(decision.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Start Voting"
                              >
                                <Vote className="w-4 h-4" />
                              </button>
                            )}
                            {decision.status === 'voting' && (
                              <button
                                onClick={() => {
                                  setSelectedDecision(decision);
                                  setShowVotingModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Cast Vote"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {(decision.status === 'voting' || decision.status === 'pending') && (
                              <button
                                onClick={() => finalizeDecision(decision.id)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Finalize Decision"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedDecision(decision);
                                setShowDecisionDetails(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Decision Modal */}
        {showCreateDecision && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Propose New Decision</h3>
              
              <form onSubmit={handleCreateDecision} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Decision Type *
                  </label>
                  <select
                    value={decisionForm.decision_type}
                    onChange={(e) => setDecisionForm(prev => ({ ...prev, decision_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Decision Type</option>
                    <option value="loan_approval">Loan Approval</option>
                    <option value="member_expulsion">Member Expulsion</option>
                    <option value="rule_change">Rule Change</option>
                    <option value="fund_utilization">Fund Utilization</option>
                    <option value="meeting_schedule">Meeting Schedule</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={decisionForm.title}
                    onChange={(e) => setDecisionForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter decision title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={decisionForm.description}
                    onChange={(e) => setDecisionForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe the decision proposal..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voting Deadline *
                  </label>
                  <input
                    type="date"
                    value={decisionForm.voting_deadline}
                    onChange={(e) => setDecisionForm(prev => ({ ...prev, voting_deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateDecision(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Propose Decision
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Voting Modal */}
        {showVotingModal && selectedDecision && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cast Your Vote - {selectedDecision.title}
              </h3>
              
              <form onSubmit={handleVote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Vote *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="vote"
                        value="for"
                        checked={voteForm.vote === 'for'}
                        onChange={(e) => setVoteForm(prev => ({ ...prev, vote: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">For</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="vote"
                        value="against"
                        checked={voteForm.vote === 'against'}
                        onChange={(e) => setVoteForm(prev => ({ ...prev, vote: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">Against</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="vote"
                        value="abstain"
                        checked={voteForm.vote === 'abstain'}
                        onChange={(e) => setVoteForm(prev => ({ ...prev, vote: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">Abstain</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={voteForm.comments}
                    onChange={(e) => setVoteForm(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add your comments..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowVotingModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Cast Vote
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consensus Settings</h3>
              
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quorum Percentage *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settingsForm.quorum_percentage}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, quorum_percentage: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Majority Percentage *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settingsForm.majority_percentage}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, majority_percentage: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voting Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settingsForm.voting_duration_days}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, voting_duration_days: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsForm.allow_abstentions}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, allow_abstentions: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Allow Abstentions</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsForm.require_leadership_approval}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, require_leadership_approval: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Require Leadership Approval</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-Approve Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settingsForm.auto_approve_threshold}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, auto_approve_threshold: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Notification Settings</h4>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsForm.email_notifications}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, email_notifications: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Email Notifications</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsForm.sms_notifications}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, sms_notifications: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">SMS Notifications</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsForm.push_notifications}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, push_notifications: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Push Notifications</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Update Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Decision Details Modal */}
        {showDecisionDetails && selectedDecision && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Decision Details - {selectedDecision.title}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDecisionTypeColor(selectedDecision.decision_type)}`}>
                      {selectedDecision.decision_type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDecision.status)}`}>
                      {selectedDecision.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{selectedDecision.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed By</label>
                    <p className="text-sm text-gray-900">{selectedDecision.proposed_by}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedDecision.proposed_date)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voting Deadline</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedDecision.voting_deadline)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Date</label>
                    <p className="text-sm text-gray-900">
                      {selectedDecision.implementation_date ? formatDate(selectedDecision.implementation_date) : 'Not implemented'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voting Results</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Members</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedDecision.total_members}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Votes Cast</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedDecision.votes_cast}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">For</p>
                        <p className="text-2xl font-bold text-green-600">{selectedDecision.votes_for}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Against</p>
                        <p className="text-2xl font-bold text-red-600">{selectedDecision.votes_against}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Abstentions</p>
                        <p className="text-2xl font-bold text-gray-600">{selectedDecision.abstentions}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedDecision.decision_result && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decision Result</label>
                    <p className="text-sm text-gray-900">{selectedDecision.decision_result}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDecisionDetails(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupConsensusWorkflow;



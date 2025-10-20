import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Minus, Users, Clock, AlertCircle, User, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { CommitteeVotingService, VotingSummary, CommitteeVote } from '../services/committeeVotingService';
import toast from 'react-hot-toast';

interface CommitteeVotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanApplication: any;
  onDecisionFinalized: () => void;
}

const CommitteeVotingModal: React.FC<CommitteeVotingModalProps> = ({
  isOpen,
  onClose,
  loanApplication,
  onDecisionFinalized
}) => {
  const { language } = useLanguage();
  const { user } = useSupabaseAuth();
  const [votingSummary, setVotingSummary] = useState<VotingSummary | null>(null);
  const [votes, setVotes] = useState<CommitteeVote[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<'approve' | 'reject' | 'abstain' | ''>('');
  const [voteComments, setVoteComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && loanApplication) {
      loadVotingData();
    }
  }, [isOpen, loanApplication]);

  const loadVotingData = async () => {
    if (!loanApplication?.id) return;
    
    setIsLoading(true);
    try {
      // Get voting summary
      const summary = await CommitteeVotingService.getVotingSummary(
        loanApplication.id, 
        user?.id || ''
      );
      setVotingSummary(summary);

      // Get all votes
      const allVotes = await CommitteeVotingService.getVotesForApplication(loanApplication.id);
      setVotes(allVotes);

      // Set user's existing vote
      if (summary?.has_voted) {
        setSelectedDecision(summary.user_vote || '');
        setVoteComments(summary.user_vote_comments || '');
      }
    } catch (error) {
      console.error('Error loading voting data:', error);
      toast.error('Failed to load voting data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedDecision || !loanApplication?.id) return;

    setIsSubmitting(true);
    try {
      const result = await CommitteeVotingService.submitVote(
        loanApplication.id,
        user?.id || '',
        selectedDecision,
        voteComments
      );

      if (result.success) {
        toast.success(result.message);
        await loadVotingData(); // Refresh data
        onDecisionFinalized();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approve': return 'text-green-600 bg-green-100';
      case 'reject': return 'text-red-600 bg-red-100';
      case 'abstain': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approve': return <CheckCircle className="w-4 h-4" />;
      case 'reject': return <XCircle className="w-4 h-4" />;
      case 'abstain': return <Minus className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <Users className="w-6 h-6 mr-3" />
                {language === 'en' ? 'Committee Voting' : 'Kupiga Kura ya Kamati'}
              </h2>
              <p className="text-purple-100 mt-1">
                {language === 'en' ? 'Vote on loan application' : 'Piga kura kwa maombi ya mkopo'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Loan Application Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'en' ? 'Application Details' : 'Maelezo ya Maombi'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">
                  {language === 'en' ? 'Application ID:' : 'Kitambulisho:'}
                </span>
                <span className="ml-2 text-gray-900">
                  {loanApplication?.application_id || `LA-${loanApplication?.id?.slice(-8)}`}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {language === 'en' ? 'Client:' : 'Mteja:'}
                </span>
                <span className="ml-2 text-gray-900">
                  {loanApplication?.clients?.first_name} {loanApplication?.clients?.last_name}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {language === 'en' ? 'Amount:' : 'Kiasi:'}
                </span>
                <span className="ml-2 text-gray-900">
                  TSh {loanApplication?.requested_amount?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {language === 'en' ? 'Purpose:' : 'Dhumuni:'}
                </span>
                <span className="ml-2 text-gray-900">
                  {loanApplication?.loan_purpose}
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-6 h-6 animate-spin mr-2" />
              <span>{language === 'en' ? 'Loading voting data...' : 'Inapakia data ya kura...'}</span>
            </div>
          ) : (
            <>
              {/* Voting Summary */}
              {votingSummary && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {language === 'en' ? 'Voting Summary' : 'Muhtasari wa Kura'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {votingSummary.total_members}
                      </div>
                      <div className="text-blue-700">
                        {language === 'en' ? 'Total Members' : 'Wanachama Wote'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {votingSummary.approve_votes}
                      </div>
                      <div className="text-green-700">
                        {language === 'en' ? 'Approve' : 'Idhinisha'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {votingSummary.reject_votes}
                      </div>
                      <div className="text-red-700">
                        {language === 'en' ? 'Reject' : 'Kataa'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {votingSummary.abstain_votes}
                      </div>
                      <div className="text-yellow-700">
                        {language === 'en' ? 'Abstain' : 'Acha'}

                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        votingSummary.quorum_met ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {votingSummary.quorum_met 
                          ? (language === 'en' ? 'Quorum Met' : 'Quorum Imefikiwa')
                          : (language === 'en' ? 'Quorum Not Met' : 'Quorum Haijafikiwa')
                        }
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {language === 'en' ? 'Votes Remaining:' : 'Kura Zilizobaki:'} {votingSummary.votes_remaining}
                    </div>
                  </div>
                </div>
              )}

              {/* Voting Form */}
              {votingSummary?.can_vote && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {language === 'en' ? 'Cast Your Vote' : 'Piga Kura Yako'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {language === 'en' ? 'Decision' : 'Maamuzi'} *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedDecision === 'approve' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                        }`}>
                          <input
                            type="radio"
                            value="approve"
                            checked={selectedDecision === 'approve'}
                            onChange={(e) => setSelectedDecision(e.target.value as 'approve')}
                            className="sr-only"
                          />
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <span className="font-medium text-green-700">
                              {language === 'en' ? 'Approve' : 'Idhinisha'}
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedDecision === 'reject' 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 hover:border-red-300'
                        }`}>
                          <input
                            type="radio"
                            value="reject"
                            checked={selectedDecision === 'reject'}
                            onChange={(e) => setSelectedDecision(e.target.value as 'reject')}
                            className="sr-only"
                          />
                          <div className="flex items-center">
                            <XCircle className="w-5 h-5 text-red-600 mr-3" />
                            <span className="font-medium text-red-700">
                              {language === 'en' ? 'Reject' : 'Kataa'}
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedDecision === 'abstain' 
                            ? 'border-yellow-500 bg-yellow-50' 
                            : 'border-gray-200 hover:border-yellow-300'
                        }`}>
                          <input
                            type="radio"
                            value="abstain"
                            checked={selectedDecision === 'abstain'}
                            onChange={(e) => setSelectedDecision(e.target.value as 'abstain')}
                            className="sr-only"
                          />
                          <div className="flex items-center">
                            <Minus className="w-5 h-5 text-yellow-600 mr-3" />
                            <span className="font-medium text-yellow-700">
                              {language === 'en' ? 'Abstain' : 'Acha'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'en' ? 'Comments (Optional)' : 'Maoni (Si Lazima)'}
                      </label>
                      <textarea
                        value={voteComments}
                        onChange={(e) => setVoteComments(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={language === 'en' 
                          ? 'Add your comments or justification...' 
                          : 'Ongeza maoni au uthibitisho...'
                        }
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmitVote}
                        disabled={!selectedDecision || isSubmitting}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            {language === 'en' ? 'Submitting...' : 'Inatumwa...'}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'Submit Vote' : 'Tuma Kura'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vote History */}
              {votes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    {language === 'en' ? 'Vote History' : 'Historia ya Kura'}
                  </h3>
                  <div className="space-y-3">
                    {votes.map((vote) => (
                      <div key={vote.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {vote.committee_member?.user?.first_name} {vote.committee_member?.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vote.committee_member?.committee_role} • {new Date(vote.voted_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getDecisionColor(vote.vote_decision)}`}>
                            {getDecisionIcon(vote.vote_decision)}
                            <span className="ml-1 capitalize">{vote.vote_decision}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {votingSummary?.has_voted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">
                        {language === 'en' ? 'You have already voted' : 'Umeshapiga kura'}
                      </div>
                      <div className="text-sm text-green-600">
                        {language === 'en' 
                          ? `Your vote: ${selectedDecision?.toUpperCase()}` 
                          : `Kura yako: ${selectedDecision?.toUpperCase()}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!votingSummary?.can_vote && !votingSummary?.has_voted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                      <div className="font-medium text-yellow-800">
                        {language === 'en' ? 'Voting is not available' : 'Kupiga kura hakipatikani'}
                      </div>
                      <div className="text-sm text-yellow-600">
                        {language === 'en' 
                          ? 'This application may have already been decided or is not ready for voting.' 
                          : 'Maombi haya yameamuliwa au hayajafaa kupigiwa kura.'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {language === 'en' ? 'Close' : 'Funga'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommitteeVotingModal;

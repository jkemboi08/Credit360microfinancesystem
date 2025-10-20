import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { GroupService, Group } from '../services/groupService';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye,
  DollarSign, Users, TrendingUp, FileText, Download, Zap
} from 'lucide-react';

interface GuaranteeVerification {
  id: string;
  group_id: string;
  member_id: string;
  member_name: string;
  verification_type: 'automatic' | 'manual' | 'scheduled';
  verification_status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'expired';
  verification_criteria: string[];
  verification_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  verification_date: string;
  verified_by: string;
  verification_notes: string;
  next_verification_date: string;
}

interface VerificationRule {
  id: string;
  rule_name: string;
  criteria: string;
  weight: number;
  is_active: boolean;
  verification_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

const EnhancedGuaranteeVerification: React.FC = () => {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [verifications, setVerifications] = useState<GuaranteeVerification[]>([]);
  const [verificationRules, setVerificationRules] = useState<VerificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<GuaranteeVerification | null>(null);
  
  // Form states
  const [verificationForm, setVerificationForm] = useState({
    member_id: '',
    verification_type: '',
    verification_notes: ''
  });
  
  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    criteria: '',
    weight: '1',
    verification_frequency: 'monthly'
  });

  useEffect(() => {
    loadGroups();
    loadVerificationRules();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await GroupService.getGroups();
      
      if (result.success && result.data) {
        setGroups(result.data);
        if (result.data.length > 0) {
          setSelectedGroup(result.data[0]);
          loadVerifications(result.data[0].id);
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

  const loadVerifications = async (groupId: string) => {
    try {
      // Mock data - in real app, this would come from Supabase
      const mockVerifications: GuaranteeVerification[] = [
        {
          id: '1',
          group_id: groupId,
          member_id: 'member_1',
          member_name: 'Sarah Mwangi',
          verification_type: 'automatic',
          verification_status: 'verified',
          verification_criteria: ['Income verification', 'Employment status', 'Credit history'],
          verification_score: 85,
          risk_level: 'low',
          verification_date: '2025-01-15',
          verified_by: 'System',
          verification_notes: 'All criteria met successfully',
          next_verification_date: '2025-02-15'
        },
        {
          id: '2',
          group_id: groupId,
          member_id: 'member_2',
          member_name: 'John Kimani',
          verification_type: 'manual',
          verification_status: 'failed',
          verification_criteria: ['Income verification', 'Employment status', 'Credit history'],
          verification_score: 45,
          risk_level: 'high',
          verification_date: '2025-01-14',
          verified_by: 'Staff Member',
          verification_notes: 'Income verification failed, employment status unclear',
          next_verification_date: '2025-01-21'
        }
      ];
      
      setVerifications(mockVerifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
    }
  };

  const loadVerificationRules = async () => {
    try {
      // Mock data - in real app, this would come from Supabase
      const mockRules: VerificationRule[] = [
        {
          id: '1',
          rule_name: 'Income Verification',
          criteria: 'Verify member has stable income source',
          weight: 30,
          is_active: true,
          verification_frequency: 'monthly'
        },
        {
          id: '2',
          rule_name: 'Employment Status',
          criteria: 'Confirm member is employed or has business',
          weight: 25,
          is_active: true,
          verification_frequency: 'monthly'
        },
        {
          id: '3',
          rule_name: 'Credit History',
          criteria: 'Check member credit history and payment behavior',
          weight: 20,
          is_active: true,
          verification_frequency: 'quarterly'
        }
      ];
      
      setVerificationRules(mockRules);
    } catch (error) {
      console.error('Error loading verification rules:', error);
    }
  };

  const handleCreateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newVerification: GuaranteeVerification = {
        id: Date.now().toString(),
        group_id: selectedGroup!.id,
        member_id: verificationForm.member_id,
        member_name: 'Selected Member',
        verification_type: verificationForm.verification_type as any,
        verification_status: 'pending',
        verification_criteria: ['Income verification', 'Employment status'],
        verification_score: 0,
        risk_level: 'medium',
        verification_date: new Date().toISOString().split('T')[0],
        verified_by: 'Current User',
        verification_notes: verificationForm.verification_notes,
        next_verification_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      setVerifications(prev => [newVerification, ...prev]);
      setShowVerificationModal(false);
      setVerificationForm({
        member_id: '',
        verification_type: '',
        verification_notes: ''
      });
      
      alert('Verification created successfully!');
    } catch (error) {
      console.error('Error creating verification:', error);
      alert('Failed to create verification. Please try again.');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newRule: VerificationRule = {
        id: Date.now().toString(),
        rule_name: ruleForm.rule_name,
        criteria: ruleForm.criteria,
        weight: parseInt(ruleForm.weight),
        is_active: true,
        verification_frequency: ruleForm.verification_frequency as any
      };
      
      setVerificationRules(prev => [newRule, ...prev]);
      setShowRuleModal(false);
      setRuleForm({
        rule_name: '',
        criteria: '',
        weight: '1',
        verification_frequency: 'monthly'
      });
      
      alert('Verification rule created successfully!');
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule. Please try again.');
    }
  };

  const runAutomaticVerification = async () => {
    try {
      // Mock automatic verification - in real app, this would run verification rules
      const verificationSteps = [
        'Scanning group members for verification requirements',
        'Applying verification rules automatically',
        'Calculating verification scores',
        'Updating risk levels',
        'Scheduling next verifications'
      ];
      
      console.log('Running automatic verification:', verificationSteps);
      
      setTimeout(() => {
        alert('Automatic verification completed! 5 members verified, 2 require manual review.');
      }, 3000);
    } catch (error) {
      console.error('Error running automatic verification:', error);
      alert('Failed to run automatic verification. Please try again.');
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
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'verified': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Guarantee Verification...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Guarantee Verification</h1>
            <p className="text-gray-600">Automated guarantee verification and risk assessment</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={runAutomaticVerification}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              Run Auto Verification
            </button>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Verification
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
                  loadVerifications(group.id);
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
                  Guarantee: {new Intl.NumberFormat('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0
                  }).format(group.current_guarantee_balance)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Verifications List */}
        {selectedGroup && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Verifications - {selectedGroup.name}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{verification.member_name}</div>
                          <div className="text-sm text-gray-500">ID: {verification.member_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            Type: {verification.verification_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            Date: {formatDate(verification.verification_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            By: {verification.verified_by}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-2xl font-bold text-gray-900">
                          {verification.verification_score}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              verification.verification_score >= 80 ? 'bg-green-500' :
                              verification.verification_score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${verification.verification_score}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(verification.risk_level)}`}>
                          {verification.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(verification.verification_status)}`}>
                          {verification.verification_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedVerification(verification)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verification Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Verification Rules</h3>
              <button
                onClick={() => setShowRuleModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                Add Rule
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criteria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verificationRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.rule_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.criteria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.weight}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.verification_frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.is_active ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Verification Modal */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Verification</h3>
              
              <form onSubmit={handleCreateVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member ID *
                  </label>
                  <input
                    type="text"
                    value={verificationForm.member_id}
                    onChange={(e) => setVerificationForm(prev => ({ ...prev, member_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter member ID"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Type *
                  </label>
                  <select
                    value={verificationForm.verification_type}
                    onChange={(e) => setVerificationForm(prev => ({ ...prev, verification_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={verificationForm.verification_notes}
                    onChange={(e) => setVerificationForm(prev => ({ ...prev, verification_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add verification notes..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowVerificationModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Verification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Rule Modal */}
        {showRuleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Verification Rule</h3>
              
              <form onSubmit={handleCreateRule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={ruleForm.rule_name}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, rule_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter rule name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criteria *
                  </label>
                  <textarea
                    value={ruleForm.criteria}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, criteria: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe verification criteria..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={ruleForm.weight}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={ruleForm.verification_frequency}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, verification_frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Create Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EnhancedGuaranteeVerification;





































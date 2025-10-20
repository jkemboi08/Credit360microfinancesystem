import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { GroupService, Group, GroupMember } from '../services/groupService';
import { GroupDefaultService } from '../services/groupDefaultService';
import {
  AlertTriangle, Shield, Users, DollarSign, Clock, CheckCircle, XCircle,
  MessageSquare, Phone, Mail, TrendingDown, TrendingUp, RefreshCw,
  Eye, FileText, Download, Send, UserCheck, Ban
} from 'lucide-react';

interface DefaultedMember {
  id: string;
  member_id: string;
  member_name: string;
  phone: string;
  email: string;
  loan_amount: number;
  overdue_amount: number;
  days_overdue: number;
  last_payment_date: string;
  default_date: string;
  group_guarantee_used: number;
  group_impact: 'low' | 'medium' | 'high';
  status: 'active_default' | 'recovering' | 'recovered' | 'expelled';
  recovery_actions: string[];
  next_action_date: string;
}

interface GroupDefaultSummary {
  group_id: string;
  group_name: string;
  total_members: number;
  defaulted_members: number;
  total_defaulted_amount: number;
  group_guarantee_balance: number;
  group_guarantee_used: number;
  group_health_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface RecoveryAction {
  id: string;
  member_id: string;
  action_type: 'phone_call' | 'group_meeting' | 'guarantee_utilization' | 'restructuring' | 'expulsion';
  description: string;
  scheduled_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  result: string;
  created_by: string;
  created_at: string;
}

const GroupDefaultManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [defaultedMembers, setDefaultedMembers] = useState<DefaultedMember[]>([]);
  const [groupSummary, setGroupSummary] = useState<GroupDefaultSummary | null>(null);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<DefaultedMember | null>(null);
  const [showGroupNotification, setShowGroupNotification] = useState(false);
  const [showExpulsionModal, setShowExpulsionModal] = useState(false);
  
  // Form states
  const [recoveryForm, setRecoveryForm] = useState({
    action_type: '',
    description: '',
    scheduled_date: '',
    priority: 'medium'
  });
  
  const [notificationForm, setNotificationForm] = useState({
    subject: '',
    message: '',
    send_to: 'all_members' as 'all_members' | 'leadership_only' | 'defaulted_members'
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
          loadDefaultData(result.data[0].id);
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

  const loadDefaultData = async (groupId: string) => {
    try {
      const [membersResult, summaryResult] = await Promise.all([
        GroupDefaultService.getDefaultedMembers(groupId),
        GroupDefaultService.getGroupDefaultSummary(groupId)
      ]);
      
      if (membersResult.success && membersResult.data) {
        setDefaultedMembers(membersResult.data);
      } else {
        setError(membersResult.error || 'Failed to load defaulted members');
        setDefaultedMembers([]);
      }
      
      if (summaryResult.success && summaryResult.data) {
        setGroupSummary(summaryResult.data);
      } else {
        setError(summaryResult.error || 'Failed to load group summary');
      }
    } catch (error) {
      console.error('Error loading default data:', error);
      setError('Failed to load default data');
      setDefaultedMembers([]);
    }
  };

  const loadDefaultDataMock = async (groupId: string) => {
    try {
      // Mock data - fallback when no real data available
      const mockDefaultedMembers: DefaultedMember[] = [
        {
          id: '1',
          member_id: 'member_1',
          member_name: 'Sarah Mwangi',
          phone: '+255 712 345 678',
          email: 'sarah.mwangi@email.com',
          loan_amount: 500000,
          overdue_amount: 125000,
          days_overdue: 15,
          last_payment_date: '2025-01-01',
          default_date: '2025-01-16',
          group_guarantee_used: 50000,
          group_impact: 'medium',
          status: 'active_default',
          recovery_actions: ['phone_call', 'group_meeting'],
          next_action_date: '2025-01-20'
        },
        {
          id: '2',
          member_id: 'member_2',
          member_name: 'John Kimani',
          phone: '+255 765 987 654',
          email: 'john.kimani@email.com',
          loan_amount: 800000,
          overdue_amount: 200000,
          days_overdue: 30,
          last_payment_date: '2024-12-15',
          default_date: '2025-01-15',
          group_guarantee_used: 100000,
          group_impact: 'high',
          status: 'recovering',
          recovery_actions: ['phone_call', 'group_meeting', 'restructuring'],
          next_action_date: '2025-01-18'
        }
      ];
      
      const mockGroupSummary: GroupDefaultSummary = {
        group_id: groupId,
        group_name: 'Women Entrepreneurs Group',
        total_members: 8,
        defaulted_members: 2,
        total_defaulted_amount: 325000,
        group_guarantee_balance: 1800000,
        group_guarantee_used: 150000,
        group_health_score: 75,
        risk_level: 'medium'
      };
      
      const mockRecoveryActions: RecoveryAction[] = [
        {
          id: '1',
          member_id: 'member_1',
          action_type: 'phone_call',
          description: 'Call member to discuss payment plan',
          scheduled_date: '2025-01-20',
          status: 'pending',
          result: '',
          created_by: 'staff_1',
          created_at: '2025-01-15T10:00:00Z'
        },
        {
          id: '2',
          member_id: 'member_2',
          action_type: 'group_meeting',
          description: 'Discuss member situation in group meeting',
          scheduled_date: '2025-01-18',
          status: 'completed',
          result: 'Member agreed to restructure loan',
          created_by: 'staff_1',
          created_at: '2025-01-10T10:00:00Z'
        }
      ];
      
      setDefaultedMembers(mockDefaultedMembers);
      setGroupSummary(mockGroupSummary);
      setRecoveryActions(mockRecoveryActions);
    } catch (error) {
      console.error('Error loading default data:', error);
    }
  };

  const handleRecoveryAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember) return;
    
    try {
      const newAction: RecoveryAction = {
        id: Date.now().toString(),
        member_id: selectedMember.member_id,
        action_type: recoveryForm.action_type as any,
        description: recoveryForm.description,
        scheduled_date: recoveryForm.scheduled_date,
        status: 'pending',
        result: '',
        created_by: 'current_user',
        created_at: new Date().toISOString()
      };
      
      setRecoveryActions(prev => [newAction, ...prev]);
      setShowRecoveryModal(false);
      setRecoveryForm({
        action_type: '',
        description: '',
        scheduled_date: '',
        priority: 'medium'
      });
      
      alert('Recovery action scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling recovery action:', error);
      alert('Failed to schedule recovery action. Please try again.');
    }
  };

  const handleGroupNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Mock notification sending - in real app, this would send actual notifications
      const notificationSteps = [
        'Preparing group notification',
        'Sending SMS to group members',
        'Sending email notifications',
        'Updating group communication log'
      ];
      
      console.log('Sending group notification:', notificationSteps);
      
      setTimeout(() => {
        alert('Group notification sent successfully!');
        setShowGroupNotification(false);
        setNotificationForm({
          subject: '',
          message: '',
          send_to: 'all_members'
        });
      }, 2000);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleMemberExpulsion = async () => {
    if (!selectedMember) return;
    
    try {
      const updatedMembers = defaultedMembers.map(member =>
        member.id === selectedMember.id
          ? { ...member, status: 'expelled' as const }
          : member
      );
      
      setDefaultedMembers(updatedMembers);
      setShowExpulsionModal(false);
      setSelectedMember(null);
      
      alert('Member expelled from group successfully!');
    } catch (error) {
      console.error('Error expelling member:', error);
      alert('Failed to expel member. Please try again.');
    }
  };

  const handleGuaranteeUtilization = async (memberId: string) => {
    try {
      const member = defaultedMembers.find(m => m.id === memberId);
      if (!member) return;
      
      // Mock guarantee utilization - in real app, this would update the database
      const updatedMembers = defaultedMembers.map(m =>
        m.id === memberId
          ? {
              ...m,
              group_guarantee_used: m.group_guarantee_used + m.overdue_amount,
              status: 'recovering' as const
            }
          : m
      );
      
      setDefaultedMembers(updatedMembers);
      alert('Group guarantee utilized successfully!');
    } catch (error) {
      console.error('Error utilizing guarantee:', error);
      alert('Failed to utilize guarantee. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active_default': return 'text-red-600 bg-red-100';
      case 'recovering': return 'text-yellow-600 bg-yellow-100';
      case 'recovered': return 'text-green-600 bg-green-100';
      case 'expelled': return 'text-gray-600 bg-gray-100';
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
            <p className="text-gray-600">Loading Default Management...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Group Default Management</h1>
            <p className="text-gray-600">Manage group defaults and recovery actions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowGroupNotification(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Notify Group
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
                  loadDefaultData(group.id);
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
                  Guarantee: {formatCurrency(group.current_guarantee_balance)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Group Summary */}
        {groupSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{groupSummary.total_members}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Defaulted Members</p>
                  <p className="text-2xl font-bold text-gray-900">{groupSummary.defaulted_members}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Defaulted Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(groupSummary.total_defaulted_amount)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Group Health</p>
                  <p className="text-2xl font-bold text-gray-900">{groupSummary.group_health_score}%</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getRiskColor(groupSummary.risk_level)}`}>
                    {groupSummary.risk_level}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Defaulted Members */}
        {selectedGroup && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Defaulted Members - {selectedGroup.name}
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
                      Loan Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overdue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Impact
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
                  {defaultedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.member_name}</div>
                          <div className="text-sm text-gray-500">{member.phone}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            Loan: {formatCurrency(member.loan_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Last Payment: {formatDate(member.last_payment_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-red-600">
                            {formatCurrency(member.overdue_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.days_overdue} days overdue
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getImpactColor(member.group_impact)}`}>
                            {member.group_impact}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            Guarantee Used: {formatCurrency(member.group_guarantee_used)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                          {member.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRecoveryModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Schedule Recovery Action"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleGuaranteeUtilization(member.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Utilize Group Guarantee"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowExpulsionModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Expel Member"
                          >
                            <Ban className="w-4 h-4" />
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

        {/* Recovery Actions */}
        {recoveryActions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recovery Actions</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recoveryActions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {action.action_type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">{action.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {defaultedMembers.find(m => m.member_id === action.member_id)?.member_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(action.scheduled_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          action.status === 'completed' ? 'text-green-600 bg-green-100' :
                          action.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                          'text-gray-600 bg-gray-100'
                        }`}>
                          {action.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {action.result || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recovery Action Modal */}
        {showRecoveryModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Schedule Recovery Action - {selectedMember.member_name}
              </h3>
              
              <form onSubmit={handleRecoveryAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type *
                  </label>
                  <select
                    value={recoveryForm.action_type}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, action_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Action Type</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="group_meeting">Group Meeting</option>
                    <option value="guarantee_utilization">Guarantee Utilization</option>
                    <option value="restructuring">Loan Restructuring</option>
                    <option value="expulsion">Member Expulsion</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={recoveryForm.description}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe the recovery action..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={recoveryForm.scheduled_date}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule Action
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Notification Modal */}
        {showGroupNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Send Group Notification
              </h3>
              
              <form onSubmit={handleGroupNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Send To *
                  </label>
                  <select
                    value={notificationForm.send_to}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, send_to: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="all_members">All Members</option>
                    <option value="leadership_only">Leadership Only</option>
                    <option value="defaulted_members">Defaulted Members Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={notificationForm.subject}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification subject"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Enter notification message..."
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowGroupNotification(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member Expulsion Modal */}
        {showExpulsionModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Expel Member - {selectedMember.member_name}
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <h4 className="font-medium text-red-800">Warning</h4>
                    <p className="text-sm text-red-700">
                      This action will permanently expel the member from the group. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Member:</strong> {selectedMember.member_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Overdue Amount:</strong> {formatCurrency(selectedMember.overdue_amount)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Days Overdue:</strong> {selectedMember.days_overdue}
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExpulsionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMemberExpulsion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Expel Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupDefaultManagement;



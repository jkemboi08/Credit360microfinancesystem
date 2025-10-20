import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DateUtils } from '../utils/dateUtils';
import Layout from '../components/Layout';
import {
  ArrowLeft, User, Users, DollarSign, Calendar, Clock,
  CheckCircle, AlertTriangle, MessageSquare, Eye, TrendingUp,
  Shield, FileText, Download, RefreshCw
} from 'lucide-react';

interface RepaymentEntry {
  id: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidDate: string;
  status: 'paid' | 'overdue' | 'pending';
  groupGuaranteeImpact: boolean;
  groupGuaranteeAmount: number;
  lateFee: number;
}

interface GroupInfo {
  id: string;
  name: string;
  totalMembers: number;
  groupLeader: string;
  collectiveGuaranteeBalance: number;
  groupStatus: 'active' | 'inactive' | 'suspended';
}

interface LoanDetails {
  id: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  disbursementDate: string;
  maturityDate: string;
  currentBalance: number;
  monthlyPayment: number;
  totalPaid: number;
  status: 'active' | 'completed' | 'overdue' | 'defaulted';
  calculationMethod: string;
  managementFeeRate: number;
}

const IndividualGroupLoanPage: React.FC = () => {
  const { memberId, groupId } = useParams<{ memberId: string; groupId: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<any>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [repaymentHistory, setRepaymentHistory] = useState<RepaymentEntry[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Mock data
  useEffect(() => {
    const mockMember = {
      id: memberId,
      name: 'Sarah Mwangi',
      phone: '+255 712 345 678',
      email: 'sarah.mwangi@email.com',
      role: 'leader',
      profileComplete: true
    };

    const mockGroupInfo: GroupInfo = {
      id: groupId || '1',
      name: 'Women Entrepreneurs Group',
      totalMembers: 8,
      groupLeader: 'Sarah Mwangi',
      collectiveGuaranteeBalance: 1800000,
      groupStatus: 'active'
    };

    const mockLoanDetails: LoanDetails = {
      id: 'LOAN-001',
      principalAmount: 1500000,
      interestRate: 3.5,
      termMonths: 12,
      disbursementDate: '2024-01-15',
      maturityDate: '2025-01-15',
      currentBalance: 1200000,
      monthlyPayment: 125000,
      totalPaid: 300000,
      status: 'active',
      calculationMethod: 'reducing_balance',
      managementFeeRate: 2.0
    };

    const mockRepaymentHistory: RepaymentEntry[] = [
      {
        id: '1',
        dueDate: DateUtils.addDaysToCurrent(-30).split('T')[0],
        amount: 125000,
        paidAmount: 125000,
        paidDate: DateUtils.addDaysToCurrent(-31).split('T')[0],
        status: 'paid',
        groupGuaranteeImpact: false,
        groupGuaranteeAmount: 0,
        lateFee: 0
      },
      {
        id: '2',
        dueDate: DateUtils.addDaysToCurrent(-15).split('T')[0],
        amount: 125000,
        paidAmount: 125000,
        paidDate: DateUtils.addDaysToCurrent(-15).split('T')[0],
        status: 'paid',
        groupGuaranteeImpact: false,
        groupGuaranteeAmount: 0,
        lateFee: 0
      },
      {
        id: '3',
        dueDate: DateUtils.addDaysToCurrent(5).split('T')[0],
        amount: 125000,
        paidAmount: 0,
        paidDate: '',
        status: 'overdue',
        groupGuaranteeImpact: true,
        groupGuaranteeAmount: 50000,
        lateFee: 2500
      }
    ];

    setMember(mockMember);
    setGroupInfo(mockGroupInfo);
    setLoanDetails(mockLoanDetails);
    setRepaymentHistory(mockRepaymentHistory);
  }, [memberId, groupId]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'defaulted': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleSendMessageSubmit = () => {
    // Send message to group leader
    console.log('Sending message:', messageText);
    setShowMessageModal(false);
    setMessageText('');
  };

  const handleViewGroup = () => {
    navigate(`/group-management`);
  };

  if (!member || !groupInfo || !loanDetails) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading member details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-gray-600">Individual Loan within Group Context</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleViewGroup}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              View Group
            </button>
            <button
              onClick={handleSendMessage}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </button>
          </div>
        </div>

        {/* Group Status Link */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900">Group Membership Status</h3>
                <p className="text-blue-700">
                  Member of <strong>{groupInfo.name}</strong> • {groupInfo.totalMembers} members • 
                  {member.role === 'leader' ? ' Group Leader' : ' Member'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Collective Guarantee Balance</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(groupInfo.collectiveGuaranteeBalance)}</p>
            </div>
          </div>
        </div>

        {/* Loan Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Principal Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loanDetails.principalAmount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loanDetails.currentBalance)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Monthly Payment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loanDetails.monthlyPayment)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loanDetails.totalPaid)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Interest Rate</p>
              <p className="text-lg font-semibold text-gray-900">{loanDetails.interestRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Term</p>
              <p className="text-lg font-semibold text-gray-900">{loanDetails.termMonths} months</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Disbursement Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(loanDetails.disbursementDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Maturity Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(loanDetails.maturityDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Calculation Method</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{loanDetails.calculationMethod.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Management Fee Rate</p>
              <p className="text-lg font-semibold text-gray-900">{loanDetails.managementFeeRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loan Status</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loanDetails.status)}`}>
                {loanDetails.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Group Impact</p>
              <p className="text-lg font-semibold text-gray-900">
                {repaymentHistory.some(r => r.groupGuaranteeImpact) ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Repayment History with Group Impact */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Repayment History</h3>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Shows group guarantee impact</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount Due</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Paid Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Paid Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Group Impact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Guarantee Used</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Late Fee</th>
                </tr>
              </thead>
              <tbody>
                {repaymentHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(entry.dueDate)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(entry.amount)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {entry.paidAmount > 0 ? formatCurrency(entry.paidAmount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {entry.paidDate ? formatDate(entry.paidDate) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {entry.groupGuaranteeImpact ? (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">No</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {entry.groupGuaranteeAmount > 0 ? formatCurrency(entry.groupGuaranteeAmount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {entry.lateFee > 0 ? formatCurrency(entry.lateFee) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Group Communication */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Communication</h3>
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-900">Overdue Payment Alert</h4>
                  <p className="text-sm text-yellow-800">
                    This member has an overdue payment that may impact the group's collective guarantee.
                    Consider sending a message to the group leader for peer pressure support.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSendMessage}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message to Group Leader
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Generate Group Report
              </button>
            </div>
          </div>
        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Message to Group Leader</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your message about this member's repayment status..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessageSubmit}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default IndividualGroupLoanPage;




















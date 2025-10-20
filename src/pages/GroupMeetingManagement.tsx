import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { GroupService, Group, GroupMember } from '../services/groupService';
import {
  Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertTriangle,
  Plus, Edit, Trash2, Eye, MessageSquare, Download, RefreshCw,
  FileText, UserCheck, DollarSign, TrendingUp, Shield
} from 'lucide-react';

interface GroupMeeting {
  id: string;
  group_id: string;
  meeting_date: string;
  meeting_time: string;
  location: string;
  total_members: number;
  members_present: number;
  attendance_rate: number;
  agenda: string;
  minutes: string;
  decisions_made: string;
  savings_collected: number;
  loan_repayments_collected: number;
  new_loan_requests: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  created_at: string;
  updated_at: string;
}

interface LoanDecision {
  id: string;
  member_id: string;
  member_name: string;
  loan_amount: number;
  decision: 'approved' | 'rejected' | 'pending';
  votes_for: number;
  votes_against: number;
  comments: string;
  decided_at: string;
}

const GroupMeetingManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Meeting management states
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<GroupMeeting | null>(null);
  const [showLoanDecisions, setShowLoanDecisions] = useState(false);
  const [loanDecisions, setLoanDecisions] = useState<LoanDecision[]>([]);
  
  // Form states
  const [meetingForm, setMeetingForm] = useState({
    meeting_date: '',
    meeting_time: '',
    location: '',
    agenda: '',
    expected_attendance: 0
  });
  
  const [meetingMinutes, setMeetingMinutes] = useState({
    minutes: '',
    decisions_made: '',
    savings_collected: '',
    loan_repayments_collected: '',
    new_loan_requests: '',
    attendance_notes: ''
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
          loadMeetings(result.data[0].id);
          loadGroupMembers(result.data[0].id);
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

  const loadMeetings = async (groupId: string) => {
    try {
      // Mock data - in real app, this would come from Supabase
      const mockMeetings: GroupMeeting[] = [
        {
          id: '1',
          group_id: groupId,
          meeting_date: '2025-01-15',
          meeting_time: '14:00',
          location: 'Community Center, Dar es Salaam',
          total_members: 8,
          members_present: 7,
          attendance_rate: 87.5,
          agenda: 'Review loan applications, collect savings, discuss group performance',
          minutes: 'Meeting discussed 3 new loan applications. All members present agreed on loan approval criteria.',
          decisions_made: 'Approved 2 loan applications, rejected 1 due to insufficient guarantee',
          savings_collected: 150000,
          loan_repayments_collected: 300000,
          new_loan_requests: 3,
          status: 'completed',
          created_at: '2025-01-10T10:00:00Z',
          updated_at: '2025-01-15T16:00:00Z'
        },
        {
          id: '2',
          group_id: groupId,
          meeting_date: '2025-01-22',
          meeting_time: '14:00',
          location: 'Community Center, Dar es Salaam',
          total_members: 8,
          members_present: 0,
          attendance_rate: 0,
          agenda: 'Monthly group review, new member applications',
          minutes: '',
          decisions_made: '',
          savings_collected: 0,
          loan_repayments_collected: 0,
          new_loan_requests: 0,
          status: 'scheduled',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z'
        }
      ];
      
      setMeetings(mockMeetings);
    } catch (error) {
      console.error('Error loading meetings:', error);
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

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Mock meeting creation - in real app, this would save to Supabase
      const newMeeting: GroupMeeting = {
        id: Date.now().toString(),
        group_id: selectedGroup!.id,
        meeting_date: meetingForm.meeting_date,
        meeting_time: meetingForm.meeting_time,
        location: meetingForm.location,
        total_members: groupMembers.length,
        members_present: 0,
        attendance_rate: 0,
        agenda: meetingForm.agenda,
        minutes: '',
        decisions_made: '',
        savings_collected: 0,
        loan_repayments_collected: 0,
        new_loan_requests: 0,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setMeetings(prev => [newMeeting, ...prev]);
      setShowCreateMeeting(false);
      setMeetingForm({
        meeting_date: '',
        meeting_time: '',
        location: '',
        agenda: '',
        expected_attendance: 0
      });
      
      alert('Meeting scheduled successfully!');
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  const handleCompleteMeeting = async (meetingId: string) => {
    try {
      const updatedMeetings = meetings.map(meeting => 
        meeting.id === meetingId 
          ? {
              ...meeting,
              status: 'completed' as const,
              minutes: meetingMinutes.minutes,
              decisions_made: meetingMinutes.decisions_made,
              savings_collected: parseFloat(meetingMinutes.savings_collected) || 0,
              loan_repayments_collected: parseFloat(meetingMinutes.loan_repayments_collected) || 0,
              new_loan_requests: parseInt(meetingMinutes.new_loan_requests) || 0,
              members_present: groupMembers.length, // Mock - in real app, this would be tracked
              attendance_rate: 100 // Mock - in real app, this would be calculated
            }
          : meeting
      );
      
      setMeetings(updatedMeetings);
      setShowMeetingDetails(false);
      setMeetingMinutes({
        minutes: '',
        decisions_made: '',
        savings_collected: '',
        loan_repayments_collected: '',
        new_loan_requests: '',
        attendance_notes: ''
      });
      
      alert('Meeting completed successfully!');
    } catch (error) {
      console.error('Error completing meeting:', error);
      alert('Failed to complete meeting. Please try again.');
    }
  };

  const handleLoanDecision = async (decisionId: string, decision: 'approved' | 'rejected') => {
    try {
      const updatedDecisions = loanDecisions.map(d => 
        d.id === decisionId 
          ? { ...d, decision, decided_at: new Date().toISOString() }
          : d
      );
      
      setLoanDecisions(updatedDecisions);
      alert(`Loan application ${decision} successfully!`);
    } catch (error) {
      console.error('Error making loan decision:', error);
      alert('Failed to make decision. Please try again.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'postponed': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Group Meetings...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Group Meeting Management</h1>
            <p className="text-gray-600">Schedule and manage group meetings, record decisions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateMeeting(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
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
                  loadMeetings(group.id);
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
                  Guarantee: {formatCurrency(group.current_guarantee_balance)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Meetings List */}
        {selectedGroup && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Meetings - {selectedGroup.name}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
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
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(meeting.meeting_date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {meeting.meeting_time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{meeting.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {meeting.members_present}/{meeting.total_members}
                            </div>
                            <div className="text-sm text-gray-500">
                              {meeting.attendance_rate}% attendance
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setShowMeetingDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {meeting.status === 'scheduled' && (
                            <button
                              onClick={() => {
                                setSelectedMeeting(meeting);
                                setShowMeetingDetails(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Meeting</h3>
              
              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    value={meetingForm.meeting_date}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, meeting_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Time *
                  </label>
                  <input
                    type="time"
                    value={meetingForm.meeting_time}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={meetingForm.location}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter meeting location"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agenda
                  </label>
                  <textarea
                    value={meetingForm.agenda}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter meeting agenda"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateMeeting(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Meeting Details Modal */}
        {showMeetingDetails && selectedMeeting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Meeting Details - {formatDate(selectedMeeting.meeting_date)}
              </h3>
              
              {selectedMeeting.status === 'scheduled' ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Complete Meeting</h4>
                    <p className="text-sm text-yellow-700">
                      Record meeting minutes and decisions to complete this meeting.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Minutes
                    </label>
                    <textarea
                      value={meetingMinutes.minutes}
                      onChange={(e) => setMeetingMinutes(prev => ({ ...prev, minutes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Record meeting minutes..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Decisions Made
                    </label>
                    <textarea
                      value={meetingMinutes.decisions_made}
                      onChange={(e) => setMeetingMinutes(prev => ({ ...prev, decisions_made: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Record decisions made..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Savings Collected (TZS)
                      </label>
                      <input
                        type="number"
                        value={meetingMinutes.savings_collected}
                        onChange={(e) => setMeetingMinutes(prev => ({ ...prev, savings_collected: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loan Repayments Collected (TZS)
                      </label>
                      <input
                        type="number"
                        value={meetingMinutes.loan_repayments_collected}
                        onChange={(e) => setMeetingMinutes(prev => ({ ...prev, loan_repayments_collected: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Loan Requests
                    </label>
                    <input
                      type="number"
                      value={meetingMinutes.new_loan_requests}
                      onChange={(e) => setMeetingMinutes(prev => ({ ...prev, new_loan_requests: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowMeetingDetails(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCompleteMeeting(selectedMeeting.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Complete Meeting
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedMeeting.meeting_date)} at {selectedMeeting.meeting_time}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <p className="text-sm text-gray-900">{selectedMeeting.location}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
                    <p className="text-sm text-gray-900">
                      {selectedMeeting.members_present}/{selectedMeeting.total_members} members ({selectedMeeting.attendance_rate}%)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
                    <p className="text-sm text-gray-900">{selectedMeeting.agenda}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                    <p className="text-sm text-gray-900">{selectedMeeting.minutes}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decisions Made</label>
                    <p className="text-sm text-gray-900">{selectedMeeting.decisions_made}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Savings Collected</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedMeeting.savings_collected)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Repayments Collected</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedMeeting.loan_repayments_collected)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Loan Requests</label>
                      <p className="text-sm text-gray-900">{selectedMeeting.new_loan_requests}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowMeetingDetails(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupMeetingManagement;





































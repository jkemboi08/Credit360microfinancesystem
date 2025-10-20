import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { GroupService, Group } from '../services/groupService';
import {
  MessageSquare, Bell, Users, AlertTriangle, CheckCircle, Clock,
  Send, RefreshCw, Eye, FileText, Download, TrendingUp, Shield
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'reminder' | 'warning' | 'celebration' | 'alert';
  subject: string;
  message: string;
  trigger_condition: string;
  is_active: boolean;
  created_at: string;
}

interface GroupNotification {
  id: string;
  group_id: string;
  template_id: string;
  recipient_type: 'all_members' | 'leadership' | 'defaulted_members' | 'specific_members';
  recipients: string[];
  subject: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_date: string;
  sent_date?: string;
  delivery_method: 'email' | 'sms' | 'push' | 'all';
  created_by: string;
  created_at: string;
}

interface PeerPressureCampaign {
  id: string;
  group_id: string;
  campaign_name: string;
  objective: string;
  target_members: string[];
  notification_sequence: string[];
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  effectiveness_score: number;
  created_by: string;
  created_at: string;
}

const PeerPressureMechanisms: React.FC = () => {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [groupNotifications, setGroupNotifications] = useState<GroupNotification[]>([]);
  const [peerPressureCampaigns, setPeerPressureCampaigns] = useState<PeerPressureCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  
  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: '',
    subject: '',
    message: '',
    trigger_condition: ''
  });
  
  const [notificationForm, setNotificationForm] = useState({
    template_id: '',
    recipient_type: 'all_members',
    recipients: '',
    scheduled_date: '',
    delivery_method: 'all'
  });
  
  const [campaignForm, setCampaignForm] = useState({
    campaign_name: '',
    objective: '',
    target_members: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadGroups();
    loadNotificationTemplates();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await GroupService.getGroups();
      
      if (result.success && result.data) {
        setGroups(result.data);
        if (result.data.length > 0) {
          setSelectedGroup(result.data[0]);
          loadGroupData(result.data[0].id);
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

  const loadGroupData = async (groupId: string) => {
    try {
      // Mock data - in real app, this would come from Supabase
      const mockNotifications: GroupNotification[] = [
        {
          id: '1',
          group_id: groupId,
          template_id: 'template_1',
          recipient_type: 'all_members',
          recipients: ['member_1', 'member_2', 'member_3'],
          subject: 'Monthly Meeting Reminder',
          message: 'Don\'t forget our monthly meeting tomorrow at 2 PM. Your attendance is important for group success!',
          status: 'sent',
          scheduled_date: '2025-01-15T14:00:00Z',
          sent_date: '2025-01-15T14:00:00Z',
          delivery_method: 'all',
          created_by: 'staff_1',
          created_at: '2025-01-15T10:00:00Z'
        },
        {
          id: '2',
          group_id: groupId,
          template_id: 'template_2',
          recipient_type: 'defaulted_members',
          recipients: ['member_2'],
          subject: 'Payment Reminder - Urgent',
          message: 'Your payment is overdue. Please contact us immediately to avoid group guarantee utilization.',
          status: 'scheduled',
          scheduled_date: '2025-01-20T09:00:00Z',
          delivery_method: 'sms',
          created_by: 'staff_1',
          created_at: '2025-01-16T10:00:00Z'
        }
      ];
      
      const mockCampaigns: PeerPressureCampaign[] = [
        {
          id: '1',
          group_id: groupId,
          campaign_name: 'Payment Recovery Campaign',
          objective: 'Encourage timely payments through peer pressure',
          target_members: ['member_2', 'member_3'],
          notification_sequence: ['reminder_1', 'warning_1', 'group_notification'],
          start_date: '2025-01-15',
          end_date: '2025-01-30',
          status: 'active',
          effectiveness_score: 75,
          created_by: 'staff_1',
          created_at: '2025-01-15T10:00:00Z'
        }
      ];
      
      setGroupNotifications(mockNotifications);
      setPeerPressureCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  };

  const loadNotificationTemplates = async () => {
    try {
      // Mock data - in real app, this would come from Supabase
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Payment Reminder',
          type: 'reminder',
          subject: 'Payment Due Soon',
          message: 'Your payment is due in 3 days. Please ensure timely payment to maintain group harmony.',
          trigger_condition: 'payment_due_3_days',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Payment Warning',
          type: 'warning',
          subject: 'Payment Overdue - Action Required',
          message: 'Your payment is overdue. Group members are concerned. Please contact us immediately.',
          trigger_condition: 'payment_overdue_7_days',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Group Achievement',
          type: 'celebration',
          subject: 'Congratulations! Group Goal Achieved',
          message: 'Great job! Our group has achieved 100% repayment rate this month. Keep up the excellent work!',
          trigger_condition: 'group_100_percent_repayment',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        }
      ];
      
      setNotificationTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newTemplate: NotificationTemplate = {
        id: Date.now().toString(),
        name: templateForm.name,
        type: templateForm.type as any,
        subject: templateForm.subject,
        message: templateForm.message,
        trigger_condition: templateForm.trigger_condition,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      setNotificationTemplates(prev => [newTemplate, ...prev]);
      setShowTemplateModal(false);
      setTemplateForm({
        name: '',
        type: '',
        subject: '',
        message: '',
        trigger_condition: ''
      });
      
      alert('Notification template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newNotification: GroupNotification = {
        id: Date.now().toString(),
        group_id: selectedGroup!.id,
        template_id: notificationForm.template_id,
        recipient_type: notificationForm.recipient_type as any,
        recipients: notificationForm.recipients.split(',').map(r => r.trim()),
        subject: 'Notification Subject', // In real app, this would come from template
        message: 'Notification message', // In real app, this would come from template
        status: 'scheduled',
        scheduled_date: notificationForm.scheduled_date,
        delivery_method: notificationForm.delivery_method as any,
        created_by: 'current_user',
        created_at: new Date().toISOString()
      };
      
      setGroupNotifications(prev => [newNotification, ...prev]);
      setShowNotificationModal(false);
      setNotificationForm({
        template_id: '',
        recipient_type: 'all_members',
        recipients: '',
        scheduled_date: '',
        delivery_method: 'all'
      });
      
      alert('Notification scheduled successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newCampaign: PeerPressureCampaign = {
        id: Date.now().toString(),
        group_id: selectedGroup!.id,
        campaign_name: campaignForm.campaign_name,
        objective: campaignForm.objective,
        target_members: campaignForm.target_members.split(',').map(m => m.trim()),
        notification_sequence: ['reminder_1', 'warning_1', 'group_notification'],
        start_date: campaignForm.start_date,
        end_date: campaignForm.end_date,
        status: 'draft',
        effectiveness_score: 0,
        created_by: 'current_user',
        created_at: new Date().toISOString()
      };
      
      setPeerPressureCampaigns(prev => [newCampaign, ...prev]);
      setShowCampaignModal(false);
      setCampaignForm({
        campaign_name: '',
        objective: '',
        target_members: '',
        start_date: '',
        end_date: ''
      });
      
      alert('Peer pressure campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  const sendBulkNotification = async () => {
    try {
      // Mock bulk notification - in real app, this would send actual notifications
      const notificationSteps = [
        'Preparing bulk notification',
        'Sending to all group members',
        'Updating delivery status',
        'Generating delivery report'
      ];
      
      console.log('Sending bulk notification:', notificationSteps);
      
      setTimeout(() => {
        alert('Bulk notification sent successfully! 8 members notified.');
      }, 2000);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      alert('Failed to send bulk notification. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-red-600 bg-red-100';
      case 'celebration': return 'text-green-600 bg-green-100';
      case 'alert': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Peer Pressure Mechanisms...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Peer Pressure Mechanisms</h1>
            <p className="text-gray-600">Group notification systems and peer pressure campaigns</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={sendBulkNotification}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Bulk Notification
            </button>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Notification
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
                  loadGroupData(group.id);
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

        {/* Notification Templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Notification Templates</h3>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                Add Template
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trigger Condition
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
                {notificationTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.subject}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(template.type)}`}>
                        {template.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.trigger_condition.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.is_active ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Template"
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

        {/* Group Notifications */}
        {selectedGroup && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Group Notifications - {selectedGroup.name}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupNotifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{notification.subject}</div>
                          <div className="text-sm text-gray-500">{notification.message}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {notification.recipient_type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {notification.recipients.length} recipients
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {notification.delivery_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(notification.scheduled_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Peer Pressure Campaigns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Peer Pressure Campaigns</h3>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                Create Campaign
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objective
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effectiveness
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {peerPressureCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.campaign_name}</div>
                        <div className="text-sm text-gray-500">
                          {campaign.start_date} - {campaign.end_date}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.objective}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.target_members.length} members
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {campaign.effectiveness_score}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${campaign.effectiveness_score}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Notification Template</h3>
              
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="reminder">Reminder</option>
                    <option value="warning">Warning</option>
                    <option value="celebration">Celebration</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
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
                    value={templateForm.message}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Enter notification message..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Condition *
                  </label>
                  <input
                    type="text"
                    value={templateForm.trigger_condition}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, trigger_condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., payment_due_3_days"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Notification</h3>
              
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template *
                  </label>
                  <select
                    value={notificationForm.template_id}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, template_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Template</option>
                    {notificationTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients *
                  </label>
                  <select
                    value={notificationForm.recipient_type}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, recipient_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="all_members">All Members</option>
                    <option value="leadership">Leadership Only</option>
                    <option value="defaulted_members">Defaulted Members</option>
                    <option value="specific_members">Specific Members</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method *
                  </label>
                  <select
                    value={notificationForm.delivery_method}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, delivery_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="all">All Methods</option>
                    <option value="email">Email Only</option>
                    <option value="sms">SMS Only</option>
                    <option value="push">Push Notification Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={notificationForm.scheduled_date}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNotificationModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCampaignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Peer Pressure Campaign</h3>
              
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignForm.campaign_name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, campaign_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objective *
                  </label>
                  <textarea
                    value={campaignForm.objective}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, objective: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe campaign objective..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Members (comma-separated IDs)
                  </label>
                  <input
                    type="text"
                    value={campaignForm.target_members}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, target_members: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="member_1, member_2, member_3"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={campaignForm.start_date}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={campaignForm.end_date}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create Campaign
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

export default PeerPressureMechanisms;





































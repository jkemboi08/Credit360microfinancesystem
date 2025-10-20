import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '../hooks/useSupabase';
import { FileUploadService } from '../services/fileUploadService';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Building2,
  Users,
  Shield,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  CreditCard,
  Settings
} from 'lucide-react';

const EmployerGuaranteeSetup: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEmployer, setShowAddEmployer] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [employerToArchive, setEmployerToArchive] = useState<any>(null);
  
  const [newEmployerData, setNewEmployerData] = useState({
    // Employer Registration
    company_name: '',
    registration_number: '',
    tax_identification_number: '',
    legal_structure: '',
    industry_sector: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    registered_address: '',
    physical_address: '',
    website: '',
    
    // HR/Finance Contact
    hr_contact_person: '',
    hr_contact_phone: '',
    hr_contact_email: '',
    finance_contact_person: '',
    finance_contact_phone: '',
    finance_contact_email: '',
    
    // Guarantee Agreement Framework
    guarantee_amount_limit: '',
    salary_deduction_authorized: false,
    default_handling_procedures: '',
    legal_framework: '',
    termination_conditions: '',
    
    // Payroll Integration
    payment_frequency: '',
    automatic_deduction_enabled: false,
    manual_override_allowed: false,
    reporting_frequency: '',
    
    // Employee Verification
    employee_verification_required: true,
    employment_confirmation_required: true,
    salary_verification_required: true,
    job_security_assessment_required: true,
    
    // Document Uploads
    registration_documents_uploaded: false,
    guarantee_agreement_uploaded: false,
    payroll_integration_docs_uploaded: false,
    
    // Status
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'suspended',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<{
    registration_documents?: File;
    guarantee_agreement?: File;
    payroll_integration_docs?: File;
  }>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Fetch employers from Supabase
  const { data: employers = [], loading: employersLoading, error: employersError } = useSupabaseQuery('employer_guarantees', {
    orderBy: { column: 'created_at', ascending: false }
  });

  // Hooks for database operations
  const { insert: insertEmployer, loading: insertLoading } = useSupabaseInsert('employer_guarantees');
  const { update: updateEmployer, loading: updateLoading } = useSupabaseUpdate('employer_guarantees');
  const { delete: deleteEmployer, loading: deleteLoading } = useSupabaseDelete('employer_guarantees');

  // File upload handler
  const handleFileSelect = (field: string, file: File | null) => {
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [field]: file }));
      setNewEmployerData(prev => ({ 
        ...prev, 
        [`${field}_uploaded`]: true 
      }));
    }
  };

  // Filter employers based on search term
  const filteredEmployers = employers.filter(employer =>
    employer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.registration_number?.includes(searchTerm)
  );

  const handleAddEmployer = () => {
    setShowAddEmployer(true);
    setIsEditing(false);
    setNewEmployerData({
      company_name: '',
      registration_number: '',
      tax_identification_number: '',
      legal_structure: '',
      industry_sector: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      registered_address: '',
      physical_address: '',
      website: '',
      hr_contact_person: '',
      hr_contact_phone: '',
      hr_contact_email: '',
      finance_contact_person: '',
      finance_contact_phone: '',
      finance_contact_email: '',
      guarantee_amount_limit: '',
      salary_deduction_authorized: false,
      default_handling_procedures: '',
      legal_framework: '',
      termination_conditions: '',
      payment_frequency: '',
      automatic_deduction_enabled: false,
      manual_override_allowed: false,
      reporting_frequency: '',
      employee_verification_required: true,
      employment_confirmation_required: true,
      salary_verification_required: true,
      job_security_assessment_required: true,
      registration_documents_uploaded: false,
      guarantee_agreement_uploaded: false,
      payroll_integration_docs_uploaded: false,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setUploadedFiles({});
  };

  const handleEditEmployer = (employer: any) => {
    setNewEmployerData({
      company_name: employer.company_name || '',
      registration_number: employer.registration_number || '',
      tax_identification_number: employer.tax_identification_number || '',
      legal_structure: employer.legal_structure || '',
      industry_sector: employer.industry_sector || '',
      contact_person: employer.contact_person || '',
      contact_phone: employer.contact_phone || '',
      contact_email: employer.contact_email || '',
      registered_address: employer.registered_address || '',
      physical_address: employer.physical_address || '',
      website: employer.website || '',
      hr_contact_person: employer.hr_contact_person || '',
      hr_contact_phone: employer.hr_contact_phone || '',
      hr_contact_email: employer.hr_contact_email || '',
      finance_contact_person: employer.finance_contact_person || '',
      finance_contact_phone: employer.finance_contact_phone || '',
      finance_contact_email: employer.finance_contact_email || '',
      guarantee_amount_limit: employer.guarantee_amount_limit || '',
      salary_deduction_authorized: employer.salary_deduction_authorized || false,
      default_handling_procedures: employer.default_handling_procedures || '',
      legal_framework: employer.legal_framework || '',
      termination_conditions: employer.termination_conditions || '',
      payment_frequency: employer.payment_frequency || '',
      automatic_deduction_enabled: employer.automatic_deduction_enabled || false,
      manual_override_allowed: employer.manual_override_allowed || false,
      reporting_frequency: employer.reporting_frequency || '',
      employee_verification_required: employer.employee_verification_required || true,
      employment_confirmation_required: employer.employment_confirmation_required || true,
      salary_verification_required: employer.salary_verification_required || true,
      job_security_assessment_required: employer.job_security_assessment_required || true,
      registration_documents_uploaded: employer.registration_documents_uploaded || false,
      guarantee_agreement_uploaded: employer.guarantee_agreement_uploaded || false,
      payroll_integration_docs_uploaded: employer.payroll_integration_docs_uploaded || false,
      status: employer.status || 'pending',
      created_at: employer.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setShowAddEmployer(true);
    setIsEditing(true);
  };

  const handleArchiveEmployer = (employer: any) => {
    setEmployerToArchive(employer);
    setShowArchiveModal(true);
  };

  const confirmArchiveEmployer = async () => {
    if (employerToArchive) {
      try {
        await deleteEmployer(employerToArchive.id);
        toast.success('Employer archived successfully');
        setShowArchiveModal(false);
        setEmployerToArchive(null);
      } catch (error) {
        toast.error('Failed to archive employer');
        console.error('Error archiving employer:', error);
      }
    }
  };

  const handleEmployerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploadingFiles(true);
      
      // Upload files if any
      const fileUrls: any = {};
      for (const [field, file] of Object.entries(uploadedFiles)) {
        if (file) {
          const url = await FileUploadService.uploadFile(file, `employer-guarantees/${field}`);
          fileUrls[`${field}_url`] = url;
        }
      }

      const employerData = {
        ...newEmployerData,
        ...fileUrls,
        updated_at: new Date().toISOString()
      };

      if (isEditing && selectedEmployer) {
        await updateEmployer(selectedEmployer.id, employerData);
        toast.success('Employer updated successfully');
      } else {
        await insertEmployer(employerData);
        toast.success('Employer added successfully');
      }

      setShowAddEmployer(false);
      setSelectedEmployer(null);
      setIsEditing(false);
      setUploadedFiles({});
    } catch (error) {
      toast.error('Failed to save employer');
      console.error('Error saving employer:', error);
    } finally {
      setUploadingFiles(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Employer Guarantee Setup</h1>
          <p className="text-blue-100">
            Manage employer guarantee agreements and payroll integration
          </p>
        </div>

        {/* Search and Add Button */}
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleAddEmployer}
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Employer
          </button>
        </div>

        {/* Employers List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Employer Guarantees</h2>
            
            {employersLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading employers...</span>
              </div>
            ) : employersError ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">Error loading employers: {employersError.message}</p>
              </div>
            ) : filteredEmployers.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No employers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Contact Person</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Industry</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Guarantee Limit</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployers.map((employer) => (
                      <tr key={employer.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{employer.company_name}</div>
                            <div className="text-sm text-gray-500">{employer.registration_number}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{employer.contact_person}</div>
                            <div className="text-sm text-gray-500">{employer.contact_email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{employer.industry_sector}</td>
                        <td className="py-4 px-4 text-gray-700">
                          {employer.guarantee_amount_limit ? `TZS ${parseInt(employer.guarantee_amount_limit).toLocaleString()}` : 'Not set'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employer.status)}`}>
                            {employer.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditEmployer(employer)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleArchiveEmployer(employer)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Employer Modal */}
        {showAddEmployer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Employer' : 'Add New Employer'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddEmployer(false);
                    setIsEditing(false);
                    setSelectedEmployer(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEmployerSubmit} className="space-y-6">
                {/* Employer Registration */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Employer Registration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization Name *</label>
                      <input
                        type="text"
                        required
                        value={newEmployerData.company_name}
                        onChange={(e) => setNewEmployerData({...newEmployerData, company_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                      <input
                        type="text"
                        required
                        value={newEmployerData.registration_number}
                        onChange={(e) => setNewEmployerData({...newEmployerData, registration_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Identification Number *</label>
                      <input
                        type="text"
                        required
                        value={newEmployerData.tax_identification_number}
                        onChange={(e) => setNewEmployerData({...newEmployerData, tax_identification_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Legal Structure *</label>
                      <select
                        required
                        value={newEmployerData.legal_structure}
                        onChange={(e) => setNewEmployerData({...newEmployerData, legal_structure: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Legal Structure</option>
                        <option value="limited_company">Limited Company</option>
                        <option value="partnership">Partnership</option>
                        <option value="ngo">NGO</option>
                        <option value="government">Government Agency</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry/Sector *</label>
                      <input
                        type="text"
                        required
                        value={newEmployerData.industry_sector}
                        onChange={(e) => setNewEmployerData({...newEmployerData, industry_sector: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        value={newEmployerData.website}
                        onChange={(e) => setNewEmployerData({...newEmployerData, website: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={newEmployerData.contact_person}
                        onChange={(e) => setNewEmployerData({...newEmployerData, contact_person: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={newEmployerData.contact_phone}
                        onChange={(e) => setNewEmployerData({...newEmployerData, contact_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={newEmployerData.contact_email}
                        onChange={(e) => setNewEmployerData({...newEmployerData, contact_email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address *</label>
                      <textarea
                        required
                        value={newEmployerData.registered_address}
                        onChange={(e) => setNewEmployerData({...newEmployerData, registered_address: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address *</label>
                      <textarea
                        required
                        value={newEmployerData.physical_address}
                        onChange={(e) => setNewEmployerData({...newEmployerData, physical_address: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* HR/Finance Contact */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    HR/Finance Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HR Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={newEmployerData.hr_contact_person}
                        onChange={(e) => setNewEmployerData({...newEmployerData, hr_contact_person: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HR Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={newEmployerData.hr_contact_phone}
                        onChange={(e) => setNewEmployerData({...newEmployerData, hr_contact_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HR Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={newEmployerData.hr_contact_email}
                        onChange={(e) => setNewEmployerData({...newEmployerData, hr_contact_email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Finance Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={newEmployerData.finance_contact_person}
                        onChange={(e) => setNewEmployerData({...newEmployerData, finance_contact_person: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Finance Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={newEmployerData.finance_contact_phone}
                        onChange={(e) => setNewEmployerData({...newEmployerData, finance_contact_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Finance Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={newEmployerData.finance_contact_email}
                        onChange={(e) => setNewEmployerData({...newEmployerData, finance_contact_email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Guarantee Agreement */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Guarantee Agreement
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Amount Limit *</label>
                      <input
                        type="number"
                        required
                        value={newEmployerData.guarantee_amount_limit}
                        onChange={(e) => setNewEmployerData({...newEmployerData, guarantee_amount_limit: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Maximum guarantee amount in TZS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary Deduction Authorized</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="salary_deduction"
                            checked={newEmployerData.salary_deduction_authorized === true}
                            onChange={() => setNewEmployerData({...newEmployerData, salary_deduction_authorized: true})}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="salary_deduction"
                            checked={newEmployerData.salary_deduction_authorized === false}
                            onChange={() => setNewEmployerData({...newEmployerData, salary_deduction_authorized: false})}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Handling Procedures *</label>
                      <textarea
                        required
                        value={newEmployerData.default_handling_procedures}
                        onChange={(e) => setNewEmployerData({...newEmployerData, default_handling_procedures: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe procedures for handling defaults..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Legal Framework *</label>
                      <textarea
                        required
                        value={newEmployerData.legal_framework}
                        onChange={(e) => setNewEmployerData({...newEmployerData, legal_framework: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Legal framework and compliance requirements..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Termination Conditions *</label>
                      <textarea
                        required
                        value={newEmployerData.termination_conditions}
                        onChange={(e) => setNewEmployerData({...newEmployerData, termination_conditions: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Conditions for terminating the guarantee agreement..."
                      />
                    </div>
                  </div>
                </div>

                {/* Payroll Integration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payroll Integration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Frequency *</label>
                      <select
                        required
                        value={newEmployerData.payment_frequency}
                        onChange={(e) => setNewEmployerData({...newEmployerData, payment_frequency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Frequency</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Frequency *</label>
                      <select
                        required
                        value={newEmployerData.reporting_frequency}
                        onChange={(e) => setNewEmployerData({...newEmployerData, reporting_frequency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Frequency</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Automatic Deduction Enabled</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="automatic_deduction"
                            checked={newEmployerData.automatic_deduction_enabled === true}
                            onChange={() => setNewEmployerData({...newEmployerData, automatic_deduction_enabled: true})}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="automatic_deduction"
                            checked={newEmployerData.automatic_deduction_enabled === false}
                            onChange={() => setNewEmployerData({...newEmployerData, automatic_deduction_enabled: false})}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manual Override Allowed</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="manual_override"
                            checked={newEmployerData.manual_override_allowed === true}
                            onChange={() => setNewEmployerData({...newEmployerData, manual_override_allowed: true})}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="manual_override"
                            checked={newEmployerData.manual_override_allowed === false}
                            onChange={() => setNewEmployerData({...newEmployerData, manual_override_allowed: false})}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee Verification */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2" />
                    Employee Verification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEmployerData.employee_verification_required}
                        onChange={(e) => setNewEmployerData({...newEmployerData, employee_verification_required: e.target.checked})}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Employee Verification Required</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEmployerData.employment_confirmation_required}
                        onChange={(e) => setNewEmployerData({...newEmployerData, employment_confirmation_required: e.target.checked})}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Employment Confirmation Required</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEmployerData.salary_verification_required}
                        onChange={(e) => setNewEmployerData({...newEmployerData, salary_verification_required: e.target.checked})}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Salary Verification Required</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEmployerData.job_security_assessment_required}
                        onChange={(e) => setNewEmployerData({...newEmployerData, job_security_assessment_required: e.target.checked})}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Job Security Assessment Required</label>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Document Upload
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Documents *</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('registration_documents', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newEmployerData.registration_documents_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Agreement *</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('guarantee_agreement', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newEmployerData.guarantee_agreement_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Integration Documents</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('payroll_integration_docs', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newEmployerData.payroll_integration_docs_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEmployer(false);
                      setIsEditing(false);
                      setSelectedEmployer(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={insertLoading || updateLoading || uploadingFiles}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {uploadingFiles && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {uploadingFiles ? 'Uploading Files...' : (insertLoading || updateLoading ? 'Saving...' : (isEditing ? 'Update Employer' : 'Add Employer'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Archive Employer</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to archive this employer? This action can be undone later.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchiveEmployer}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Archiving...' : 'Archive Employer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployerGuaranteeSetup;






















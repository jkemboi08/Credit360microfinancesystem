import React, { createContext, useContext, useState } from 'react';

interface Translations {
  [key: string]: {
    en: string;
    sw: string;
  };
}

const translations: Translations = {
  'welcome': { en: 'Welcome', sw: 'Karibu' },
  'login': { en: 'Login', sw: 'Ingia' },
  'dashboard': { en: 'Dashboard', sw: 'Dashibodi' },
  'clients': { en: 'Clients', sw: 'Wateja' },
  'loans': { en: 'Loan Monitoring', sw: 'Ufuatiliaji wa Mikopo' },
  'repayments': { en: 'Repayments', sw: 'Marejesho' },
  'reports': { en: 'Reports', sw: 'Ripoti' },
  'settings': { en: 'Settings', sw: 'Mipangilio' },
  'logout': { en: 'Logout', sw: 'Toka' },
  'username': { en: 'Username', sw: 'Jina la Mtumiaji' },
  'password': { en: 'Password', sw: 'Nenosiri' },
  'email': { en: 'Email', sw: 'Barua pepe' },
  'phone': { en: 'Phone', sw: 'Simu' },
  'total_active_loans': { en: 'Total Active Loans', sw: 'Jumla ya Mikopo Hai' },
  'par_30': { en: 'PAR 30', sw: 'PAR 30' },
  'npl_ratio': { en: 'NPL Ratio', sw: 'Uwiano wa NPL' },
  'disbursements': { en: 'Disbursements', sw: 'Uongozaji' },
  'add_client': { en: 'Add New Client', sw: 'Ongeza Mteja Mpya' },
  'process_loan': { en: 'Process Loan', sw: 'Chakata Mkopo' },
  'overdue_accounts': { en: 'Overdue Accounts', sw: 'Akaunti za Kuchelewa' },
  'liquidity_ratio': { en: 'Liquidity Ratio', sw: 'Uwiano wa Ukwasi' },
  'stress_test': { en: 'Stress Test', sw: 'Jaribio la Msongo' },
  'kyc_verification': { en: 'KYC Verification', sw: 'Uthibitishaji wa KYC' },
  'nida_check': { en: 'NIDA ID Check', sw: 'Ukaguzi wa Kitambulisho cha NIDA' },
  'sanctions_screening': { en: 'Sanctions Screening', sw: 'Uchunguzi wa Vikwazo' },
  'credit_assessment': { en: 'Credit Assessment', sw: 'Tathmini ya Mkopo' },
  'loan_amount': { en: 'Loan Amount', sw: 'Kiasi cha Mkopo' },
  'interest_rate': { en: 'Interest Rate', sw: 'Kiwango cha Riba' },
  'repayment_schedule': { en: 'Repayment Schedule', sw: 'Ratiba ya Malipo' },
  'apply_loan': { en: 'Apply for Loan', sw: 'Omba Mkopo' },
  'make_payment': { en: 'Make Payment', sw: 'Fanya Malipo' },
  'account_balance': { en: 'Account Balance', sw: 'Salio la Akaunti' },
  'next_payment': { en: 'Next Payment', sw: 'Malipo ya Kufuata' },
  'complaints': { en: 'Complaints', sw: 'Malalamiko' },
  'support': { en: 'Support', sw: 'Msaada' },
  'audit_logs': { en: 'Audit Logs', sw: 'Kumbukumbu za Ukaguzi' },
  'compliance': { en: 'Compliance', sw: 'Utii' },
  'data_protection': { en: 'Data Protection', sw: 'Ulinzi wa Data' },
  'crb_consent': { en: 'CRB Consent', sw: 'Idhini ya CRB' },
  'financial_education': { en: 'Financial Education', sw: 'Elimu ya Kifedha' },
  'loan_processing': { en: 'Loan Processing', sw: 'Uchakataji wa Mikopo' },
  'disbursement': { en: 'Disbursement', sw: 'Uongozaji' },
  'validate': { en: 'Validate', sw: 'Thibitisha' },
  'assess': { en: 'Assess', sw: 'Tathmini' },
  'approve': { en: 'Approve', sw: 'Idhinisha' },
  'reject': { en: 'Reject', sw: 'Kataa' },
  'disburse': { en: 'Disburse', sw: 'Ongoza' },
  'accounting': { en: 'Accounting', sw: 'Uhasibu' },
  'general_ledger': { en: 'General Ledger', sw: 'Daftari Kuu' },
  'trial_balance': { en: 'Trial Balance', sw: 'Mizani ya Jaribio' },
  'balance_sheet': { en: 'Balance Sheet', sw: 'Karatasi ya Mizani' },
  'income_statement': { en: 'Income Statement', sw: 'Taarifa ya Mapato' },
  'cash_flow': { en: 'Cash Flow', sw: 'Mtiririko wa Fedha' },
  'provisions': { en: 'Provisions', sw: 'Akiba' },
  'reconciliation': { en: 'Reconciliation', sw: 'Upatanisho' },
  'chart_of_accounts': { en: 'Chart of Accounts', sw: 'Mpango wa Akaunti' },
  
  // Loan Contract Generation Page
  'loan_contract_generation': { en: 'Loan Contract Generation', sw: 'Uundaji wa Mkataba wa Mkopo' },
  'back_to_loan_processing': { en: 'Back to Loan Processing', sw: 'Rudi kwenye Uchakataji wa Mikopo' },
  'generate_and_edit_contract': { en: 'Generate and edit loan contract for', sw: 'Unda na hariri mkataba wa mkopo wa' },
  'contract_generation': { en: 'Contract Generation', sw: 'Uundaji wa Mkataba' },
  'test_button': { en: 'Test', sw: 'Jaribu' },
  'direct_link': { en: 'Direct Link', sw: 'Kiungo cha Moja kwa Moja' },
  
  // Contract Details
  'loan_application_details': { en: 'Loan Application Details', sw: 'Maelezo ya Ombi la Mkopo' },
  'client_name': { en: 'Client Name', sw: 'Jina la Mteja' },
  'principal_amount': { en: 'Principal Amount', sw: 'Kiasi cha Msingi' },
  'term': { en: 'Term', sw: 'Muda' },
  'months': { en: 'months', sw: 'miezi' },
  'letterhead_preview': { en: 'Letterhead Preview', sw: 'Kiongozi cha Kichwa' },
  'contract_text': { en: 'Contract Text', sw: 'Maandishi ya Mkataba' },
  'edit_mode': { en: 'Edit Mode', sw: 'Hali ya Kuhariri' },
  
  // Contract Actions
  'save_contract': { en: 'Save Contract', sw: 'Hifadhi Mkataba' },
  'download': { en: 'Download', sw: 'Pakua' },
  'send_email': { en: 'Send Email', sw: 'Tuma Barua pepe' },
  'hide_layout': { en: 'Hide Layout', sw: 'Ficha Mpangilio' },
  'letterhead_active': { en: 'Letterhead Active', sw: 'Kichwa cha Barua Kimeamilishwa' },
  
  // Contract Content
  'loan_agreement': { en: 'Mkataba wa Mkopo', sw: 'Mkataba wa Mkopo' },
  'agreement_made': { en: 'Mkataba huu umefanyika hapa Dar es Salaam leo Tarehe', sw: 'Mkataba huu umefanyika hapa Dar es Salaam leo Tarehe' },
  'between': { en: 'KATI YA', sw: 'KATI YA' },
  'page': { en: 'Page', sw: 'Ukurasa' },
  
  // Error Messages
  'contract_not_found': { en: 'Contract Not Found', sw: 'Mkataba Haupatikani' },
  'contract_not_found_message': { en: 'The requested loan application could not be found.', sw: 'Ombi la mkopo lililoombiwa halikuweza kupatikana.' },
  'loan_application_id': { en: 'Loan Application ID', sw: 'Kitambulisho cha Ombi la Mkopo' },
  'available_applications': { en: 'Available Applications', sw: 'Maombi Yaliyopo' },
  'error_loading_contract': { en: 'Error loading contract data', sw: 'Hitilafu ya kupakia data ya mkataba' },
  'using_sample_data': { en: 'Using Sample Data', sw: 'Kutumia Data ya Mfano' },
  'no_loan_application_found': { en: 'No loan application found with ID', sw: 'Hakuna ombi la mkopo lililopatikana na kitambulisho' },
  'using_sample_data_demo': { en: 'Using sample data for demonstration purposes.', sw: 'Kutumia data ya mfano kwa madhumuni ya maonyesho.' },
  
  // Loading States
  'loading_contract_data': { en: 'Loading contract data...', sw: 'Inapakia data ya mkataba...' },
  
  // Additional Common Terms
  'unknown_client': { en: 'Unknown Client', sw: 'Mteja Asiyejulikana' },
  'address_not_provided': { en: 'Address not provided', sw: 'Anwani haijatolewa' },
  'not_specified': { en: 'Not specified', sw: 'Haijabainishwa' },
  'location_not_specified': { en: 'Location not specified', sw: 'Mahali haijabainishwa' },
  'business_owner': { en: 'Business Owner', sw: 'Mmiliki wa Biashara' },
  'self_employed': { en: 'Self Employed', sw: 'Mwenye Kazi ya Kibinafsi' },
  'employee': { en: 'Employee', sw: 'Mfanyakazi' },
  'sample_guarantor': { en: 'Sample Guarantor', sw: 'Mkubali wa Mfano' },
  'sample_client': { en: 'Sample Client', sw: 'Mteja wa Mfano' },
  
  // Navigation
  'breadcrumb_dashboard': { en: 'Dashboard', sw: 'Dashibodi' },
  'breadcrumb_loan_processing': { en: 'Loan Processing', sw: 'Uchakataji wa Mikopo' },
  'breadcrumb_contract_generation': { en: 'Contract Generation', sw: 'Uundaji wa Mkataba' },
  
  // Common UI Elements
  'save': { en: 'Save', sw: 'Hifadhi' },
  'cancel': { en: 'Cancel', sw: 'Ghairi' },
  'edit': { en: 'Edit', sw: 'Hariri' },
  'delete': { en: 'Delete', sw: 'Futa' },
  'add': { en: 'Add', sw: 'Ongeza' },
  'create': { en: 'Create', sw: 'Unda' },
  'update': { en: 'Update', sw: 'Sasisha' },
  'submit': { en: 'Submit', sw: 'Wasilisha' },
  'confirm': { en: 'Confirm', sw: 'Thibitisha' },
  'close': { en: 'Close', sw: 'Funga' },
  'open': { en: 'Open', sw: 'Fungua' },
  'view': { en: 'View', sw: 'Angalia' },
  'search': { en: 'Search', sw: 'Tafuta' },
  'filter': { en: 'Filter', sw: 'Chuja' },
  'sort': { en: 'Sort', sw: 'Panga' },
  'refresh': { en: 'Refresh', sw: 'Sasisha' },
  'loading': { en: 'Loading...', sw: 'Inapakia...' },
  'saving': { en: 'Saving...', sw: 'Inahifadhi...' },
  'processing': { en: 'Processing...', sw: 'Inachakata...' },
  'success': { en: 'Success', sw: 'Imefanikiwa' },
  'error': { en: 'Error', sw: 'Hitilafu' },
  'warning': { en: 'Warning', sw: 'Onyo' },
  'info': { en: 'Information', sw: 'Taarifa' },
  'yes': { en: 'Yes', sw: 'Ndiyo' },
  'no': { en: 'No', sw: 'Hapana' },
  'ok': { en: 'OK', sw: 'Sawa' },
  
  // Form Labels
  'name': { en: 'Name', sw: 'Jina' },
  'address': { en: 'Address', sw: 'Anwani' },
  'phone_number': { en: 'Phone Number', sw: 'Nambari ya Simu' },
  'email_address': { en: 'Email Address', sw: 'Anwani ya Barua pepe' },
  'occupation': { en: 'Occupation', sw: 'Kazi' },
  'employer': { en: 'Employer', sw: 'Mwajiri' },
  'location': { en: 'Location', sw: 'Mahali' },
  'date': { en: 'Date', sw: 'Tarehe' },
  'time': { en: 'Time', sw: 'Muda' },
  'amount': { en: 'Amount', sw: 'Kiasi' },
  'currency': { en: 'Currency', sw: 'Sarafu' },
  'status': { en: 'Status', sw: 'Hali' },
  'description': { en: 'Description', sw: 'Maelezo' },
  'notes': { en: 'Notes', sw: 'Maelezo' },
  'comments': { en: 'Comments', sw: 'Maoni' },
  
  // Actions
  'view_details': { en: 'View Details', sw: 'Angalia Maelezo' },
  'edit_details': { en: 'Edit Details', sw: 'Hariri Maelezo' },
  'delete_item': { en: 'Delete Item', sw: 'Futa Kipengele' },
  'add_new': { en: 'Add New', sw: 'Ongeza Mpya' },
  'create_new': { en: 'Create New', sw: 'Unda Mpya' },
  'back_to_list': { en: 'Back to List', sw: 'Rudi kwenye Orodha' },
  'next': { en: 'Next', sw: 'Ifuatayo' },
  'previous': { en: 'Previous', sw: 'Nyuma' },
  'finish': { en: 'Finish', sw: 'Maliza' },
  'complete': { en: 'Complete', sw: 'Kamilisha' },
  
  // Status Messages
  'operation_successful': { en: 'Operation completed successfully', sw: 'Operesheni imekamilika kwa mafanikio' },
  'operation_failed': { en: 'Operation failed', sw: 'Operesheni imeshindwa' },
  'data_saved': { en: 'Data saved successfully', sw: 'Data imehifadhiwa kwa mafanikio' },
  'data_updated': { en: 'Data updated successfully', sw: 'Data imesasishwa kwa mafanikio' },
  'data_deleted': { en: 'Data deleted successfully', sw: 'Data imefutwa kwa mafanikio' },
  'please_wait': { en: 'Please wait...', sw: 'Tafadhali subiri...' },
  'try_again': { en: 'Try again', sw: 'Jaribu tena' },
  'contact_support': { en: 'Contact support', sw: 'Wasiliana na msaada' },
  
  // Loan Specific Terms
  'loan_application': { en: 'Loan Application', sw: 'Ombi la Mkopo' },
  'repayment_period': { en: 'Repayment Period', sw: 'Kipindi cha Malipo' },
  'monthly_payment': { en: 'Monthly Payment', sw: 'Malipo ya Kila Mwezi' },
  'total_repayment': { en: 'Total Repayment', sw: 'Jumla ya Malipo' },
  'disbursement_date': { en: 'Disbursement Date', sw: 'Tarehe ya Utoaji' },
  'maturity_date': { en: 'Maturity Date', sw: 'Tarehe ya Kukoma' },
  'guarantor': { en: 'Guarantor', sw: 'Mkubali' },
  'guarantor_name': { en: 'Guarantor Name', sw: 'Jina la Mkubali' },
  'guarantor_phone': { en: 'Guarantor Phone', sw: 'Simu ya Mkubali' },
  'guarantor_occupation': { en: 'Guarantor Occupation', sw: 'Kazi ya Mkubali' },
  
  // Client Management
  'client_management': { en: 'Client Management', sw: 'Usimamizi wa Wateja' },
  'edit_client': { en: 'Edit Client', sw: 'Hariri Mteja' },
  'client_details': { en: 'Client Details', sw: 'Maelezo ya Mteja' },
  'client_list': { en: 'Client List', sw: 'Orodha ya Wateja' },
  'new_client': { en: 'New Client', sw: 'Mteja Mpya' },
  
  // Reports
  'generate_report': { en: 'Generate Report', sw: 'Unda Ripoti' },
  'export_data': { en: 'Export Data', sw: 'Hamisha Data' },
  'print_report': { en: 'Print Report', sw: 'Chapisha Ripoti' },
  'download_report': { en: 'Download Report', sw: 'Pakua Ripoti' },
  'report_period': { en: 'Report Period', sw: 'Kipindi cha Ripoti' },
  'from_date': { en: 'From Date', sw: 'Kutoka Tarehe' },
  'to_date': { en: 'To Date', sw: 'Hadi Tarehe' },
  
  // System Messages
  'system_error': { en: 'System Error', sw: 'Hitilafu ya Mfumo' },
  'network_error': { en: 'Network Error', sw: 'Hitilafu ya Mtandao' },
  'unauthorized_access': { en: 'Unauthorized Access', sw: 'Ufikiaji usioidhinishwa' },
  'session_expired': { en: 'Session Expired', sw: 'Kipindi kimeisha' },
  'please_login': { en: 'Please login', sw: 'Tafadhali ingia' },
  
  // Sidebar Menu Items
  'savings_deposits': { en: 'Savings & Deposits', sw: 'Akaunti za Akiba na Amana' },
  'savings_products': { en: 'Savings Products', sw: 'Bidhaa za Akiba' },
  'savings_accounts': { en: 'Savings Accounts', sw: 'Akaunti za Akiba' },
  'interest_posting': { en: 'Interest Posting', sw: 'Kupachika Riba' },
  'expense_management': { en: 'Expense Management', sw: 'Usimamizi wa Matumizi' },
  'expense_dashboard': { en: 'Expense Dashboard', sw: 'Dashibodi ya Matumizi' },
  'expense_entry': { en: 'Expense Entry', sw: 'Kuingiza Matumizi' },
  'expense_approval': { en: 'Expense Approval', sw: 'Idhini ya Matumizi' },
  'loan_applications': { en: 'Loan Applications', sw: 'Maombi ya Mikopo' },
  'committee_approval': { en: 'Committee Approval', sw: 'Idhini ya Kamati' },
  'enhanced_disbursement': { en: 'Disbursements', sw: 'Utoaji' },
  'loan_restructuring': { en: 'Loan Restructuring', sw: 'Kurekebisha Mikopo' },
  'loan_closure': { en: 'Loan Closure', sw: 'Kufunga Mikopo' },
  'staff_management': { en: 'Staff Management', sw: 'Usimamizi wa Wafanyakazi' },
  'group_management': { en: 'Group Management', sw: 'Usimamizi wa Vikundi' },
  'treasury_management': { en: 'Treasury Management', sw: 'Usimamizi wa Hazina' },
  'budget_management': { en: 'Budget Management', sw: 'Usimamizi wa Bajeti' },
  'regulatory_reports': { en: 'BOT Regulatory Reports', sw: 'Ripoti za Udhibiti wa BOT' },
  
  // Dashboard and Common UI
  'total_clients': { en: 'Total Clients', sw: 'Jumla ya Wateja' },
  'active_loans': { en: 'Active Loans', sw: 'Mikopo Hai' },
  'overdue_loans': { en: 'Overdue Loans', sw: 'Mikopo ya Kuchelewa' },
  'total_disbursements': { en: 'Total Disbursements', sw: 'Jumla ya Utoaji' },
  'total_repayments': { en: 'Total Repayments', sw: 'Jumla ya Marejesho' },
  'portfolio_at_risk': { en: 'Portfolio at Risk', sw: 'Portfolio ya Hatari' },
  'recent_activities': { en: 'Recent Activities', sw: 'Shughuli za Hivi Karibuni' },
  'quick_actions': { en: 'Quick Actions', sw: 'Vitendo vya Haraka' },
  'statistics': { en: 'Statistics', sw: 'Takwimu' },
  'overview': { en: 'Overview', sw: 'Muhtasari' },
  'summary': { en: 'Summary', sw: 'Muhtasari' },
  
  // Client Management
  'client_id': { en: 'Client ID', sw: 'Kitambulisho cha Mteja' },
  'first_name': { en: 'First Name', sw: 'Jina la Kwanza' },
  'last_name': { en: 'Last Name', sw: 'Jina la Mwisho' },
  'middle_name': { en: 'Middle Name', sw: 'Jina la Kati' },
  'gender': { en: 'Gender', sw: 'Jinsia' },
  'male': { en: 'Male', sw: 'Mwanaume' },
  'female': { en: 'Female', sw: 'Mwanamke' },
  'date_of_birth': { en: 'Date of Birth', sw: 'Tarehe ya Kuzaliwa' },
  'national_id': { en: 'National ID', sw: 'Kitambulisho cha Taifa' },
  'passport_number': { en: 'Passport Number', sw: 'Nambari ya Paspoti' },
  'marital_status': { en: 'Marital Status', sw: 'Hali ya Ndoa' },
  'single': { en: 'Single', sw: 'Bila Ndoa' },
  'married': { en: 'Married', sw: 'Olewa' },
  'divorced': { en: 'Divorced', sw: 'Tolewa' },
  'widowed': { en: 'Widowed', sw: 'Mfiwa' },
  'education_level': { en: 'Education Level', sw: 'Kiwango cha Elimu' },
  'primary': { en: 'Primary', sw: 'Msingi' },
  'secondary': { en: 'Secondary', sw: 'Sekondari' },
  'diploma': { en: 'Diploma', sw: 'Diploma' },
  'degree': { en: 'Degree', sw: 'Shahada' },
  'masters': { en: 'Masters', sw: 'Uzamili' },
  'phd': { en: 'PhD', sw: 'Daktari' },
  
  // Actions and Status
  'archive': { en: 'Archive', sw: 'Hifadhi' },
  'unarchive': { en: 'Unarchive', sw: 'Ondoa kwenye Hifadhi' },
  'activate': { en: 'Activate', sw: 'Amilisha' },
  'deactivate': { en: 'Deactivate', sw: 'Zima' },
  'view_profile': { en: 'View Profile', sw: 'Angalia Wasifu' },
  'edit_profile': { en: 'Edit Profile', sw: 'Hariri Wasifu' },
  'upload_documents': { en: 'Upload Documents', sw: 'Pakia Hati' },
  'download_documents': { en: 'Download Documents', sw: 'Pakua Hati' },
  'send_message': { en: 'Send Message', sw: 'Tuma Ujumbe' },
  'schedule_meeting': { en: 'Schedule Meeting', sw: 'Panga Mkutano' },
  
  // Success/Error Messages
  'client_created_successfully': { en: 'Client created successfully', sw: 'Mteja ameundwa kwa mafanikio' },
  'client_updated_successfully': { en: 'Client updated successfully', sw: 'Mteja amesasishwa kwa mafanikio' },
  'client_archived_successfully': { en: 'Client archived successfully', sw: 'Mteja amehifadhiwa kwa mafanikio' },
  'client_deleted_successfully': { en: 'Client deleted successfully', sw: 'Mteja amefutwa kwa mafanikio' },
  'failed_to_create_client': { en: 'Failed to create client', sw: 'Kushindwa kuunda mteja' },
  'failed_to_update_client': { en: 'Failed to update client', sw: 'Kushindwa kusasisha mteja' },
  'failed_to_archive_client': { en: 'Failed to archive client', sw: 'Kushindwa kuhifadhi mteja' },
  'failed_to_delete_client': { en: 'Failed to delete client', sw: 'Kushindwa kufuta mteja' },
  'user_not_authenticated': { en: 'User not authenticated', sw: 'Mtumiaji hajaidhinishwa' },
  'invalid_file': { en: 'Invalid file', sw: 'Faili batili' },
  'error_uploading_files': { en: 'Error uploading files', sw: 'Hitilafu ya kupakia faili' },
  
  // Time and Date
  'hours_ago': { en: 'hours ago', sw: 'masaa yaliyopita' },
  'days_ago': { en: 'days ago', sw: 'siku zilizopita' },
  'weeks_ago': { en: 'weeks ago', sw: 'wiki zilizopita' },
  'months_ago': { en: 'months ago', sw: 'miezi iliyopita' },
  'years_ago': { en: 'years ago', sw: 'miaka iliyopita' },
  'just_now': { en: 'just now', sw: 'sasa hivi' },
  'today': { en: 'Today', sw: 'Leo' },
  'yesterday': { en: 'Yesterday', sw: 'Jana' },
  'tomorrow': { en: 'Tomorrow', sw: 'Kesho' },
  
  // Loan Actions
  'loan_approved': { en: 'Loan Approved', sw: 'Mkopo Umeidhinishwa' },
  'payment_received': { en: 'Payment Received', sw: 'Malipo Yamepokelewa' },
  'crb_check_completed': { en: 'CRB Check Completed', sw: 'Ukaguzi wa CRB Umekamilika' },
  'kyc_verified': { en: 'KYC Verified', sw: 'KYC Imethibitishwa' },
  'loan_restructured': { en: 'Loan Restructured', sw: 'Mkopo Umerekebishwa' },
  'clock_in': { en: 'Clock In', sw: 'Ingia Kazi' },
  'clock_out': { en: 'Clock Out', sw: 'Toka Kazi' },
  'failed_to_clock_in': { en: 'Failed to clock in', sw: 'Kushindwa kuingia kazini' },
  'failed_to_clock_out': { en: 'Failed to clock out', sw: 'Kushindwa kutoka kazini' }
};

interface LanguageContextType {
  language: 'en' | 'sw';
  setLanguage: (lang: 'en' | 'sw') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
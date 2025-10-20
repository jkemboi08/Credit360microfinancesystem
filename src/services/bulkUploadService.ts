import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export interface ClientUploadData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  common_name?: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  national_id_number: string;
  id_type: string;
  phone_number: string;
  email_address?: string;
  street_name: string;
  house_number: string;
  area_of_residence: string;
  housing_type: 'Own' | 'Rented';
  marital_status: 'Married' | 'Engaged' | 'Single' | 'Divorced' | 'Widowed';
  spouse_name?: string;
  spouse_common_name?: string;
  company_name: string;
  office_location: string;
  position: string;
  years_of_employment: number;
  net_monthly_salary: number;
  business_name?: string;
  business_location?: string;
  average_monthly_income?: number;
  type_of_business?: string;
  since_when_business?: string;
  group_name?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface BulkUploadResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ValidationError[];
  createdClients: any[];
}

export class BulkUploadService {
  static generateTemplate(): void {
    const templateData = [
      {
        'First Name *': 'John',
        'Middle Name': 'Michael',
        'Last Name *': 'Doe',
        'Common Name': 'Johnny',
        'Gender *': 'male',
        'Date of Birth *': '1990-01-15',
        'National ID Number *': '1234567890123456',
        'ID Type *': 'National ID',
        'Phone Number *': '+255123456789',
        'Email Address': 'john.doe@email.com',
        'Street Name *': 'Main Street',
        'House Number *': '123',
        'Area of Residence *': 'Downtown',
        'Housing Type *': 'Own',
        'Marital Status *': 'Single',
        'Spouse Name': '',
        'Spouse Common Name': '',
        'Company Name *': 'ABC Company Ltd',
        'Office Location *': 'City Center',
        'Position *': 'Manager',
        'Years of Employment *': 5,
        'Net Monthly Salary *': 500000,
        'Business Name': '',
        'Business Location': '',
        'Average Monthly Income': '',
        'Type of Business': '',
        'Since When Business': '',
        'Group Name': 'Group A'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Template');

    // Add instructions sheet
    const instructions = [
      { 'Field': 'First Name *', 'Description': 'Client\'s first name (Required)', 'Example': 'John' },
      { 'Field': 'Middle Name', 'Description': 'Client\'s middle name (Optional)', 'Example': 'Michael' },
      { 'Field': 'Last Name *', 'Description': 'Client\'s last name (Required)', 'Example': 'Doe' },
      { 'Field': 'Common Name', 'Description': 'Client\'s nickname (Optional)', 'Example': 'Johnny' },
      { 'Field': 'Gender *', 'Description': 'male, female, or other (Required)', 'Example': 'male' },
      { 'Field': 'Date of Birth *', 'Description': 'YYYY-MM-DD format (Required)', 'Example': '1990-01-15' },
      { 'Field': 'National ID Number *', 'Description': 'National ID number (Required)', 'Example': '1234567890123456' },
      { 'Field': 'ID Type *', 'Description': 'Driver\'s License, National ID, or Voters ID (Required)', 'Example': 'National ID' },
      { 'Field': 'Phone Number *', 'Description': 'Phone number with country code (Required)', 'Example': '+255123456789' },
      { 'Field': 'Email Address', 'Description': 'Valid email address (Optional)', 'Example': 'john.doe@email.com' },
      { 'Field': 'Street Name *', 'Description': 'Street name (Required)', 'Example': 'Main Street' },
      { 'Field': 'House Number *', 'Description': 'House number (Required)', 'Example': '123' },
      { 'Field': 'Area of Residence *', 'Description': 'Area of residence (Required)', 'Example': 'Downtown' },
      { 'Field': 'Housing Type *', 'Description': 'Own or Rented (Required)', 'Example': 'Own' },
      { 'Field': 'Marital Status *', 'Description': 'Married, Engaged, Single, Divorced, or Widowed (Required)', 'Example': 'Single' },
      { 'Field': 'Spouse Name', 'Description': 'Spouse\'s full name (Optional)', 'Example': 'Jane Doe' },
      { 'Field': 'Spouse Common Name', 'Description': 'Spouse\'s nickname (Optional)', 'Example': 'Jane' },
      { 'Field': 'Company Name *', 'Description': 'Employer company name (Required)', 'Example': 'ABC Company Ltd' },
      { 'Field': 'Office Location *', 'Description': 'Office location (Required)', 'Example': 'City Center' },
      { 'Field': 'Position *', 'Description': 'Job position (Required)', 'Example': 'Manager' },
      { 'Field': 'Years of Employment *', 'Description': 'Years of employment (Required)', 'Example': 5 },
      { 'Field': 'Net Monthly Salary *', 'Description': 'Monthly salary amount (Required)', 'Example': 500000 },
      { 'Field': 'Business Name', 'Description': 'Business name if self-employed (Optional)', 'Example': 'John\'s Shop' },
      { 'Field': 'Business Location', 'Description': 'Business location (Optional)', 'Example': 'Market Street' },
      { 'Field': 'Average Monthly Income', 'Description': 'Monthly business income (Optional)', 'Example': 300000 },
      { 'Field': 'Type of Business', 'Description': 'Type of business (Optional)', 'Example': 'Retail' },
      { 'Field': 'Since When Business', 'Description': 'When business started (Optional)', 'Example': '2020-01-01' },
      { 'Field': 'Group Name', 'Description': 'Lending group name (Optional)', 'Example': 'Group A' }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    XLSX.writeFile(workbook, 'client_upload_template.xlsx');
  }

  static parseExcelFile(file: File): Promise<ClientUploadData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const clients: ClientUploadData[] = jsonData.map((row: any, index: number) => ({
            first_name: row['First Name *'] || '',
            middle_name: row['Middle Name'] || '',
            last_name: row['Last Name *'] || '',
            common_name: row['Common Name'] || '',
            gender: this.normalizeGender(row['Gender *']),
            date_of_birth: this.formatDate(row['Date of Birth *']),
            national_id_number: row['National ID Number *'] || '',
            id_type: row['ID Type *'] || '',
            phone_number: row['Phone Number *'] || '',
            email_address: row['Email Address'] || '',
            street_name: row['Street Name *'] || '',
            house_number: row['House Number *'] || '',
            area_of_residence: row['Area of Residence *'] || '',
            housing_type: this.normalizeHousingType(row['Housing Type *']),
            marital_status: this.normalizeMaritalStatus(row['Marital Status *']),
            spouse_name: row['Spouse Name'] || '',
            spouse_common_name: row['Spouse Common Name'] || '',
            company_name: row['Company Name *'] || '',
            office_location: row['Office Location *'] || '',
            position: row['Position *'] || '',
            years_of_employment: this.parseNumber(row['Years of Employment *']),
            net_monthly_salary: this.parseNumber(row['Net Monthly Salary *']),
            business_name: row['Business Name'] || '',
            business_location: row['Business Location'] || '',
            average_monthly_income: this.parseNumber(row['Average Monthly Income']),
            type_of_business: row['Type of Business'] || '',
            since_when_business: row['Since When Business'] || '',
            group_name: row['Group Name'] || ''
          }));

          resolve(clients);
        } catch (error) {
          reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static validateClientData(clients: ClientUploadData[]): ValidationError[] {
    const errors: ValidationError[] = [];

    clients.forEach((client, index) => {
      const row = index + 2; // Excel row number (accounting for header)

      // Required field validations
      if (!client.first_name.trim()) {
        errors.push({ row, field: 'First Name', message: 'First name is required' });
      }

      if (!client.last_name.trim()) {
        errors.push({ row, field: 'Last Name', message: 'Last name is required' });
      }

      if (!['male', 'female', 'other'].includes(client.gender)) {
        errors.push({ row, field: 'Gender', message: 'Gender must be male, female, or other' });
      }

      if (!client.date_of_birth || !this.isValidDate(client.date_of_birth)) {
        errors.push({ row, field: 'Date of Birth', message: 'Valid date of birth is required (YYYY-MM-DD)' });
      }

      if (!client.national_id_number.trim()) {
        errors.push({ row, field: 'National ID Number', message: 'National ID number is required' });
      }

      if (!['Driver\'s License', 'National ID', 'Voters ID'].includes(client.id_type)) {
        errors.push({ row, field: 'ID Type', message: 'ID type must be Driver\'s License, National ID, or Voters ID' });
      }

      if (!client.phone_number.trim()) {
        errors.push({ row, field: 'Phone Number', message: 'Phone number is required' });
      }

      if (!client.street_name.trim()) {
        errors.push({ row, field: 'Street Name', message: 'Street name is required' });
      }

      if (!client.house_number.trim()) {
        errors.push({ row, field: 'House Number', message: 'House number is required' });
      }

      if (!client.area_of_residence.trim()) {
        errors.push({ row, field: 'Area of Residence', message: 'Area of residence is required' });
      }

      if (!['Own', 'Rented'].includes(client.housing_type)) {
        errors.push({ row, field: 'Housing Type', message: 'Housing type must be Own or Rented' });
      }

      if (!['Married', 'Engaged', 'Single', 'Divorced', 'Widowed'].includes(client.marital_status)) {
        errors.push({ row, field: 'Marital Status', message: 'Marital status must be Married, Engaged, Single, Divorced, or Widowed' });
      }

      if (!client.company_name.trim()) {
        errors.push({ row, field: 'Company Name', message: 'Company name is required' });
      }

      if (!client.office_location.trim()) {
        errors.push({ row, field: 'Office Location', message: 'Office location is required' });
      }

      if (!client.position.trim()) {
        errors.push({ row, field: 'Position', message: 'Position is required' });
      }

      if (!client.years_of_employment || client.years_of_employment < 0) {
        errors.push({ row, field: 'Years of Employment', message: 'Valid years of employment is required' });
      }

      if (!client.net_monthly_salary || client.net_monthly_salary < 0) {
        errors.push({ row, field: 'Net Monthly Salary', message: 'Valid monthly salary is required' });
      }

      // Email validation
      if (client.email_address && !this.isValidEmail(client.email_address)) {
        errors.push({ row, field: 'Email Address', message: 'Invalid email format' });
      }
    });

    return errors;
  }

  static async uploadClients(clients: ClientUploadData[]): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      success: false,
      totalRows: clients.length,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      createdClients: []
    };

    try {
      // Validate all clients first
      const validationErrors = this.validateClientData(clients);
      if (validationErrors.length > 0) {
        result.errors = validationErrors;
        result.failedRows = clients.length;
        return result;
      }

      // Prepare data for bulk insert
      const clientData = clients.map(client => ({
        ...client,
        kyc_status: 'pending' as const,
        id_document_uploaded: false,
        passport_photo_uploaded: false,
        fingerprint_uploaded: false,
        salary_slip_uploaded: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert clients in batches
      const batchSize = 100;
      for (let i = 0; i < clientData.length; i += batchSize) {
        const batch = clientData.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('clients')
          .insert(batch)
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          result.failedRows += batch.length;
          result.errors.push({
            row: i + 1,
            field: 'Database',
            message: `Batch insert failed: ${error.message}`
          });
        } else {
          result.successfulRows += data?.length || 0;
          result.createdClients.push(...(data || []));
        }
      }

      result.success = result.successfulRows > 0;
      result.failedRows = result.totalRows - result.successfulRows;

      return result;
    } catch (error) {
      console.error('Bulk upload error:', error);
      result.errors.push({
        row: 0,
        field: 'System',
        message: `Upload failed: ${(error as Error).message}`
      });
      result.failedRows = clients.length;
      return result;
    }
  }

  // Helper methods
  private static normalizeGender(gender: any): 'male' | 'female' | 'other' {
    const normalized = String(gender).toLowerCase().trim();
    if (['male', 'm', 'me'].includes(normalized)) return 'male';
    if (['female', 'f', 'ke'].includes(normalized)) return 'female';
    return 'other';
  }

  private static normalizeHousingType(housing: any): 'Own' | 'Rented' {
    const normalized = String(housing).toLowerCase().trim();
    if (['rented', 'rent', 'umepanga'].includes(normalized)) return 'Rented';
    return 'Own';
  }

  private static normalizeMaritalStatus(status: any): 'Married' | 'Engaged' | 'Single' | 'Divorced' | 'Widowed' {
    const normalized = String(status).toLowerCase().trim();
    if (['married', 'ameoa', 'olewa'].includes(normalized)) return 'Married';
    if (['engaged'].includes(normalized)) return 'Engaged';
    if (['single', 'hajaoa', 'olewa'].includes(normalized)) return 'Single';
    if (['divorced', 'ameachika'].includes(normalized)) return 'Divorced';
    if (['widowed', 'mjane', 'mgane'].includes(normalized)) return 'Widowed';
    return 'Single';
  }

  private static formatDate(date: any): string {
    if (!date) return '';
    if (date instanceof Date) return date.toISOString().split('T')[0];
    const dateStr = String(date);
    // Handle various date formats
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  }

  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}







































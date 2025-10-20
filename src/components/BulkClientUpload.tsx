import React, { useState } from 'react';
import { Upload, Download, X, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { ClientService } from '../services/clientService';
import toast from 'react-hot-toast';

interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

const BulkClientUpload: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const csvHeaders = [
    'client_type', 'first_name', 'middle_name', 'last_name', 'gender', 'phone_number', 
    'email_address', 'national_id_number', 'tin_number', 'date_of_birth', 'marital_status',
    'region', 'district', 'ward', 'street_name', 'house_number',
    'employment_status', 'occupation', 'employer_name', 'monthly_income',
    'company_name', 'registration_number', 'business_type',
    'director_first_name', 'director_last_name', 'director_gender', 'director_phone_number',
    'group_name', 'group_type', 'group_size',
    'chairman_first_name', 'chairman_last_name', 'chairman_gender',
    'bank_name', 'bank_branch', 'account_number', 'account_type'
  ];

  const downloadTemplate = () => {
    const csv = Papa.unparse([csvHeaders]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk_clients_template.csv';
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const uploadResult: BulkUploadResult = { success: 0, failed: 0, errors: [] };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const clientData = {
              ...row,
              tenant_id: localStorage.getItem('tenantId'),
              status: 'active',
              kyc_status: 'pending',
              client_category: 'new'
            };

            let result: any;
            if (row.client_type === 'individual') {
              result = await ClientService.insertIndividualClient(clientData);
            } else if (row.client_type === 'corporate') {
              result = await ClientService.insertCorporateClient(clientData);
            } else if (row.client_type === 'group') {
              result = await ClientService.insertGroupClient(clientData);
            }

            if (result?.success) {
              uploadResult.success++;
            } else {
              uploadResult.failed++;
              uploadResult.errors.push({ row: i + 2, error: result?.error || 'Unknown error' });
            }
          } catch (error) {
            uploadResult.failed++;
            uploadResult.errors.push({ row: i + 2, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }

        setResult(uploadResult);
        setUploading(false);
        
        if (uploadResult.success > 0) {
          toast.success(`Successfully uploaded ${uploadResult.success} clients`);
          onSuccess();
        }
        
        if (uploadResult.failed > 0) {
          toast.error(`Failed to upload ${uploadResult.failed} clients`);
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        setUploading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Client Upload</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download the CSV template below</li>
              <li>Fill in client data (one client per row)</li>
              <li>For client_type: use 'individual', 'corporate', or 'group'</li>
              <li>For gender fields: use 'male', 'female', or 'other'</li>
              <li>Upload the completed CSV file</li>
            </ol>
          </div>

          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} />
            Download CSV Template
          </button>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload size={48} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {file ? file.name : 'Click to select CSV file'}
              </p>
            </label>
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? 'Uploading...' : 'Upload Clients'}
            </button>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span>{result.success} succeeded</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={20} />
                    <span>{result.failed} failed</span>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>Row {error.row}: {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkClientUpload;

















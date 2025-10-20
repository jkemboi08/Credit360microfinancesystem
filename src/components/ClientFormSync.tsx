import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import ClientService, { ClientFormData } from '../services/clientService';

interface ClientFormSyncProps {
  formData: ClientFormData;
  onSyncComplete?: (success: boolean, message: string) => void;
}

interface SyncStatus {
  isChecking: boolean;
  isSyncing: boolean;
  isComplete: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  message: string;
}

const ClientFormSync: React.FC<ClientFormSyncProps> = ({ formData, onSyncComplete }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isChecking: false,
    isSyncing: false,
    isComplete: false,
    isValid: false,
    errors: [],
    warnings: [],
    message: ''
  });

  // Check form synchronization when formData changes
  useEffect(() => {
    checkFormSync();
  }, [formData]);

  const checkFormSync = async () => {
    setSyncStatus(prev => ({ ...prev, isChecking: true, message: 'Checking form synchronization...' }));

    try {
      // Validate form data
      const validation = ClientService.validateClientData(formData);
      
      const warnings: string[] = [];
      
      // Check for missing optional fields that might be important
      if (formData.client_type === 'individual') {
        if (!formData.email_address) warnings.push('Email address is recommended for individual clients');
        if (!formData.date_of_birth) warnings.push('Date of birth is recommended for individual clients');
        if (!formData.marital_status) warnings.push('Marital status is recommended for individual clients');
      }

      if (formData.client_type === 'corporate') {
        if (!formData.director_phone_number) warnings.push('Director phone number is recommended for corporate clients');
        if (!formData.director_email_address) warnings.push('Director email address is recommended for corporate clients');
      }

      if (formData.client_type === 'group') {
        if (!formData.secretary_first_name) warnings.push('Secretary information is recommended for group clients');
        if (!formData.treasurer_first_name) warnings.push('Treasurer information is recommended for group clients');
      }

      setSyncStatus({
        isChecking: false,
        isSyncing: false,
        isComplete: false,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings,
        message: validation.isValid ? 'Form data is valid and ready for submission' : 'Form data has validation errors'
      });

    } catch (error) {
      setSyncStatus({
        isChecking: false,
        isSyncing: false,
        isComplete: false,
        isValid: false,
        errors: ['Error checking form synchronization'],
        warnings: [],
        message: 'Error occurred while checking form data'
      });
    }
  };

  const syncFormData = async () => {
    if (!syncStatus.isValid) {
      setSyncStatus(prev => ({
        ...prev,
        message: 'Cannot sync form data - please fix validation errors first'
      }));
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, message: 'Synchronizing form data with database...' }));

    try {
      const result = await ClientService.createClient(formData);
      
      if (result.success) {
        setSyncStatus({
          isChecking: false,
          isSyncing: false,
          isComplete: true,
          isValid: true,
          errors: [],
          warnings: syncStatus.warnings,
          message: 'Client data synchronized successfully!'
        });
        
        onSyncComplete?.(true, 'Client created successfully');
      } else {
        setSyncStatus({
          isChecking: false,
          isSyncing: false,
          isComplete: false,
          isValid: false,
          errors: [result.error || 'Unknown error occurred'],
          warnings: syncStatus.warnings,
          message: 'Failed to synchronize client data'
        });
        
        onSyncComplete?.(false, result.error || 'Failed to create client');
      }
    } catch (error) {
      setSyncStatus({
        isChecking: false,
        isSyncing: false,
        isComplete: false,
        isValid: false,
        errors: ['Unexpected error occurred during synchronization'],
        warnings: syncStatus.warnings,
        message: 'Synchronization failed due to unexpected error'
      });
      
      onSyncComplete?.(false, 'Unexpected error occurred');
    }
  };

  const getStatusIcon = () => {
    if (syncStatus.isChecking || syncStatus.isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (syncStatus.isComplete && syncStatus.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (!syncStatus.isValid) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (syncStatus.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (syncStatus.isComplete && syncStatus.isValid) {
      return 'border-green-200 bg-green-50';
    }
    
    if (!syncStatus.isValid) {
      return 'border-red-200 bg-red-50';
    }
    
    if (syncStatus.warnings.length > 0) {
      return 'border-yellow-200 bg-yellow-50';
    }
    
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="space-y-4">
      <Alert className={getStatusColor()}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <AlertDescription className="flex-1">
            {syncStatus.message}
          </AlertDescription>
        </div>
      </Alert>

      {/* Validation Errors */}
      {syncStatus.errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Validation Errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {syncStatus.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {syncStatus.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1">
                {syncStatus.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Button */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={checkFormSync}
          disabled={syncStatus.isChecking || syncStatus.isSyncing}
        >
          {syncStatus.isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Sync'
          )}
        </Button>
        
        <Button
          onClick={syncFormData}
          disabled={!syncStatus.isValid || syncStatus.isSyncing || syncStatus.isComplete}
        >
          {syncStatus.isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync to Database'
          )}
        </Button>
      </div>

      {/* Form Data Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Form Data Summary:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Client Type:</span> {formData.client_type}
          </div>
          <div>
            <span className="font-medium">Name:</span> {formData.first_name} {formData.last_name}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {formData.phone_number}
          </div>
          <div>
            <span className="font-medium">Email:</span> {formData.email_address || 'Not provided'}
          </div>
          {formData.client_type === 'corporate' && (
            <div className="col-span-2">
              <span className="font-medium">Company:</span> {formData.company_name}
            </div>
          )}
          {formData.client_type === 'group' && (
            <div className="col-span-2">
              <span className="font-medium">Group:</span> {formData.group_name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientFormSync;





















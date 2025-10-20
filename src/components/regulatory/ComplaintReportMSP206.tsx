import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Loader2,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckSquare,
  XSquare
} from 'lucide-react';
import ComplaintReportApiService, { ComplaintData } from '../../services/complaintReportApi';

interface ComplaintReportMSP206Props {
  data: { [key: string]: number };
  onDataChange: (key: string, value: number) => void;
  onValidation: (validations: any[]) => void;
  isEditing: boolean;
  institutionDetails: {
    name: string;
    mspCode: string;
    quarterEndDate: string;
    reportingPeriod: string;
    licenseNumber: string;
    address: string;
    phone: string;
    email: string;
  };
}

interface ValidationResult {
  id: string;
  description: string;
  expected: number;
  actual: number;
  passed: boolean;
  error: string;
}

interface ComplaintRow {
  id: number;
  particulars: string;
  number: number;
  value: number;
  interestRate: number;
  agreement: number;
  repayment: number;
  loanStatement: number;
  loanProcess: number;
  others: number;
  total: number;
  isCalculated: boolean;
  isFetched: boolean;
}

const ComplaintReportMSP206: React.FC<ComplaintReportMSP206Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails
}) => {
  const [cmsData, setCmsData] = useState<ComplaintData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [complaintRows, setComplaintRows] = useState<ComplaintRow[]>([]);

  // Format currency for TZS
  const formatTZSCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Define the exact 5-row structure as per requirements
  const createComplaintRows = (): ComplaintRow[] => {
    if (!cmsData) return [];

    const rows: ComplaintRow[] = [];
    let rowId = 1;

    // Row 1: Balance at beginning of quarter
    const row1Data = cmsData.find(d => d.row === 1);
    if (row1Data) {
      const total = row1Data.E + row1Data.F + row1Data.G + row1Data.H + row1Data.I + row1Data.J;
      rows.push({
        id: rowId++,
        particulars: "Balance at beginning of quarter",
        number: row1Data.C,
        value: row1Data.D,
        interestRate: row1Data.E,
        agreement: row1Data.F,
        repayment: row1Data.G,
        loanStatement: row1Data.H,
        loanProcess: row1Data.I,
        others: row1Data.J,
        total: total,
        isCalculated: false,
        isFetched: true
      });
    }

    // Row 2: Complaints received during the quarter
    const row2Data = cmsData.find(d => d.row === 2);
    if (row2Data) {
      const total = row2Data.E + row2Data.F + row2Data.G + row2Data.H + row2Data.I + row2Data.J;
      rows.push({
        id: rowId++,
        particulars: "Complaints received during the quarter",
        number: row2Data.C,
        value: row2Data.D,
        interestRate: row2Data.E,
        agreement: row2Data.F,
        repayment: row2Data.G,
        loanStatement: row2Data.H,
        loanProcess: row2Data.I,
        others: row2Data.J,
        total: total,
        isCalculated: false,
        isFetched: true
      });
    }

    // Row 3: Complaints resolved during the quarter
    const row3Data = cmsData.find(d => d.row === 3);
    if (row3Data) {
      const total = row3Data.E + row3Data.F + row3Data.G + row3Data.H + row3Data.I + row3Data.J;
      rows.push({
        id: rowId++,
        particulars: "Complaints resolved during the quarter",
        number: row3Data.C,
        value: row3Data.D,
        interestRate: row3Data.E,
        agreement: row3Data.F,
        repayment: row3Data.G,
        loanStatement: row3Data.H,
        loanProcess: row3Data.I,
        others: row3Data.J,
        total: total,
        isCalculated: false,
        isFetched: true
      });
    }

    // Row 4: Complaints withdrawn during the quarter
    const row4Data = cmsData.find(d => d.row === 4);
    if (row4Data) {
      const total = row4Data.E + row4Data.F + row4Data.G + row4Data.H + row4Data.I + row4Data.J;
      rows.push({
        id: rowId++,
        particulars: "Complaints withdrawn during the quarter",
        number: row4Data.C,
        value: row4Data.D,
        interestRate: row4Data.E,
        agreement: row4Data.F,
        repayment: row4Data.G,
        loanStatement: row4Data.H,
        loanProcess: row4Data.I,
        others: row4Data.J,
        total: total,
        isCalculated: false,
        isFetched: true
      });
    }

    // Row 5: Unresolved complaints at the end of the quarter (computed)
    const row1 = rows.find(r => r.id === 1);
    const row2 = rows.find(r => r.id === 2);
    const row3 = rows.find(r => r.id === 3);
    const row4 = rows.find(r => r.id === 4);
    
    const unresolvedNumber = (row1?.number || 0) + (row2?.number || 0) - (row3?.number || 0) - (row4?.number || 0);
    const unresolvedValue = (row1?.value || 0) + (row2?.value || 0) - (row3?.value || 0) - (row4?.value || 0);
    const unresolvedInterestRate = (row1?.interestRate || 0) + (row2?.interestRate || 0) - (row3?.interestRate || 0) - (row4?.interestRate || 0);
    const unresolvedAgreement = (row1?.agreement || 0) + (row2?.agreement || 0) - (row3?.agreement || 0) - (row4?.agreement || 0);
    const unresolvedRepayment = (row1?.repayment || 0) + (row2?.repayment || 0) - (row3?.repayment || 0) - (row4?.repayment || 0);
    const unresolvedLoanStatement = (row1?.loanStatement || 0) + (row2?.loanStatement || 0) - (row3?.loanStatement || 0) - (row4?.loanStatement || 0);
    const unresolvedLoanProcess = (row1?.loanProcess || 0) + (row2?.loanProcess || 0) - (row3?.loanProcess || 0) - (row4?.loanProcess || 0);
    const unresolvedOthers = (row1?.others || 0) + (row2?.others || 0) - (row3?.others || 0) - (row4?.others || 0);
    const unresolvedTotal = unresolvedInterestRate + unresolvedAgreement + unresolvedRepayment + unresolvedLoanStatement + unresolvedLoanProcess + unresolvedOthers;

    rows.push({
      id: rowId++,
      particulars: "Unresolved complaints at the end of the quarter",
      number: unresolvedNumber,
      value: unresolvedValue,
      interestRate: unresolvedInterestRate,
      agreement: unresolvedAgreement,
      repayment: unresolvedRepayment,
      loanStatement: unresolvedLoanStatement,
      loanProcess: unresolvedLoanProcess,
      others: unresolvedOthers,
      total: unresolvedTotal,
      isCalculated: true,
      isFetched: false
    });

    return rows;
  };

  // Fetch data from CMS
  const fetchDataFromCMS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiService = ComplaintReportApiService.getInstance();
      const response = await apiService.fetchComplaintReportData();
      
      if (response.success) {
        setCmsData(response.data);
        setLastUpdated(response.lastUpdated);
        
        // Update global data store
        response.data.forEach(item => {
          onDataChange(`C${item.row}`, item.C);
          onDataChange(`D${item.row}`, item.D);
          onDataChange(`E${item.row}`, item.E);
          onDataChange(`F${item.row}`, item.F);
          onDataChange(`G${item.row}`, item.G);
          onDataChange(`H${item.row}`, item.H);
          onDataChange(`I${item.row}`, item.I);
          onDataChange(`J${item.row}`, item.J);
        });
      } else {
        throw new Error('Failed to fetch data from CMS');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    ComplaintReportApiService.getInstance().clearCache();
    fetchDataFromCMS();
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchDataFromCMS();
  }, []);

  // Update complaint rows when CMS data changes
  useEffect(() => {
    const rows = createComplaintRows();
    setComplaintRows(rows);
  }, [cmsData]);

  // Run validations
  const runValidations = (): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    
    if (!cmsData) return validationResults;

    // Validation 1: C1 = sum(E1:J1) - Balance at beginning of quarter
    const row1 = complaintRows.find(r => r.id === 1);
    if (row1) {
      const expectedTotal = row1.interestRate + row1.agreement + row1.repayment + 
                           row1.loanStatement + row1.loanProcess + row1.others;
      
      validationResults.push({
        id: 'V1',
        description: 'Row 1: Number = sum of natures',
        expected: expectedTotal,
        actual: row1.number,
        passed: Math.abs(row1.number - expectedTotal) < 0.01,
        error: row1.number !== expectedTotal ? 
          `Mismatch: Row 1 Number (${row1.number}) ≠ sum of natures (${expectedTotal})` : ''
      });
    }

    // Validation 2: C2 = sum(E2:J2) - Complaints received during the quarter
    const row2 = complaintRows.find(r => r.id === 2);
    if (row2) {
      const expectedTotal = row2.interestRate + row2.agreement + row2.repayment + 
                           row2.loanStatement + row2.loanProcess + row2.others;
    
    validationResults.push({
      id: 'V2',
        description: 'Row 2: Number = sum of natures',
        expected: expectedTotal,
        actual: row2.number,
        passed: Math.abs(row2.number - expectedTotal) < 0.01,
        error: row2.number !== expectedTotal ? 
          `Mismatch: Row 2 Number (${row2.number}) ≠ sum of natures (${expectedTotal})` : ''
      });
    }

    // Validation 3: C3 = sum(E3:J3) - Complaints resolved during the quarter
    const row3 = complaintRows.find(r => r.id === 3);
    if (row3) {
      const expectedTotal = row3.interestRate + row3.agreement + row3.repayment + 
                           row3.loanStatement + row3.loanProcess + row3.others;
      
      validationResults.push({
        id: 'V3',
        description: 'Row 3: Number = sum of natures',
        expected: expectedTotal,
        actual: row3.number,
        passed: Math.abs(row3.number - expectedTotal) < 0.01,
        error: row3.number !== expectedTotal ? 
          `Mismatch: Row 3 Number (${row3.number}) ≠ sum of natures (${expectedTotal})` : ''
      });
    }

    // Validation 4: C4 = sum(E4:J4) - Complaints withdrawn during the quarter
    const row4 = complaintRows.find(r => r.id === 4);
    if (row4) {
      const expectedTotal = row4.interestRate + row4.agreement + row4.repayment + 
                           row4.loanStatement + row4.loanProcess + row4.others;
      
        validationResults.push({
        id: 'V4',
        description: 'Row 4: Number = sum of natures',
        expected: expectedTotal,
        actual: row4.number,
        passed: Math.abs(row4.number - expectedTotal) < 0.01,
        error: row4.number !== expectedTotal ? 
          `Mismatch: Row 4 Number (${row4.number}) ≠ sum of natures (${expectedTotal})` : ''
      });
    }

    // Validation 5: C5 = C1 + C2 - C3 - C4 - Unresolved complaints
    const row5 = complaintRows.find(r => r.id === 5);
    if (row5 && row1 && row2 && row3 && row4) {
      const expectedNumber = row1.number + row2.number - row3.number - row4.number;
      
      validationResults.push({
        id: 'V5',
        description: 'Row 5: Unresolved = C1 + C2 - C3 - C4',
        expected: expectedNumber,
        actual: row5.number,
        passed: Math.abs(row5.number - expectedNumber) < 0.01,
        error: row5.number !== expectedNumber ? 
          `Mismatch: Unresolved (${row5.number}) ≠ C1+C2-C3-C4 (${expectedNumber})` : ''
      });
    }

    return validationResults;
  };

  // Update validations when data changes
  useEffect(() => {
    const newValidations = runValidations();
    setValidations(newValidations);
    onValidation(newValidations);
  }, [complaintRows]);

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getComplaintIcon = (rowId: number) => {
    switch (rowId) {
      case 1: return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 2: return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 3: return <XSquare className="w-4 h-4 text-orange-600" />;
      case 4: return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 5: return <Clock className="w-4 h-4 text-purple-600" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getComplaintStatus = (rowId: number) => {
    switch (rowId) {
      case 1: return { status: 'Balance', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 2: return { status: 'Received', color: 'text-green-600', bg: 'bg-green-50' };
      case 3: return { status: 'Resolved', color: 'text-orange-600', bg: 'bg-orange-50' };
      case 4: return { status: 'Withdrawn', color: 'text-red-600', bg: 'bg-red-50' };
      case 5: return { status: 'Unresolved', color: 'text-purple-600', bg: 'bg-purple-50' };
      default: return { status: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">COMPLAINT REPORT</h2>
          <h3 className="text-lg font-semibold text-gray-700">{institutionDetails.name}</h3>
          <p className="text-sm text-gray-600">
            Quarter End: {institutionDetails.quarterEndDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
              <RefreshCw className="w-4 h-4" />
              )}
              <span>Refresh Data</span>
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading data from CMS...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Complaint Report Table */}
        {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-12">S/No</th>
                <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700">Particulars</th>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-16">Number</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-20">Value</th>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-20">Interest Rate</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-20">Agreement</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-16">Repayment</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-20">Loan Statement</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-24">Loan Process</th>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-16">Others</th>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-20">Total</th>
              </tr>
            </thead>
            <tbody>
                {complaintRows.map((row) => {
                  const status = getComplaintStatus(row.id);
                return (
                    <tr key={row.id} className={`hover:bg-gray-50 ${row.isCalculated ? 'bg-blue-50 font-semibold' : ''}`}>
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">
                        {row.id}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                          {getComplaintIcon(row.id)}
                          <span className={row.isCalculated ? 'font-semibold' : ''}>{row.particulars}</span>
                        <span className={`text-xs px-2 py-1 rounded ${status.bg} ${status.color}`}>
                          {status.status}
                        </span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                          {row.number}
                        </span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                        <span className="text-gray-900">{formatTZSCurrency(row.value)}</span>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold' : ''}`}>
                          {row.interestRate}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold' : ''}`}>
                          {row.agreement}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold' : ''}`}>
                          {row.repayment}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold' : ''}`}>
                          {row.loanStatement}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold' : ''}`}>
                          {row.loanProcess}
                        </span>
                    </td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold' : ''}`}>
                          {row.others}
                          </span>
                      </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                        <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                          {row.total}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Validation Block */}
      {!isLoading && !error && (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Validation Results
        </h3>
        
        <div className="space-y-3">
          {validations.map((validation) => (
            <div
              key={validation.id}
              className={`p-4 rounded-lg border ${
                validation.passed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getValidationIcon(validation)}
                  <span className="font-medium text-gray-900">
                    {validation.description}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Expected: {validation.expected}
                  </div>
                  <div className="text-sm text-gray-600">
                    Actual: {validation.actual}
                  </div>
                </div>
              </div>
              {!validation.passed && validation.error && (
                <div className="mt-2 text-sm text-red-600">
                  {validation.error}
                </div>
              )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintReportMSP206;





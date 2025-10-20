import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  Download,
  Building,
  MapPin,
  User,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '../../constants/currencies';

interface GeographicalDistributionMSP210Props {
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
  balanceSheetData?: { [key: string]: number };
  loanPortfolioData?: { [key: string]: number };
}

interface ValidationResult {
  id: string;
  description: string;
  expected: number;
  actual: number;
  passed: boolean;
  error: string;
}

interface RegionItem {
  id: string;
  area: string;
  branches: number;
  employees: number;
  compulsorySavings: number;
  borrowersUp35Female: number;
  borrowersUp35Male: number;
  borrowersAbove35Female: number;
  borrowersAbove35Male: number;
  loansUp35Female: number;
  loansUp35Male: number;
  loansAbove35Female: number;
  loansAbove35Male: number;
  outstandingUp35Female: number;
  outstandingUp35Male: number;
  outstandingAbove35Female: number;
  outstandingAbove35Male: number;
  totalOutstanding: number;
  isCalculated: boolean;
  formula?: string;
}

const GeographicalDistributionMSP210: React.FC<GeographicalDistributionMSP210Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails,
  balanceSheetData = {},
  loanPortfolioData = {}
}) => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [showCalculations, setShowCalculations] = useState(false);
  const [selectedArea, setSelectedArea] = useState('all');
  const [regionItems, setRegionItems] = useState<RegionItem[]>([]);

  // Static regions in alphabetical order
  const staticRegions = [
    'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi',
    'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Mjini Magharibi',
    'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South',
    'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe',
    'Tabora', 'Tanga', 'Unguja North', 'Unguja South', 'Unguja Urban West'
  ];

  // Region structure with calculated rows (208 regions + 3 totals = 211 rows)
  const regionStructure = [
    // Mainland regions (Rows 2-209)
    ...staticRegions.filter(region => 
      !region.includes('Pemba') && !region.includes('Unguja') && !region.includes('Mjini')
    ).map((region, index) => ({
      id: `${index + 2}`,
      area: region,
      isCalculated: false
    })),
    // Row 210: Mainland Total
    { id: '210', area: 'Mainland Total', isCalculated: true, formula: 'sum(rows 2-209)' },
    // Zanzibar regions (Rows 212-227)
    ...staticRegions.filter(region => 
      region.includes('Pemba') || region.includes('Unguja') || region.includes('Mjini')
    ).map((region, index) => ({
      id: `${212 + index}`,
      area: region,
      isCalculated: false
    })),
    // Row 228: Zanzibar Total
    { id: '228', area: 'Zanzibar Total', isCalculated: true, formula: 'sum(rows 212-227)' },
    // Row 229: Grand Total
    { id: '229', area: 'Grand Total', isCalculated: true, formula: 'row 210 + row 228' }
  ];

  // Initialize region items
  useEffect(() => {
    const initialItems = regionStructure.map(item => ({
      id: item.id,
      area: item.area,
      branches: data[`B${item.id}`] || 0,
      employees: data[`C${item.id}`] || 0,
      compulsorySavings: data[`D${item.id}`] || 0,
      borrowersUp35Female: data[`E${item.id}`] || 0,
      borrowersUp35Male: data[`F${item.id}`] || 0,
      borrowersAbove35Female: data[`G${item.id}`] || 0,
      borrowersAbove35Male: data[`H${item.id}`] || 0,
      loansUp35Female: data[`I${item.id}`] || 0,
      loansUp35Male: data[`J${item.id}`] || 0,
      loansAbove35Female: data[`K${item.id}`] || 0,
      loansAbove35Male: data[`L${item.id}`] || 0,
      outstandingUp35Female: data[`M${item.id}`] || 0,
      outstandingUp35Male: data[`N${item.id}`] || 0,
      outstandingAbove35Female: data[`O${item.id}`] || 0,
      outstandingAbove35Male: data[`P${item.id}`] || 0,
      totalOutstanding: data[`Q${item.id}`] || 0,
      isCalculated: item.isCalculated,
      formula: item.formula
    }));
    setRegionItems(initialItems);
  }, [data]);

  // Calculate totals for each row
  const calculateRowTotals = () => {
    const updatedItems = regionItems.map(item => {
      if (item.isCalculated) {
        let calculatedValues = {
          branches: 0, employees: 0, compulsorySavings: 0,
          borrowersUp35Female: 0, borrowersUp35Male: 0,
          borrowersAbove35Female: 0, borrowersAbove35Male: 0,
          loansUp35Female: 0, loansUp35Male: 0,
          loansAbove35Female: 0, loansAbove35Male: 0,
          outstandingUp35Female: 0, outstandingUp35Male: 0,
          outstandingAbove35Female: 0, outstandingAbove35Male: 0,
          totalOutstanding: 0
        };

        if (item.id === '210') {
          // Mainland Total (rows 2-209)
          const mainlandItems = regionItems.filter(i => 
            !i.isCalculated && parseInt(i.id) >= 2 && parseInt(i.id) <= 209
          );
          calculatedValues = calculateTotals(mainlandItems);
        } else if (item.id === '228') {
          // Zanzibar Total (rows 212-227)
          const zanzibarItems = regionItems.filter(i => 
            !i.isCalculated && parseInt(i.id) >= 212 && parseInt(i.id) <= 227
          );
          calculatedValues = calculateTotals(zanzibarItems);
        } else if (item.id === '229') {
          // Grand Total (row 210 + row 228)
          const mainlandTotal = regionItems.find(i => i.id === '210');
          const zanzibarTotal = regionItems.find(i => i.id === '228');
          if (mainlandTotal && zanzibarTotal) {
            calculatedValues = {
              branches: mainlandTotal.branches + zanzibarTotal.branches,
              employees: mainlandTotal.employees + zanzibarTotal.employees,
              compulsorySavings: mainlandTotal.compulsorySavings + zanzibarTotal.compulsorySavings,
              borrowersUp35Female: mainlandTotal.borrowersUp35Female + zanzibarTotal.borrowersUp35Female,
              borrowersUp35Male: mainlandTotal.borrowersUp35Male + zanzibarTotal.borrowersUp35Male,
              borrowersAbove35Female: mainlandTotal.borrowersAbove35Female + zanzibarTotal.borrowersAbove35Female,
              borrowersAbove35Male: mainlandTotal.borrowersAbove35Male + zanzibarTotal.borrowersAbove35Male,
              loansUp35Female: mainlandTotal.loansUp35Female + zanzibarTotal.loansUp35Female,
              loansUp35Male: mainlandTotal.loansUp35Male + zanzibarTotal.loansUp35Male,
              loansAbove35Female: mainlandTotal.loansAbove35Female + zanzibarTotal.loansAbove35Female,
              loansAbove35Male: mainlandTotal.loansAbove35Male + zanzibarTotal.loansAbove35Male,
              outstandingUp35Female: mainlandTotal.outstandingUp35Female + zanzibarTotal.outstandingUp35Female,
              outstandingUp35Male: mainlandTotal.outstandingUp35Male + zanzibarTotal.outstandingUp35Male,
              outstandingAbove35Female: mainlandTotal.outstandingAbove35Female + zanzibarTotal.outstandingAbove35Female,
              outstandingAbove35Male: mainlandTotal.outstandingAbove35Male + zanzibarTotal.outstandingAbove35Male,
              totalOutstanding: mainlandTotal.totalOutstanding + zanzibarTotal.totalOutstanding
            };
          }
        }

        return {
          ...item,
          ...calculatedValues
        };
      } else {
        // For non-calculated rows, calculate total outstanding
        const totalOutstanding = item.outstandingUp35Female + item.outstandingUp35Male + 
                               item.outstandingAbove35Female + item.outstandingAbove35Male;
        return {
          ...item,
          totalOutstanding
        };
      }
    });

    setRegionItems(updatedItems);
  };

  const calculateTotals = (items: RegionItem[]) => {
    return items.reduce((totals, item) => ({
      branches: totals.branches + item.branches,
      employees: totals.employees + item.employees,
      compulsorySavings: totals.compulsorySavings + item.compulsorySavings,
      borrowersUp35Female: totals.borrowersUp35Female + item.borrowersUp35Female,
      borrowersUp35Male: totals.borrowersUp35Male + item.borrowersUp35Male,
      borrowersAbove35Female: totals.borrowersAbove35Female + item.borrowersAbove35Female,
      borrowersAbove35Male: totals.borrowersAbove35Male + item.borrowersAbove35Male,
      loansUp35Female: totals.loansUp35Female + item.loansUp35Female,
      loansUp35Male: totals.loansUp35Male + item.loansUp35Male,
      loansAbove35Female: totals.loansAbove35Female + item.loansAbove35Female,
      loansAbove35Male: totals.loansAbove35Male + item.loansAbove35Male,
      outstandingUp35Female: totals.outstandingUp35Female + item.outstandingUp35Female,
      outstandingUp35Male: totals.outstandingUp35Male + item.outstandingUp35Male,
      outstandingAbove35Female: totals.outstandingAbove35Female + item.outstandingAbove35Female,
      outstandingAbove35Male: totals.outstandingAbove35Male + item.outstandingAbove35Male,
      totalOutstanding: totals.totalOutstanding + item.totalOutstanding
    }), {
      branches: 0, employees: 0, compulsorySavings: 0,
      borrowersUp35Female: 0, borrowersUp35Male: 0,
      borrowersAbove35Female: 0, borrowersAbove35Male: 0,
      loansUp35Female: 0, loansUp35Male: 0,
      loansAbove35Female: 0, loansAbove35Male: 0,
      outstandingUp35Female: 0, outstandingUp35Male: 0,
      outstandingAbove35Female: 0, outstandingAbove35Male: 0,
      totalOutstanding: 0
    });
  };

  // Update calculations when data changes
  useEffect(() => {
    calculateRowTotals();
  }, [regionItems]);

  // Run validations
  const runValidations = (): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    
    // Validation 1: E229 == MSP2_01.C46 (Compulsory Savings)
    const e229 = regionItems.find(item => item.id === '229')?.compulsorySavings || 0;
    const msp201C46 = balanceSheetData['C46'] || 0;
    
    if (msp201C46 > 0) {
      validationResults.push({
        id: 'V1',
        description: 'Compulsory Savings = MSP2_01.C46',
        expected: msp201C46,
        actual: e229,
        passed: Math.abs(e229 - msp201C46) < 0.01,
        error: e229 !== msp201C46 ? 
          `Mismatch: Compulsory Savings (${formatCurrency(e229)}) ≠ MSP2_01.C46 (${formatCurrency(msp201C46)})` : ''
      });
    }

    // Validation 2: Total Outstanding == MSP2_03.D67
    const totalOutstanding = regionItems.find(item => item.id === '229')?.totalOutstanding || 0;
    const msp203D67 = loanPortfolioData['D67'] || 0;
    
    if (msp203D67 > 0) {
      validationResults.push({
        id: 'V2',
        description: 'Total Outstanding = MSP2_03.D67',
        expected: msp203D67,
        actual: totalOutstanding,
        passed: Math.abs(totalOutstanding - msp203D67) < 0.01,
        error: totalOutstanding !== msp203D67 ? 
          `Mismatch: Total Outstanding (${formatCurrency(totalOutstanding)}) ≠ MSP2_03.D67 (${formatCurrency(msp203D67)})` : ''
      });
    }

    return validationResults;
  };

  // Update validations when data changes
  useEffect(() => {
    const newValidations = runValidations();
    setValidations(newValidations);
    onValidation(newValidations);
  }, [regionItems, balanceSheetData, loanPortfolioData]);

  const handleItemChange = (itemId: string, field: keyof RegionItem, value: number) => {
    setRegionItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
    
    // Update data store
    const dataKey = field === 'branches' ? 'B' : 
                   field === 'employees' ? 'C' :
                   field === 'compulsorySavings' ? 'D' :
                   field === 'borrowersUp35Female' ? 'E' :
                   field === 'borrowersUp35Male' ? 'F' :
                   field === 'borrowersAbove35Female' ? 'G' :
                   field === 'borrowersAbove35Male' ? 'H' :
                   field === 'loansUp35Female' ? 'I' :
                   field === 'loansUp35Male' ? 'J' :
                   field === 'loansAbove35Female' ? 'K' :
                   field === 'loansAbove35Male' ? 'L' :
                   field === 'outstandingUp35Female' ? 'M' :
                   field === 'outstandingUp35Male' ? 'N' :
                   field === 'outstandingAbove35Female' ? 'O' :
                   field === 'outstandingAbove35Male' ? 'P' : 'Q';
    
    onDataChange(`${dataKey}${itemId}`, value);
  };

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const filteredItems = regionItems.filter(item => 
    selectedArea === 'all' || item.area.toLowerCase().includes(selectedArea.toLowerCase())
  );

  const grandTotal = regionItems.find(item => item.id === '229');

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">GEOGRAPHICAL DISTRIBUTION</h2>
          <h3 className="text-lg font-semibold text-gray-700">{institutionDetails.name}</h3>
          <p className="text-sm text-gray-600">
            Date: {institutionDetails.quarterEndDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Areas</option>
              <option value="mainland">Mainland</option>
              <option value="zanzibar">Zanzibar</option>
              {staticRegions.map((region, index) => (
                <option key={index} value={region}>{region}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCalculations(!showCalculations)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{showCalculations ? 'Hide' : 'Show'} Calculations</span>
            </button>
          </div>
        </div>

        {/* Geographical Distribution Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-8">S/No</th>
                <th className="border border-gray-300 px-1 py-2 text-left font-medium text-gray-700 w-20">Area</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Branches</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Employees</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-16">Compulsory Savings</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Borrowers ≤35 F</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Borrowers ≤35 M</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Borrowers &gt;35 F</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Borrowers &gt;35 M</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Loans ≤35 F</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Loans ≤35 M</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Loans &gt;35 F</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-12">Loans &gt;35 M</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-16">Outstanding ≤35 F</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-16">Outstanding ≤35 M</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-16">Outstanding &gt;35 F</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-16">Outstanding &gt;35 M</th>
                <th className="border border-gray-300 px-1 py-2 text-center font-medium text-gray-700 w-16">Total Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.isCalculated ? 'bg-blue-50 font-semibold' : ''}`}>
                  <td className="border border-gray-300 px-1 py-2 text-center text-gray-600">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-1 py-2 text-gray-900">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span className={item.isCalculated ? 'font-semibold' : ''}>{item.area}</span>
                      {item.isCalculated && (
                        <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-600">
                          Total
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-1 py-2 text-center">
                    {isEditing && !item.isCalculated ? (
                      <input
                        type="number"
                        value={item.branches}
                        onChange={(e) => handleItemChange(item.id, 'branches', parseInt(e.target.value) || 0)}
                        className="w-full px-1 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {item.branches}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-1 py-2 text-center">
                    {isEditing && !item.isCalculated ? (
                      <input
                        type="number"
                        value={item.employees}
                        onChange={(e) => handleItemChange(item.id, 'employees', parseInt(e.target.value) || 0)}
                        className="w-full px-1 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {item.employees}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-1 py-2 text-right">
                    {isEditing && !item.isCalculated ? (
                      <input
                        type="number"
                        value={item.compulsorySavings}
                        onChange={(e) => handleItemChange(item.id, 'compulsorySavings', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatCurrency(item.compulsorySavings)}
                      </span>
                    )}
                  </td>
                  {/* Borrowers columns */}
                  {['borrowersUp35Female', 'borrowersUp35Male', 'borrowersAbove35Female', 'borrowersAbove35Male'].map((field) => (
                    <td key={field} className="border border-gray-300 px-1 py-2 text-center">
                      {isEditing && !item.isCalculated ? (
                        <input
                          type="number"
                          value={item[field as keyof RegionItem] as number}
                          onChange={(e) => handleItemChange(item.id, field as keyof RegionItem, parseInt(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                          {(item[field as keyof RegionItem] as number).toLocaleString()}
                        </span>
                      )}
                    </td>
                  ))}
                  {/* Loans columns */}
                  {['loansUp35Female', 'loansUp35Male', 'loansAbove35Female', 'loansAbove35Male'].map((field) => (
                    <td key={field} className="border border-gray-300 px-1 py-2 text-center">
                      {isEditing && !item.isCalculated ? (
                        <input
                          type="number"
                          value={item[field as keyof RegionItem] as number}
                          onChange={(e) => handleItemChange(item.id, field as keyof RegionItem, parseInt(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                          {(item[field as keyof RegionItem] as number).toLocaleString()}
                        </span>
                      )}
                    </td>
                  ))}
                  {/* Outstanding columns */}
                  {['outstandingUp35Female', 'outstandingUp35Male', 'outstandingAbove35Female', 'outstandingAbove35Male'].map((field) => (
                    <td key={field} className="border border-gray-300 px-1 py-2 text-right">
                      {isEditing && !item.isCalculated ? (
                        <input
                          type="number"
                          value={item[field as keyof RegionItem] as number}
                          onChange={(e) => handleItemChange(item.id, field as keyof RegionItem, parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                          {formatCurrency(item[field as keyof RegionItem] as number)}
                        </span>
                      )}
                    </td>
                  ))}
                  {/* Total Outstanding */}
                  <td className="border border-gray-300 px-1 py-2 text-right">
                    <span className={`${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                      {formatCurrency(item.totalOutstanding)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Block */}
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
                    Expected: {formatCurrency(validation.expected)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Actual: {formatCurrency(validation.actual)}
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

      {/* Footer Block - Grand Totals */}
      {grandTotal && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grand Totals Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Infrastructure */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Infrastructure
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Total Branches:</span>
                  <span className="font-semibold text-blue-600">{grandTotal.branches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Total Employees:</span>
                  <span className="font-semibold text-blue-600">{grandTotal.employees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Compulsory Savings:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(grandTotal.compulsorySavings)}</span>
                </div>
              </div>
            </div>

            {/* Borrowers */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Borrowers
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Female ≤35:</span>
                  <span className="font-semibold text-pink-600">{grandTotal.borrowersUp35Female.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Male ≤35:</span>
                  <span className="font-semibold text-blue-600">{grandTotal.borrowersUp35Male.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Female &gt;35:</span>
                  <span className="font-semibold text-pink-600">{grandTotal.borrowersAbove35Female.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Male &gt;35:</span>
                  <span className="font-semibold text-blue-600">{grandTotal.borrowersAbove35Male.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Outstanding Loans */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                Outstanding Loans
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Total Outstanding:</span>
                  <span className="font-semibold text-purple-600">{formatCurrency(grandTotal.totalOutstanding)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Female Outstanding:</span>
                  <span className="font-semibold text-pink-600">
                    {formatCurrency(grandTotal.outstandingUp35Female + grandTotal.outstandingAbove35Female)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Male Outstanding:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(grandTotal.outstandingUp35Male + grandTotal.outstandingAbove35Male)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicalDistributionMSP210;


import * as XLSX from 'xlsx';

export interface ExportData {
  [sheetName: string]: any[][];
}

export interface ExportOptions {
  includeCharts?: boolean;
  includeFormulas?: boolean;
  compressPdf?: boolean;
  filename?: string;
}

/**
 * Export data to Excel format
 */
export const exportToExcel = (
  data: ExportData,
  options: ExportOptions = {}
): void => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Add each sheet to the workbook
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths for better formatting
      const colWidths = sheetData[0]?.map((_, index) => {
        const maxLength = Math.max(
          ...sheetData.map(row => 
            row[index] ? String(row[index]).length : 0
          )
        );
        return { wch: Math.min(Math.max(maxLength, 10), 50) };
      }) || [];
      
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = options.filename || `BOT_Regulatory_Reports_${timestamp}.xlsx`;
    
    // Save the file
    XLSX.writeFile(workbook, filename);
    
    console.log(`Excel file exported successfully: ${filename}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export Excel file');
  }
};

/**
 * Export data to PDF format (simplified implementation)
 * Note: This is a basic implementation. For production, consider using libraries like jsPDF or Puppeteer
 */
export const exportToPDF = (
  data: ExportData,
  options: ExportOptions = {}
): void => {
  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check popup blockers.');
    }
    
    // Generate HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>BOT Regulatory Reports</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .sheet { page-break-before: always; margin-bottom: 30px; }
            .sheet:first-child { page-break-before: auto; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Bank of Tanzania Regulatory Reports</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
    `;
    
    // Add each sheet as a table
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      htmlContent += `
        <div class="sheet">
          <h2>${sheetName}</h2>
          <table>
            <thead>
              <tr>
                ${sheetData[0]?.map(header => `<th>${header || ''}</th>`).join('') || ''}
              </tr>
            </thead>
            <tbody>
              ${sheetData.slice(1).map(row => 
                `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      `;
    });
    
    htmlContent += `
          <div class="footer">
            <p>This document was generated automatically by the BOT Regulatory Reporting System</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    console.log('PDF export initiated');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF file');
  }
};

/**
 * Export all reports to Excel
 */
export const exportAllReportsToExcel = (dataStore: any, institutionDetails: any): void => {
  const exportData: ExportData = {};
  
  // Balance Sheet
  if (dataStore.balanceSheet) {
    exportData['Balance_Sheet_MSP201'] = [
      ['Particulars', 'Amount (TZS)'],
      ['1. CASH AND CASH EQUIVALENTS', dataStore.balanceSheet.cashAndCashEquivalents || 0],
      [' (a) Cash in Hand', dataStore.balanceSheet.cashInHand || 0],
      [' (b) Balances with Banks', dataStore.balanceSheet.balancesWithBanks || 0],
      ['2. INVESTMENT IN DEBT SECURITIES', dataStore.balanceSheet.investmentInDebtSecurities || 0],
      ['3. EQUITY INVESTMENTS', dataStore.balanceSheet.equityInvestments || 0],
      ['4. LOANS - NET', dataStore.balanceSheet.loansNet || 0],
      ['5. PROPERTY, PLANT AND EQUIPMENT', dataStore.balanceSheet.propertyPlantEquipment || 0],
      ['6. OTHER ASSETS', dataStore.balanceSheet.otherAssets || 0],
      ['TOTAL ASSETS', dataStore.balanceSheet.totalAssets || 0]
    ];
  }
  
  // Income Statement
  if (dataStore.incomeStatement) {
    exportData['Income_Statement_MSP202'] = [
      ['Particulars', 'Quarterly', 'YTD'],
      ['Interest Income', dataStore.incomeStatement.interestIncome?.quarterly || 0, dataStore.incomeStatement.interestIncome?.ytd || 0],
      ['Interest Expense', dataStore.incomeStatement.interestExpense?.quarterly || 0, dataStore.incomeStatement.interestExpense?.ytd || 0],
      ['Net Interest Income', dataStore.incomeStatement.netInterestIncome?.quarterly || 0, dataStore.incomeStatement.netInterestIncome?.ytd || 0],
      ['Operating Expenses', dataStore.incomeStatement.operatingExpenses?.quarterly || 0, dataStore.incomeStatement.operatingExpenses?.ytd || 0],
      ['Net Profit', dataStore.incomeStatement.netProfit?.quarterly || 0, dataStore.incomeStatement.netProfit?.ytd || 0]
    ];
  }
  
  // Add more sheets as needed...
  
  exportToExcel(exportData, {
    filename: `BOT_Regulatory_Reports_${institutionDetails.mspCode}_${new Date().toISOString().split('T')[0]}.xlsx`,
    includeCharts: true,
    includeFormulas: true
  });
};

/**
 * Export all reports to PDF
 */
export const exportAllReportsToPDF = (dataStore: any, institutionDetails: any): void => {
  const exportData: ExportData = {};
  
  // Similar structure as Excel export
  if (dataStore.balanceSheet) {
    exportData['Balance Sheet (MSP2_01)'] = [
      ['Particulars', 'Amount (TZS)'],
      ['1. CASH AND CASH EQUIVALENTS', dataStore.balanceSheet.cashAndCashEquivalents || 0],
      [' (a) Cash in Hand', dataStore.balanceSheet.cashInHand || 0],
      [' (b) Balances with Banks', dataStore.balanceSheet.balancesWithBanks || 0],
      ['2. INVESTMENT IN DEBT SECURITIES', dataStore.balanceSheet.investmentInDebtSecurities || 0],
      ['3. EQUITY INVESTMENTS', dataStore.balanceSheet.equityInvestments || 0],
      ['4. LOANS - NET', dataStore.balanceSheet.loansNet || 0],
      ['5. PROPERTY, PLANT AND EQUIPMENT', dataStore.balanceSheet.propertyPlantEquipment || 0],
      ['6. OTHER ASSETS', dataStore.balanceSheet.otherAssets || 0],
      ['TOTAL ASSETS', dataStore.balanceSheet.totalAssets || 0]
    ];
  }
  
  if (dataStore.incomeStatement) {
    exportData['Income Statement (MSP2_02)'] = [
      ['Particulars', 'Quarterly', 'YTD'],
      ['Interest Income', dataStore.incomeStatement.interestIncome?.quarterly || 0, dataStore.incomeStatement.interestIncome?.ytd || 0],
      ['Interest Expense', dataStore.incomeStatement.interestExpense?.quarterly || 0, dataStore.incomeStatement.interestExpense?.ytd || 0],
      ['Net Interest Income', dataStore.incomeStatement.netInterestIncome?.quarterly || 0, dataStore.incomeStatement.netInterestIncome?.ytd || 0],
      ['Operating Expenses', dataStore.incomeStatement.operatingExpenses?.quarterly || 0, dataStore.incomeStatement.operatingExpenses?.ytd || 0],
      ['Net Profit', dataStore.incomeStatement.netProfit?.quarterly || 0, dataStore.incomeStatement.netProfit?.ytd || 0]
    ];
  }
  
  exportToPDF(exportData, {
    filename: `BOT_Regulatory_Reports_${institutionDetails.mspCode}_${new Date().toISOString().split('T')[0]}.pdf`,
    includeCharts: true
  });
};

/**
 * Export current report to Excel
 */
export const exportCurrentReportToExcel = (
  reportId: string,
  reportData: any,
  institutionDetails: any,
  reportTitle?: string
): void => {
  const reportName = reportTitle || getReportName(reportId);
  const exportData: ExportData = {
    [reportName]: convertReportDataToArray(reportData, reportId)
  };
  
  exportToExcel(exportData, {
    filename: `${reportName}_${institutionDetails.mspCode}_${new Date().toISOString().split('T')[0]}.xlsx`
  });
};

/**
 * Export current report to PDF
 */
export const exportCurrentReportToPDF = (
  reportId: string,
  reportData: any,
  institutionDetails: any,
  reportTitle?: string
): void => {
  const reportName = reportTitle || getReportName(reportId);
  const exportData: ExportData = {
    [reportName]: convertReportDataToArray(reportData, reportId)
  };
  
  exportToPDF(exportData, {
    filename: `${reportName}_${institutionDetails.mspCode}_${new Date().toISOString().split('T')[0]}.pdf`
  });
};

/**
 * Get report name by ID - using exact titles from reportPages array
 */
const getReportName = (reportId: string): string => {
  const reportNames: { [key: string]: string } = {
    'balance-sheet': 'Balance Sheet (MSP2_01)',
    'income-statement': 'Income Statement (MSP2_02)',
    'loan-portfolio': 'Loan Portfolio (MSP2_03)',
    'interest-rates': 'Interest Rates (MSP2_04)',
    'liquid-assets': 'Liquid Assets (MSP2_05)',
    'complaint-report': 'Complaint Report (MSP2_06)',
    'deposits-borrowings': 'Deposits & Borrowings (MSP2_07)',
    'agent-banking-balances': 'Agent Banking Balances (MSP2_08)',
    'loans-disbursed': 'Loans Disbursed (MSP2_09)',
    'geographical-distribution': 'Geographical Distribution (MSP2_10)',
    'provisions': 'Provisions (MSP2_04)',
    'borrowings': 'Borrowings (MSP2_07)'
  };
  
  return reportNames[reportId] || 'Unknown Report';
};

/**
 * Convert report data to array format for export
 */
const convertReportDataToArray = (reportData: any, reportId: string): any[][] => {
  // This is a simplified conversion. In a real implementation,
  // you would have specific conversion logic for each report type
  const rows: any[][] = [];
  
  if (reportData && typeof reportData === 'object') {
    rows.push(['Field', 'Value']);
    Object.entries(reportData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        rows.push([key, value]);
      }
    });
  } else {
    rows.push(['No data available']);
  }
  
  return rows;
};

/**
 * Generate historical comparison data
 */
export const generateHistoricalComparison = (currentData: any, historicalData: any[]) => {
  return {
    quarterlyGrowth: calculateGrowthRate(currentData, historicalData[0]),
    yearlyGrowth: calculateGrowthRate(currentData, historicalData[3]),
    industryBenchmark: getIndustryBenchmark(),
    trends: analyzeTrends(historicalData)
  };
};

/**
 * Calculate growth rate between two data points
 */
const calculateGrowthRate = (current: any, previous: any): number => {
  if (!current || !previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get industry benchmark data
 */
const getIndustryBenchmark = () => {
  // This would typically come from an API or database
  return {
    averageGrowth: 15.2,
    medianGrowth: 12.8,
    topQuartile: 22.1
  };
};

/**
 * Analyze trends from historical data
 */
const analyzeTrends = (historicalData: any[]) => {
  if (historicalData.length < 2) return null;
  
  const values = historicalData.map(d => d.value || 0);
  const trend = values[values.length - 1] > values[0] ? 'increasing' : 'decreasing';
  const volatility = calculateVolatility(values);
  
  return {
    trend,
    volatility,
    projection: projectNextPeriod(values)
  };
};

/**
 * Calculate volatility of a series
 */
const calculateVolatility = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Project next period value
 */
const projectNextPeriod = (values: number[]): number => {
  if (values.length < 2) return values[0] || 0;
  
  const recentTrend = (values[values.length - 1] - values[values.length - 2]) / values[values.length - 2];
  return values[values.length - 1] * (1 + recentTrend);
};












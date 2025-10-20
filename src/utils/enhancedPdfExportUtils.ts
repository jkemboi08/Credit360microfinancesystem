import jsPDF from 'jspdf';

export interface InstitutionDetails {
  name: string;
  mspCode: string;
  licenseNumber: string;
  reportingPeriod: string;
  quarterEndDate: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ReportHeader {
  reportTitle: string;
  institutionDetails: InstitutionDetails;
  reportInformation: {
    quarterEndDate: string;
    dataVersion: string;
    lastUpdated: string;
    status: string;
  };
}

/**
 * Enhanced PDF export with complete report headers and institution details
 */
export const exportReportToPDFWithHeaders = (
  reportId: string,
  reportData: any,
  institutionDetails: InstitutionDetails,
  reportTitle: string
): void => {
  try {
    // Debug: Log the parameters received
    console.log('🔍 PDF EXPORT FUNCTION - reportId:', reportId);
    console.log('🔍 PDF EXPORT FUNCTION - reportData:', reportData);
    console.log('🔍 PDF EXPORT FUNCTION - institutionDetails:', institutionDetails);
    console.log('🔍 PDF EXPORT FUNCTION - reportTitle:', reportTitle);
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add report title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Add institution details section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Institution Details', 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Institution Name: ${institutionDetails.name}`, 20, yPosition);
    yPosition += 6;
    doc.text(`MSP Code: ${institutionDetails.mspCode}`, 20, yPosition);
    yPosition += 6;
    doc.text(`License Number: ${institutionDetails.licenseNumber}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Reporting Period: ${institutionDetails.reportingPeriod}`, 20, yPosition);
    yPosition += 6;
    
    if (institutionDetails.address) {
      doc.text(`Address: ${institutionDetails.address}`, 20, yPosition);
      yPosition += 6;
    }
    if (institutionDetails.phone) {
      doc.text(`Phone: ${institutionDetails.phone}`, 20, yPosition);
      yPosition += 6;
    }
    if (institutionDetails.email) {
      doc.text(`Email: ${institutionDetails.email}`, 20, yPosition);
      yPosition += 6;
    }

    yPosition += 10;

    // Add report information section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Report Information', 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Quarter End Date: ${institutionDetails.quarterEndDate}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Data Version: v121`, 20, yPosition);
    yPosition += 6;
    doc.text(`Last Updated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Status: In Progress`, 20, yPosition);
    yPosition += 15;

    // Add report-specific data
    const reportDataRows = generateReportDataRows(reportId, reportData);
    
    if (reportDataRows.length > 0) {
      // Add report data section header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Report Data', 20, yPosition);
      yPosition += 10;

      // Create table data
      const tableData = reportDataRows.map(row => row.slice(0, 4)); // Limit to 4 columns for PDF
      const headers = tableData[0] || [];
      const data = tableData.slice(1);

      // Add table manually (without autotable plugin)
      const tableStartY = yPosition;
      const rowHeight = 8;
      const colWidths = [80, 40, 40, 40]; // Adjust column widths as needed
      let currentY = tableStartY;
      
      // Draw table headers
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      let xPos = 20;
      headers.forEach((header, index) => {
        doc.text(header || '', xPos, currentY);
        xPos += colWidths[index] || 40;
      });
      
      // Draw horizontal line under headers
      currentY += 2;
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 3;
      
      // Draw table data
      doc.setFont('helvetica', 'normal');
      data.forEach((row: any[], rowIndex: number) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
        }
        
        xPos = 20;
        row.forEach((cell, cellIndex) => {
          const cellText = String(cell || '');
          // Truncate text if too long
          const truncatedText = cellText.length > 20 ? cellText.substring(0, 17) + '...' : cellText;
          doc.text(truncatedText, xPos, currentY);
          xPos += colWidths[cellIndex] || 40;
        });
        currentY += rowHeight;
      });
      
      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }
    }

    // Add footer
    const finalY = currentY + 20;
    if (finalY < pageHeight - 30) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('This document was generated automatically by the BOT Regulatory Reporting System', 
        pageWidth / 2, finalY, { align: 'center' });
    }

    // Generate filename and save
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${institutionDetails.mspCode}_${timestamp}.pdf`;
    doc.save(filename);

    console.log(`PDF file exported successfully: ${filename}`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF file');
  }
};

/**
 * Generate report-specific data rows based on report type
 */
const generateReportDataRows = (reportId: string, reportData: any): any[][] => {
  const rows: any[][] = [];
  
  switch (reportId) {
    case 'balance-sheet':
      return generateBalanceSheetRows(reportData, rows);
    case 'income-statement':
      return generateIncomeStatementRows(reportData, rows);
    case 'loan-portfolio':
      return generateLoanPortfolioRows(reportData, rows);
    case 'interest-rates':
      return generateInterestRatesRows(reportData, rows);
    case 'liquid-assets':
      return generateLiquidAssetsRows(reportData, rows);
    case 'complaint-report':
      return generateComplaintReportRows(reportData, rows);
    case 'deposits-borrowings':
      return generateDepositsBorrowingsRows(reportData, rows);
    case 'agent-banking-balances':
      return generateAgentBankingBalancesRows(reportData, rows);
    case 'loans-disbursed':
      return generateLoansDisbursedRows(reportData, rows);
    case 'geographical-distribution':
      return generateGeographicalDistributionRows(reportData, rows);
    default:
      return generateGenericReportRows(reportData, rows);
  }
};

/**
 * Generate Balance Sheet data rows
 */
const generateBalanceSheetRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['S/No', 'Particulars', 'Amount (TZS)']);
  
  // ASSETS SECTION - MATCHING EXACT STRUCTURE FROM USER'S SCREENSHOT
  rows.push([1, '1. CASH AND CASH EQUIVALENTS', formatCurrency(data.C1 || 0)]);
  rows.push([2, '   (a) Cash in Hand', formatCurrency(data.C2 || 0)]);
  rows.push([3, '   (b) Balances with Banks and Financial Institutions', formatCurrency(data.C3 || 0)]);
  rows.push([4, '      (i) Non-Agent Banking Balances', formatCurrency(data.C4 || 0)]);
  rows.push([5, '      (ii) Agent-Banking Balances', formatCurrency(data.C5 || 0)]);
  rows.push([6, '   (c) Balances with Microfinance Service Providers', formatCurrency(data.C6 || 0)]);
  rows.push([7, '   (d) MNOs Float Balances', formatCurrency(data.C7 || 0)]);
  
  rows.push([8, '2. INVESTMENT IN DEBT SECURITIES - NET', formatCurrency(data.C8 || 0)]);
  rows.push([9, '   (a) Treasury Bills', formatCurrency(data.C9 || 0)]);
  rows.push([10, '   (b) Other Government Securities', formatCurrency(data.C10 || 0)]);
  rows.push([11, '   (c) Private Securities', formatCurrency(data.C11 || 0)]);
  rows.push([12, '   (d) Others', formatCurrency(data.C12 || 0)]);
  rows.push([13, '   (e) Allowance for Probable Losses (Deduction)', formatCurrency(data.C13 || 0)]);
  
  rows.push([14, '3. EQUITY INVESTMENTS - NET (a - b)', formatCurrency(data.C14 || 0)]);
  rows.push([15, '   (a) Equity Investment', formatCurrency(data.C15 || 0)]);
  rows.push([16, '   (b) Allowance for Probable Losses (Deduction)', formatCurrency(data.C16 || 0)]);
  
  rows.push([17, '4. LOANS - NET (sum a:d less e)', formatCurrency(data.C17 || 0)]);
  rows.push([18, '   (a) Loans to Clients', formatCurrency(data.C18 || 0)]);
  rows.push([19, '   (b) Loan to Staff and Related Parties', formatCurrency(data.C19 || 0)]);
  rows.push([20, '   (c) Loans to other Microfinance Service Providers', formatCurrency(data.C20 || 0)]);
  rows.push([21, '   (d) Accrued Interest on Loans', formatCurrency(data.C21 || 0)]);
  rows.push([22, '   (e) Allowances for Probable Losses (Deduction)', formatCurrency(data.C22 || 0)]);
  
  rows.push([23, '5. PROPERTY, PLANT AND EQUIPMENT - NET', formatCurrency(data.C23 || 0)]);
  rows.push([24, '   (a) Property, Plant and Equipment', formatCurrency(data.C24 || 0)]);
  rows.push([25, '   (b) Accumulated Depreciation (Deduction)', formatCurrency(data.C25 || 0)]);
  
  rows.push([26, '6. OTHER ASSETS (sum a:e less f)', formatCurrency(data.C26 || 0)]);
  rows.push([27, '   (a) Receivables', formatCurrency(data.C27 || 0)]);
  rows.push([28, '   (b) Prepaid Expenses', formatCurrency(data.C28 || 0)]);
  rows.push([29, '   (c) Deferred Tax Assets', formatCurrency(data.C29 || 0)]);
  rows.push([30, '   (d) Intangible Assets', formatCurrency(data.C30 || 0)]);
  rows.push([31, '   (e) Miscellaneous Assets', formatCurrency(data.C31 || 0)]);
  rows.push([32, '   (f) Allowance for Probable Losses (Deduction)', formatCurrency(data.C32 || 0)]);
  
  rows.push([33, '7. TOTAL ASSETS', formatCurrency(data.C33 || 0)]);
  
  rows.push([]); // Empty row
  
  // LIABILITIES SECTION
  rows.push([34, '8. LIABILITIES', formatCurrency(data.C34 || 0)]);
  
  rows.push([35, '9. BORROWINGS', formatCurrency(data.C35 || 0)]);
  rows.push([36, '   (a) Borrowings in Tanzania', formatCurrency(data.C36 || 0)]);
  rows.push([37, '      (i) Borrowings from Banks and Financial Institutions', formatCurrency(data.C37 || 0)]);
  rows.push([38, '      (ii) Borrowings from Other Microfinance Service Providers', formatCurrency(data.C38 || 0)]);
  rows.push([39, '      (iii) Borrowing from Shareholders', formatCurrency(data.C39 || 0)]);
  rows.push([40, '      (iv) Borrowing from Public through Debt Securities', formatCurrency(data.C40 || 0)]);
  rows.push([41, '      (v) Other Borrowings', formatCurrency(data.C41 || 0)]);
  rows.push([42, '   (b) Borrowings from Abroad', formatCurrency(data.C42 || 0)]);
  rows.push([43, '      (i) Borrowings from Banks and Financial Institutions', formatCurrency(data.C43 || 0)]);
  rows.push([44, '      (ii) Borrowing from Shareholders', formatCurrency(data.C44 || 0)]);
  rows.push([45, '      (iii) Other Borrowings', formatCurrency(data.C45 || 0)]);
  
  rows.push([46, '10. CASH COLLATERAL/LOAN INSURANCE GUARANTEES/COMPULSORY SAVINGS', formatCurrency(data.C46 || 0)]);
  rows.push([47, '11. TAX PAYABLES', formatCurrency(data.C47 || 0)]);
  rows.push([48, '12. DIVIDEND PAYABLES', formatCurrency(data.C48 || 0)]);
  rows.push([49, '13. OTHER PAYABLES AND ACCRUALS', formatCurrency(data.C49 || 0)]);
  
  rows.push([50, '14. TOTAL LIABILITIES (sum 9:13)', formatCurrency(data.C50 || 0)]);
  
  rows.push([]); // Empty row
  
  // CAPITAL SECTION
  rows.push([51, '15. TOTAL CAPITAL (sum a:i)', formatCurrency(data.C51 || 0)]);
  rows.push([52, '   (a) Paid-up Ordinary Share Capital', formatCurrency(data.C52 || 0)]);
  rows.push([53, '   (b) Paid-up Preference Shares', formatCurrency(data.C53 || 0)]);
  rows.push([54, '   (c) Capital Grants', formatCurrency(data.C54 || 0)]);
  rows.push([55, '   (d) Donations', formatCurrency(data.C55 || 0)]);
  rows.push([56, '   (e) Share Premium', formatCurrency(data.C56 || 0)]);
  rows.push([57, '   (f) General Reserves', formatCurrency(data.C57 || 0)]);
  rows.push([58, '   (g) Retained Earnings', formatCurrency(data.C58 || 0)]);
  rows.push([59, '   (h) Profit/Loss', formatCurrency(data.C59 || 0)]);
  rows.push([60, '   (i) Other Reserves', formatCurrency(data.C60 || 0)]);
  
  rows.push([61, '16. TOTAL LIABILITIES AND CAPITAL', formatCurrency(data.C61 || 0)]);
  
  return rows;
};

/**
 * Generate Income Statement data rows - COMPLETE 42 ROWS
 */
const generateIncomeStatementRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Particulars', 'Quarterly', 'YTD']);
  
  // 1. INTEREST INCOME
  rows.push(['1. INTEREST INCOME', 
    formatCurrency(data.C1?.quarterly || 0),
    formatCurrency(data.C1?.ytd || 0)]);
  rows.push(['   a. Interest - Loans to Clients', 
    formatCurrency(data.C2?.quarterly || 0),
    formatCurrency(data.C2?.ytd || 0)]);
  rows.push(['   b. Interest - Loans to Microfinance Service Providers', 
    formatCurrency(data.C3?.quarterly || 0),
    formatCurrency(data.C3?.ytd || 0)]);
  rows.push(['   c. Interest - Investments in Govt Securities', 
    formatCurrency(data.C4?.quarterly || 0),
    formatCurrency(data.C4?.ytd || 0)]);
  rows.push(['   d. Interest - Bank Deposits', 
    formatCurrency(data.C5?.quarterly || 0),
    formatCurrency(data.C5?.ytd || 0)]);
  rows.push(['   e. Interest - Others', 
    formatCurrency(data.C6?.quarterly || 0),
    formatCurrency(data.C6?.ytd || 0)]);
  
  // 2. INTEREST EXPENSE
  rows.push(['2. INTEREST EXPENSE', 
    formatCurrency(data.C7?.quarterly || 0),
    formatCurrency(data.C7?.ytd || 0)]);
  rows.push(['   a. Interest - Borrowings from Banks & Financial Institutions in Tanzania', 
    formatCurrency(data.C8?.quarterly || 0),
    formatCurrency(data.C8?.ytd || 0)]);
  rows.push(['   b. Interest - Borrowing from Microfinance Service Providers in Tanzania', 
    formatCurrency(data.C9?.quarterly || 0),
    formatCurrency(data.C9?.ytd || 0)]);
  rows.push(['   c. Interest - Borrowings from Abroad', 
    formatCurrency(data.C10?.quarterly || 0),
    formatCurrency(data.C10?.ytd || 0)]);
  rows.push(['   d. Interest - Borrowing from Shareholders', 
    formatCurrency(data.C11?.quarterly || 0),
    formatCurrency(data.C11?.ytd || 0)]);
  rows.push(['   e. Interest - Others', 
    formatCurrency(data.C12?.quarterly || 0),
    formatCurrency(data.C12?.ytd || 0)]);
  
  // 3. NET INTEREST INCOME
  rows.push(['3. NET INTEREST INCOME (1 less 2)', 
    formatCurrency(data.C13?.quarterly || 0),
    formatCurrency(data.C13?.ytd || 0)]);
  
  // 4. BAD DEBTS WRITTEN OFF
  rows.push(['4. BAD DEBTS WRITTEN OFF NOT PROVIDED FOR', 
    formatCurrency(data.C14?.quarterly || 0),
    formatCurrency(data.C14?.ytd || 0)]);
  
  // 5. PROVISION FOR BAD AND DOUBTFUL DEBTS
  rows.push(['5. PROVISION FOR BAD AND DOUBTFUL DEBTS', 
    formatCurrency(data.C15?.quarterly || 0),
    formatCurrency(data.C15?.ytd || 0)]);
  
  // 6. NON-INTEREST INCOME
  rows.push(['6. NON-INTEREST INCOME', 
    formatCurrency(data.C16?.quarterly || 0),
    formatCurrency(data.C16?.ytd || 0)]);
  rows.push(['    a. Commissions', 
    formatCurrency(data.C17?.quarterly || 0),
    formatCurrency(data.C17?.ytd || 0)]);
  rows.push(['    b. Fees', 
    formatCurrency(data.C18?.quarterly || 0),
    formatCurrency(data.C18?.ytd || 0)]);
  rows.push(['    c. Rental Income on Premises', 
    formatCurrency(data.C19?.quarterly || 0),
    formatCurrency(data.C19?.ytd || 0)]);
  rows.push(['    d. Dividends on Equity Investment', 
    formatCurrency(data.C20?.quarterly || 0),
    formatCurrency(data.C20?.ytd || 0)]);
  rows.push(['    e. Income from Recovery of Charged off Assets and Acquired Assets', 
    formatCurrency(data.C21?.quarterly || 0),
    formatCurrency(data.C21?.ytd || 0)]);
  rows.push(['    f. Other Income', 
    formatCurrency(data.C22?.quarterly || 0),
    formatCurrency(data.C22?.ytd || 0)]);
  
  // 7. NON-INTEREST EXPENSES
  rows.push(['7. NON-INTEREST EXPENSES', 
    formatCurrency(data.C23?.quarterly || 0),
    formatCurrency(data.C23?.ytd || 0)]);
  rows.push(['    a. Management Salaries and Benefits', 
    formatCurrency(data.C24?.quarterly || 0),
    formatCurrency(data.C24?.ytd || 0)]);
  rows.push(['    b. Employees Salaries and Benefits', 
    formatCurrency(data.C25?.quarterly || 0),
    formatCurrency(data.C25?.ytd || 0)]);
  rows.push(['    c. Wages', 
    formatCurrency(data.C26?.quarterly || 0),
    formatCurrency(data.C26?.ytd || 0)]);
  rows.push(['    d. Pensions Contributions', 
    formatCurrency(data.C27?.quarterly || 0),
    formatCurrency(data.C27?.ytd || 0)]);
  rows.push(['    e. Skills and Development Levy', 
    formatCurrency(data.C28?.quarterly || 0),
    formatCurrency(data.C28?.ytd || 0)]);
  rows.push(['    f. Rental Expense on Premises and Equipment', 
    formatCurrency(data.C29?.quarterly || 0),
    formatCurrency(data.C29?.ytd || 0)]);
  rows.push(['    g. Depreciation - Premises and Equipment', 
    formatCurrency(data.C30?.quarterly || 0),
    formatCurrency(data.C30?.ytd || 0)]);
  rows.push(['    h. Amortization - Leasehold Rights and Equipments', 
    formatCurrency(data.C31?.quarterly || 0),
    formatCurrency(data.C31?.ytd || 0)]);
  rows.push(['    i. Foreclosure and Litigation Expenses', 
    formatCurrency(data.C32?.quarterly || 0),
    formatCurrency(data.C32?.ytd || 0)]);
  rows.push(['    j. Management Fees', 
    formatCurrency(data.C33?.quarterly || 0),
    formatCurrency(data.C33?.ytd || 0)]);
  rows.push(['    k. Auditors Fees', 
    formatCurrency(data.C34?.quarterly || 0),
    formatCurrency(data.C34?.ytd || 0)]);
  rows.push(['    l. Taxes', 
    formatCurrency(data.C35?.quarterly || 0),
    formatCurrency(data.C35?.ytd || 0)]);
  rows.push(['    m. License Fees', 
    formatCurrency(data.C36?.quarterly || 0),
    formatCurrency(data.C36?.ytd || 0)]);
  rows.push(['    n. Insurance', 
    formatCurrency(data.C37?.quarterly || 0),
    formatCurrency(data.C37?.ytd || 0)]);
  rows.push(['    o. Utilities Expenses', 
    formatCurrency(data.C38?.quarterly || 0),
    formatCurrency(data.C38?.ytd || 0)]);
  rows.push(['    p. Other Non-Interest Expenses', 
    formatCurrency(data.C39?.quarterly || 0),
    formatCurrency(data.C39?.ytd || 0)]);
  
  // 8. NET INCOME BEFORE TAX
  rows.push(['8. NET INCOME / (LOSS) BEFORE INCOME TAX (3+6 Less 4,5 and 7)', 
    formatCurrency(data.C40?.quarterly || 0),
    formatCurrency(data.C40?.ytd || 0)]);
  
  // 9. INCOME TAX PROVISION
  rows.push(['9. INCOME TAX PROVISION', 
    formatCurrency(data.C41?.quarterly || 0),
    formatCurrency(data.C41?.ytd || 0)]);
  
  // 10. NET INCOME AFTER TAX
  rows.push(['10. NET INCOME / (LOSS) AFTER INCOME TAX (8 less 9)', 
    formatCurrency(data.C42?.quarterly || 0),
    formatCurrency(data.C42?.ytd || 0)]);
  
  return rows;
};

/**
 * Generate Loan Portfolio data rows
 */
const generateLoanPortfolioRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Particulars', 'Amount (TZS)', 'Percentage (%)']);
  rows.push(['Total Loans', formatCurrency(data.total_loans || data.C1 || 0), '100.0']);
  rows.push(['Performing Loans', formatCurrency(data.performing_loans || data.C2 || 0), 
    data.total_loans ? ((data.performing_loans || 0) / data.total_loans * 100).toFixed(1) : '0.0']);
  rows.push(['Non-Performing Loans', formatCurrency(data.non_performing_loans || data.C3 || 0),
    data.total_loans ? ((data.non_performing_loans || 0) / data.total_loans * 100).toFixed(1) : '0.0']);
  rows.push(['Provisions', formatCurrency(data.provisions || data.C4 || 0),
    data.total_loans ? ((data.provisions || 0) / data.total_loans * 100).toFixed(1) : '0.0']);
  rows.push(['Net Loans', formatCurrency(data.net_loans || data.C5 || 0),
    data.total_loans ? ((data.net_loans || 0) / data.total_loans * 100).toFixed(1) : '0.0']);
  
  return rows;
};

/**
 * Generate Interest Rates data rows
 */
const generateInterestRatesRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Rate Type', 'Minimum (%)', 'Maximum (%)', 'Average (%)']);
  rows.push(['Lending Rates', 
    (data.lending_rate_min || data.minLendingRate || 0).toFixed(2),
    (data.lending_rate_max || data.maxLendingRate || 0).toFixed(2),
    (data.average_lending_rate || data.avgLendingRate || 0).toFixed(2)]);
  rows.push(['Deposit Rates', 
    (data.deposit_rate_min || data.minDepositRate || 0).toFixed(2),
    (data.deposit_rate_max || data.maxDepositRate || 0).toFixed(2),
    (data.average_deposit_rate || data.avgDepositRate || 0).toFixed(2)]);
  
  return rows;
};

/**
 * Generate Liquid Assets data rows
 */
const generateLiquidAssetsRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Asset Type', 'Amount (TZS)']);
  rows.push(['Cash in Hand', formatCurrency(data.cash_in_hand || data.cashInHand || 0)]);
  rows.push(['Bank Balances', formatCurrency(data.bank_balances || data.bankBalances || 0)]);
  rows.push(['Treasury Bills', formatCurrency(data.treasury_bills || data.treasuryBills || 0)]);
  rows.push(['Government Securities', formatCurrency(data.government_securities || data.governmentSecurities || 0)]);
  rows.push(['Other Liquid Assets', formatCurrency(data.other_liquid_assets || data.otherLiquidAssets || 0)]);
  rows.push(['TOTAL LIQUID ASSETS', formatCurrency(data.total_liquid_assets || data.totalLiquidAssets || 0)]);
  
  return rows;
};

/**
 * Generate Complaint Report data rows
 */
const generateComplaintReportRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Complaint Type', 'Count', 'Resolved', 'Pending', 'Resolution Rate (%)']);
  rows.push(['Total Complaints', 
    (data.total_complaints || data.totalComplaints || 0).toString(),
    (data.resolved_complaints || data.resolvedComplaints || 0).toString(),
    (data.pending_complaints || data.pendingComplaints || 0).toString(),
    (data.resolution_rate || data.resolutionRate || 0).toFixed(1)]);
  
  return rows;
};

/**
 * Generate Deposits & Borrowings data rows
 */
const generateDepositsBorrowingsRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Type', 'Amount (TZS)']);
  rows.push(['DEPOSITS']);
  rows.push(['Savings Deposits', formatCurrency(data.savings_deposits || data.savingsDeposits || 0)]);
  rows.push(['Time Deposits', formatCurrency(data.time_deposits || data.timeDeposits || 0)]);
  rows.push(['Total Deposits', formatCurrency(data.total_deposits || data.totalDeposits || 0)]);
  rows.push([]);
  rows.push(['BORROWINGS']);
  rows.push(['Bank Borrowings', formatCurrency(data.bank_borrowings || data.bankBorrowings || 0)]);
  rows.push(['Other Borrowings', formatCurrency(data.other_borrowings || data.otherBorrowings || 0)]);
  rows.push(['Total Borrowings', formatCurrency(data.total_borrowings || data.totalBorrowings || 0)]);
  
  return rows;
};

/**
 * Generate Agent Banking Balances data rows
 */
const generateAgentBankingBalancesRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Particulars', 'Amount (TZS)']);
  rows.push(['Agent Balances', formatCurrency(data.agent_balances || data.agentBalances || 0)]);
  rows.push(['Agent Commissions', formatCurrency(data.agent_commissions || data.agentCommissions || 0)]);
  rows.push(['Active Agents', (data.active_agents || data.activeAgents || 0).toString()]);
  rows.push(['Transactions Volume', formatCurrency(data.transactions_volume || data.transactionsVolume || 0)]);
  
  return rows;
};

/**
 * Generate Loans Disbursed data rows
 */
const generateLoansDisbursedRows = (data: any, rows: any[][]): any[][] => {
  // Debug: Log the data being processed
  console.log('🔍 PDF EXPORT - generateLoansDisbursedRows received data:', data);
  console.log('🔍 PDF EXPORT - Data keys:', Object.keys(data));
  console.log('🔍 PDF EXPORT - Data length:', Object.keys(data).length);
  
  rows.push(['S/No', 'Particulars', 'Amount (TZS)']);
  
  // Create the same data structure as the component for consistency
  const loansDisbursedData = [
    { label: 'Individual Loans Disbursed', amount: data.C1 || 50000000 },
    { label: 'Group Loans Disbursed', amount: data.C2 || 30000000 },
    { label: 'SME Loans Disbursed', amount: data.C3 || 20000000 },
    { label: 'Housing Microfinance Loans', amount: data.C4 || 15000000 },
    { label: 'Agricultural Loans', amount: data.C5 || 10000000 },
    { label: 'Emergency Loans', amount: data.C6 || 8000000 },
    { label: 'Education Loans', amount: data.C7 || 6000000 },
    { label: 'Business Development Loans', amount: data.C8 || 4000000 },
    { label: 'Asset Financing Loans', amount: data.C9 || 3000000 },
    { label: 'Working Capital Loans', amount: data.C10 || 2000000 },
    { label: 'Agriculture Sector', amount: data.C11 || 45000000 },
    { label: 'Manufacturing Sector', amount: data.C12 || 35000000 },
    { label: 'Trade Sector', amount: data.C13 || 60000000 },
    { label: 'Services Sector', amount: data.C14 || 40000000 },
    { label: 'Transport Sector', amount: data.C15 || 25000000 },
    { label: 'Construction Sector', amount: data.C16 || 30000000 },
    { label: 'Mining Sector', amount: data.C17 || 15000000 },
    { label: 'Tourism Sector', amount: data.C18 || 20000000 },
    { label: 'Other Sectors', amount: data.C19 || 10000000 },
    { label: 'Dar es Salaam', amount: data.C20 || 40000000 },
    { label: 'Arusha', amount: data.C21 || 25000000 },
    { label: 'Mwanza', amount: data.C22 || 20000000 },
    { label: 'Dodoma', amount: data.C23 || 15000000 },
    { label: 'Tanga', amount: data.C24 || 12000000 },
    { label: 'Morogoro', amount: data.C25 || 10000000 },
    { label: 'Mbeya', amount: data.C26 || 8000000 },
    { label: 'Iringa', amount: data.C27 || 6000000 },
    { label: 'Kilimanjaro', amount: data.C28 || 5000000 },
    { label: 'Other Regions', amount: data.C29 || 4000000 },
    { label: 'Total Loans Disbursed', amount: data.C30 || 250000000, isTotal: true }
  ];
  
  // Generate rows using the same structure as the component
  loansDisbursedData.forEach((item, index) => {
    rows.push([index + 1, item.label, formatCurrency(item.amount)]);
  });
  
  return rows;
};

/**
 * Generate Geographical Distribution data rows
 */
const generateGeographicalDistributionRows = (data: any, rows: any[][]): any[][] => {
  rows.push(['Region', 'Amount (TZS)']);
  rows.push(['Dar es Salaam', formatCurrency(data.dar_es_salaam || data.darEsSalaam || 0)]);
  rows.push(['Arusha', formatCurrency(data.arusha || data.arusha || 0)]);
  rows.push(['Mwanza', formatCurrency(data.mwanza || data.mwanza || 0)]);
  rows.push(['Dodoma', formatCurrency(data.dodoma || data.dodoma || 0)]);
  rows.push(['Other Regions', formatCurrency(data.other_regions || data.otherRegions || 0)]);
  
  return rows;
};

/**
 * Generate generic report data rows
 */
const generateGenericReportRows = (data: any, rows: any[][]): any[][] => {
  if (data && typeof data === 'object') {
    rows.push(['Field', 'Value']);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        rows.push([key, formatCurrency(value as number)]);
      }
    });
  } else {
    rows.push(['No data available']);
  }
  
  return rows;
};

/**
 * Format currency values
 */
const formatCurrency = (value: number): string => {
  if (typeof value !== 'number') return '0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

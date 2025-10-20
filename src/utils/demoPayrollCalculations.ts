/**
 * Demonstration script showing the new payroll calculations
 * Run this to see examples of the updated calculations
 */

import { 
  calculatePAYE, 
  calculateNSSFEmployee, 
  calculateNSSFEmployer, 
  calculateTaxableAmount 
} from './payeCalculator';

interface EmployeeDemo {
  name: string;
  basicSalary: number;
  housing: number;
  transport: number;
  arrears: number;
  otherAllowance: number;
  hesbl: number;
  loan: number;
  salaryAdvance: number;
  otherDeduction: number;
}

const demoEmployees: EmployeeDemo[] = [
  {
    name: 'Aisha Juma',
    basicSalary: 2500000,
    housing: 375000,
    transport: 100000,
    arrears: 0,
    otherAllowance: 0,
    hesbl: 0,
    loan: 100000,
    salaryAdvance: 0,
    otherDeduction: 0
  },
  {
    name: 'John Mwalimu',
    basicSalary: 3000000,
    housing: 450000,
    transport: 100000,
    arrears: 0,
    otherAllowance: 0,
    hesbl: 300000,
    loan: 0,
    salaryAdvance: 200000,
    otherDeduction: 0
  },
  {
    name: 'Mary Kimaro',
    basicSalary: 1800000,
    housing: 270000,
    transport: 100000,
    arrears: 50000,
    otherAllowance: 0,
    hesbl: 0,
    loan: 50000,
    salaryAdvance: 0,
    otherDeduction: 0
  },
  {
    name: 'Catherine Mboya',
    basicSalary: 4500000,
    housing: 675000,
    transport: 150000,
    arrears: 0,
    otherAllowance: 0,
    hesbl: 0,
    loan: 200000,
    salaryAdvance: 0,
    otherDeduction: 0
  },
  {
    name: 'Peter Mwamba',
    basicSalary: 1200000,
    housing: 180000,
    transport: 120000,
    arrears: 0,
    otherAllowance: 0,
    hesbl: 0,
    loan: 0,
    salaryAdvance: 0,
    otherDeduction: 0
  }
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function calculateEmployeePayroll(employee: EmployeeDemo) {
  // Calculate gross pay
  const grossPay = employee.basicSalary + employee.housing + employee.transport + 
                   employee.arrears + employee.otherAllowance;
  
  // Calculate NSSF Employee contribution (10% of gross pay)
  const nssfEE = calculateNSSFEmployee(grossPay);
  
  // Calculate taxable amount (gross pay minus NSSF employee contribution)
  const taxableAmount = calculateTaxableAmount(grossPay);
  
  // Calculate PAYE using progressive tax brackets
  const payeResult = calculatePAYE(taxableAmount, true);
  const paye = payeResult.taxAmount;
  
  // Calculate other deductions
  const totalOtherDeductions = employee.hesbl + employee.loan + 
                              employee.salaryAdvance + employee.otherDeduction;
  
  // Calculate total deductions
  const totalDeductions = paye + nssfEE + totalOtherDeductions;
  
  // Calculate net salary
  const netSalary = grossPay - totalDeductions;
  
  // Calculate employer contributions
  const nssfER = calculateNSSFEmployer(grossPay);
  const wcfER = grossPay * 0.01;
  const sdlER = grossPay * 0.01;
  
  return {
    ...employee,
    grossPay,
    taxableAmount,
    nssfEE,
    paye,
    totalOtherDeductions,
    totalDeductions,
    netSalary,
    nssfER,
    wcfER,
    sdlER,
    effectiveTaxRate: payeResult.effectiveRate
  };
}

export function runPayrollDemo() {
  console.log('='.repeat(80));
  console.log('PAYROLL CALCULATION DEMONSTRATION');
  console.log('Tanzania PAYE Implementation - Effective July 1st, 2023');
  console.log('='.repeat(80));
  console.log();

  const calculatedEmployees = demoEmployees.map(calculateEmployeePayroll);
  
  // Display individual employee calculations
  calculatedEmployees.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.name}`);
    console.log('-'.repeat(50));
    console.log(`Basic Salary:     ${formatCurrency(emp.basicSalary)}`);
    console.log(`Housing:          ${formatCurrency(emp.housing)}`);
    console.log(`Transport:        ${formatCurrency(emp.transport)}`);
    console.log(`Arrears:          ${formatCurrency(emp.arrears)}`);
    console.log(`Other Allowance:  ${formatCurrency(emp.otherAllowance)}`);
    console.log(`Gross Pay:        ${formatCurrency(emp.grossPay)}`);
    console.log();
    console.log(`NSSF (EE):        ${formatCurrency(emp.nssfEE)} (10% of gross pay)`);
    console.log(`Taxable Amount:   ${formatCurrency(emp.taxableAmount)} (gross pay - NSSF EE)`);
    console.log(`PAYE:             ${formatCurrency(emp.paye)} (${emp.effectiveTaxRate.toFixed(2)}% effective rate)`);
    console.log();
    console.log(`HESLB:            ${formatCurrency(emp.hesbl)}`);
    console.log(`Loan:             ${formatCurrency(emp.loan)}`);
    console.log(`Salary Advance:   ${formatCurrency(emp.salaryAdvance)}`);
    console.log(`Other Deduction:  ${formatCurrency(emp.otherDeduction)}`);
    console.log(`Total Deductions: ${formatCurrency(emp.totalDeductions)}`);
    console.log(`Net Salary:       ${formatCurrency(emp.netSalary)}`);
    console.log();
    console.log(`Employer Contributions:`);
    console.log(`NSSF (ER):        ${formatCurrency(emp.nssfER)} (10% of gross pay)`);
    console.log(`WCF (ER):         ${formatCurrency(emp.wcfER)} (1% of gross pay)`);
    console.log(`SDL (ER):         ${formatCurrency(emp.sdlER)} (1% of gross pay)`);
    console.log('='.repeat(80));
    console.log();
  });
  
  // Display summary
  const totalGross = calculatedEmployees.reduce((sum, emp) => sum + emp.grossPay, 0);
  const totalTaxable = calculatedEmployees.reduce((sum, emp) => sum + emp.taxableAmount, 0);
  const totalPaye = calculatedEmployees.reduce((sum, emp) => sum + emp.paye, 0);
  const totalNssfEE = calculatedEmployees.reduce((sum, emp) => sum + emp.nssfEE, 0);
  const totalNssfER = calculatedEmployees.reduce((sum, emp) => sum + emp.nssfER, 0);
  const totalNet = calculatedEmployees.reduce((sum, emp) => sum + emp.netSalary, 0);
  
  console.log('PAYROLL SUMMARY');
  console.log('-'.repeat(50));
  console.log(`Total Employees:     ${calculatedEmployees.length}`);
  console.log(`Total Gross Pay:     ${formatCurrency(totalGross)}`);
  console.log(`Total Taxable Amount: ${formatCurrency(totalTaxable)}`);
  console.log(`Total PAYE:          ${formatCurrency(totalPaye)}`);
  console.log(`Total NSSF (EE):     ${formatCurrency(totalNssfEE)}`);
  console.log(`Total NSSF (ER):     ${formatCurrency(totalNssfER)}`);
  console.log(`Total Net Salary:    ${formatCurrency(totalNet)}`);
  console.log('='.repeat(80));
  
  return calculatedEmployees;
}

// Example usage (uncomment to run):
// runPayrollDemo();

import { TopUpStrategy, LoanData, NetTopUpAllocation, TopUpEligibility } from '../types/topUp.types';

// Calculate monthly payment (loan amortization)
export function calculateMonthlyPayment(
  principal: number, 
  months: number, 
  annualRate: number
): number {
  if (months === 0 || annualRate === 0) return principal / 12; // Simple division if no interest
  
  const monthlyRate = annualRate / 12 / 100;
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment * 100) / 100;
}

// Calculate DTI ratio
export function calculateDTI(monthlyIncome: number, monthlyPayment: number): number {
  if (monthlyIncome === 0) return 0;
  return Math.round((monthlyPayment / monthlyIncome) * 100);
}

// Determine optimal tenure based on amount
export function determineOptimalTenure(amount: number): number {
  if (amount <= 1000) return 6;
  if (amount <= 3000) return 9;
  if (amount <= 5000) return 12;
  return 18;
}

// Calculate settlement amount
export function calculateSettlementAmount(loan: LoanData): number {
  const principalBalance = loan.outstandingBalance;
  const accruedInterest = principalBalance * (loan.interestRate / 100) * (loan.daysPastDue / 30);
  const unearnedInterest = (principalBalance * (loan.interestRate / 100) * loan.remainingMonths) - accruedInterest;
  
  // Apply 50% rebate on unearned interest
  const interestRebate = unearnedInterest * 0.5;
  
  // Waive prepayment penalty for top-ups
  const prepaymentPenalty = 0;
  
  return principalBalance + accruedInterest - interestRebate + prepaymentPenalty;
}

// Check top-up eligibility
export function checkTopUpEligibility(loan: LoanData): TopUpEligibility {
  const paymentHistoryPassed = loan.paymentHistoryPercentage >= 80;
  const daysOverduePassed = loan.daysPastDue <= 0;
  const dtiRatioPassed = loan.dtiRatio < 80;
  
  // Calculate maximum exposure limit (simplified - could be more complex)
  const maxExposure = loan.monthlyIncome * 12 * 0.5; // 50% of annual income
  const currentExposure = loan.outstandingBalance;
  const exposureLimitPassed = currentExposure < maxExposure;
  
  const isEligible = paymentHistoryPassed && daysOverduePassed && dtiRatioPassed && exposureLimitPassed;
  
  let reason = '';
  if (!paymentHistoryPassed) reason = 'Payment history below 80%';
  else if (!daysOverduePassed) reason = 'Loan is past due';
  else if (!dtiRatioPassed) reason = 'DTI ratio exceeds 80%';
  else if (!exposureLimitPassed) reason = 'Exceeds maximum exposure limit';
  else reason = 'Eligible for top-up';
  
  const maxTopUpAmount = isEligible ? Math.min(
    maxExposure - currentExposure,
    loan.monthlyIncome * 6 // Maximum 6 months income
  ) : 0;
  
  return {
    isEligible,
    reason,
    maxTopUpAmount,
    recommendedStrategy: isEligible ? getRecommendedStrategy(loan, 0) : undefined,
    eligibilityCriteria: {
      paymentHistory: { passed: paymentHistoryPassed, percentage: loan.paymentHistoryPercentage },
      daysOverdue: { passed: daysOverduePassed, days: loan.daysPastDue },
      exposureLimit: { passed: exposureLimitPassed, currentExposure, maxExposure },
      dtiRatio: { passed: dtiRatioPassed, ratio: loan.dtiRatio }
    }
  };
}

// Get recommended strategy
export function getRecommendedStrategy(loan: LoanData, topUpAmount: number): string {
  const ratio = topUpAmount / loan.outstandingBalance;
  
  // If top-up exceeds balance significantly
  if (ratio > 1.0) {
    return 'settlement_plus_new';
  }
  
  // If top-up is large relative to balance
  if (ratio >= 0.5) {
    return 'consolidation';
  }
  
  // Default to net top-up for flexibility
  return 'net_topup';
}

// Calculate strategy options
export function calculateStrategyOptions(
  loan: LoanData,
  topUpAmount: number,
  netTopUpAllocation?: NetTopUpAllocation,
  requestedTenure?: number
): TopUpStrategy[] {
  const strategies: TopUpStrategy[] = [];
  
  // Strategy 1: CONSOLIDATION
  const consolidationTenure = requestedTenure || 12;
  const consolidationStrategy: TopUpStrategy = {
    id: 'consolidation',
    name: 'Consolidation (Full Refinancing)',
    description: 'Close old loan + Create new larger loan',
    isRecommended: topUpAmount >= loan.outstandingBalance * 0.5,
    isAvailable: true,
    calculations: {
      newLoanAmount: loan.outstandingBalance + topUpAmount,
      netCashToClient: topUpAmount,
      newMonthlyPayment: calculateMonthlyPayment(loan.outstandingBalance + topUpAmount, consolidationTenure, loan.interestRate),
      tenure: consolidationTenure,
      totalDebt: loan.outstandingBalance + topUpAmount,
      dtiRatio: calculateDTI(loan.monthlyIncome, calculateMonthlyPayment(loan.outstandingBalance + topUpAmount, consolidationTenure, loan.interestRate))
    },
    benefits: [
      'One simple payment',
      'Full cash disbursement',
      `Extended repayment period to ${consolidationTenure} months`,
      `Uses loan interest rate: ${loan.interestRate}%`
    ],
    warnings: [
      `Resets loan tenure to ${consolidationTenure} months`,
      topUpAmount > loan.outstandingBalance ? 'Highest total debt' : ''
    ].filter(w => w)
  };
  strategies.push(consolidationStrategy);
  
  // Strategy 2: SETTLEMENT + NEW LOAN (only if topUpAmount >= outstandingBalance)
  if (topUpAmount >= loan.outstandingBalance * 0.8) {
    const settlementAmount = calculateSettlementAmount(loan);
    const newLoanAmount = topUpAmount - settlementAmount;
    const settlementTenure = requestedTenure || determineOptimalTenure(newLoanAmount);
    
    const settlementStrategy: TopUpStrategy = {
      id: 'settlement_plus_new',
      name: 'Settlement + New Loan (Clean Slate)',
      description: 'Pay off old loan completely, start fresh',
      isRecommended: topUpAmount > loan.outstandingBalance,
      isAvailable: true,
      calculations: {
        settlementAmount,
        newLoanAmount,
        netCashToClient: newLoanAmount,
        newMonthlyPayment: calculateMonthlyPayment(newLoanAmount, settlementTenure, loan.interestRate),
        tenure: settlementTenure,
        totalDebt: newLoanAmount,
        dtiRatio: calculateDTI(loan.monthlyIncome, calculateMonthlyPayment(newLoanAmount, settlementTenure, loan.interestRate))
      },
      benefits: [
        '✅ Clean slate - old loan completely paid off',
        '✅ Lowest monthly payment',
        `✅ ${settlementTenure} months tenure`,
        '✅ Lowest total debt',
        '✅ Improves credit history (loan closure)',
        `✅ Uses loan interest rate: ${loan.interestRate}%`
      ],
      warnings: [
        'Less cash to client (only excess amount)'
      ]
    };
    strategies.push(settlementStrategy);
  }
  
  // Strategy 3: NET TOP-UP
  const appliedToLoan = netTopUpAllocation?.appliedToLoan || topUpAmount * 0.3; // Default 30% to loan
  const cashToClient = topUpAmount - appliedToLoan;
  const newBalance = loan.outstandingBalance - appliedToLoan;
  const netTopUpTenure = requestedTenure || loan.remainingMonths;
  const newMonthlyPayment = calculateMonthlyPayment(newBalance, netTopUpTenure, loan.interestRate);
  
  const netTopUpStrategy: TopUpStrategy = {
    id: 'net_topup',
    name: 'Net Top-Up (Flexible Allocation)',
    description: 'Custom split between loan reduction and cash',
    isRecommended: topUpAmount < loan.outstandingBalance * 0.5,
    isAvailable: true,
    calculations: {
      loanReductionAmount: appliedToLoan,
      netCashToClient: cashToClient,
      newMonthlyPayment,
      tenure: netTopUpTenure,
      totalDebt: newBalance,
      dtiRatio: calculateDTI(loan.monthlyIncome, newMonthlyPayment)
    },
    benefits: [
      'Flexible - you choose the split',
      'Reduces debt burden',
      `Tenure: ${netTopUpTenure} months`,
      `Reduces monthly payment by ${formatCurrency(loan.monthlyPayment - newMonthlyPayment)}`,
      `Uses loan interest rate: ${loan.interestRate}%`
    ],
    warnings: []
  };
  strategies.push(netTopUpStrategy);
  
  // Strategy 4: STACKING
  const stackingTenure = requestedTenure || 12;
  const loan2Payment = calculateMonthlyPayment(topUpAmount, stackingTenure, loan.interestRate);
  const totalMonthlyPayment = loan.monthlyPayment + loan2Payment;
  const stackingDTI = calculateDTI(loan.monthlyIncome, totalMonthlyPayment);
  
  const stackingStrategy: TopUpStrategy = {
    id: 'stacking',
    name: 'Stacking (Separate Loans)',
    description: 'Keep existing loan active + Add new loan',
    isRecommended: false,
    isAvailable: stackingDTI <= 40,
    unavailableReason: stackingDTI > 40 ? `Fails affordability check (DTI exceeds 40%)` : undefined,
    calculations: {
      netCashToClient: topUpAmount,
      newMonthlyPayment: totalMonthlyPayment,
      tenure: stackingTenure,
      totalDebt: loan.outstandingBalance + topUpAmount,
      dtiRatio: stackingDTI
    },
    benefits: [
      'Full cash disbursement',
      'Existing loan unchanged',
      `New loan tenure: ${stackingTenure} months`,
      `Uses loan interest rate: ${loan.interestRate}%`
    ],
    warnings: [
      'Higher monthly payment (two loans)',
      'More complex tracking',
      'Increased default risk',
      stackingDTI > 40 ? `❌ DTI (${Math.round(stackingDTI)}%) exceeds limit` : ''
    ].filter(w => w)
  };
  strategies.push(stackingStrategy);
  
  return strategies;
}

// Format currency helper
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Calculate percentage change
export function calculatePercentageChange(oldValue: number, newValue: number): string {
  if (oldValue === 0) return '0%';
  const change = ((newValue - oldValue) / oldValue) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${Math.round(change)}%`;
}

// Calculate interest savings for settlement strategy
export function calculateInterestSavings(
  originalLoan: LoanData,
  settlementAmount: number,
  newLoanAmount: number,
  newTenure: number
): number {
  const remainingInterest = originalLoan.outstandingBalance * (originalLoan.interestRate / 100) * (originalLoan.remainingMonths / 12);
  const newInterest = newLoanAmount * (originalLoan.interestRate / 100) * (newTenure / 12);
  
  return Math.max(0, remainingInterest - newInterest);
}







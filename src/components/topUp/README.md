# Enhanced Loan Monitoring with Top-Up Management

## Overview

The Enhanced Loan Monitoring system provides comprehensive loan management capabilities with intelligent top-up request processing. The system allows staff to initiate and process loan top-up requests using 4 different strategies based on the relationship between the requested top-up amount and the outstanding loan balance.

## Features

### 1. Enhanced Loan Monitoring Page (`/staff/loans`)

- **Real-time loan data** with comprehensive client information
- **Top-up eligibility indicators** with visual status badges
- **Advanced filtering** by status, eligibility, and search terms
- **Action buttons** for each loan with top-up request capability

### 2. Top-Up Request Dialog System

#### Step 1: Eligibility Check
- Client information summary
- Current loan details
- Comprehensive eligibility criteria validation
- Real-time top-up amount input with validation

#### Step 2: Strategy Selection
- **4 Top-Up Strategies** with real-time calculations:
  - **Consolidation**: Close old loan + Create new larger loan
  - **Settlement + New Loan**: Pay off old loan completely, start fresh
  - **Net Top-Up**: Custom split between loan reduction and cash
  - **Stacking**: Keep existing loan active + Add new loan
- **Live comparison table** showing all metrics
- **Interactive allocation slider** for Net Top-Up strategy

#### Step 3: Detailed Review & Confirmation
- Strategy-specific detailed breakdowns
- Settlement calculations
- New loan terms and payment schedules
- Affordability checks with DTI ratios
- Requirements checklist
- Staff notes section

#### Step 4: Submission Confirmation
- Request summary with unique ID
- Approval workflow visualization
- Next steps and contact information

### 3. Top-Up Strategies

#### Strategy 1: CONSOLIDATION
- **Best for**: Large top-ups (≥50% of outstanding balance)
- **Process**: Close old loan + Create new larger loan
- **Benefits**: One simple payment, full cash disbursement, extended repayment period
- **Considerations**: Resets loan tenure to 12 months

#### Strategy 2: SETTLEMENT + NEW LOAN
- **Best for**: Top-ups exceeding outstanding balance
- **Process**: Pay off old loan completely, start fresh
- **Benefits**: Clean slate, lowest monthly payment, shortest tenure, improves credit history
- **Considerations**: Less cash to client (only excess amount)

#### Strategy 3: NET TOP-UP
- **Best for**: Flexible allocation needs
- **Process**: Custom split between loan reduction and cash
- **Benefits**: Flexible allocation, reduces debt burden, tenure unchanged
- **Considerations**: Requires careful allocation planning

#### Strategy 4: STACKING
- **Best for**: When other strategies fail affordability checks
- **Process**: Keep existing loan active + Add new loan
- **Benefits**: Full cash disbursement, existing loan unchanged
- **Considerations**: Higher monthly payment, more complex tracking

### 4. Eligibility Criteria

- **Payment History**: ≥80% on-time payments
- **Days Past Due**: 0 days (current on payments)
- **DTI Ratio**: <80%
- **Exposure Limit**: Within maximum exposure limit
- **No Pending Requests**: No other pending top-up requests

### 5. Real-Time Calculations

- **Monthly Payment Calculation**: Loan amortization formula
- **DTI Ratio Calculation**: Monthly payment / Monthly income
- **Settlement Amount**: Principal + Accrued Interest - Interest Rebate
- **Interest Savings**: For settlement strategy
- **Optimal Tenure**: Based on loan amount

## Technical Implementation

### File Structure
```
src/
├── pages/
│   └── EnhancedLoanMonitoring.tsx
├── components/
│   └── topUp/
│       ├── TopUpRequestDialog.tsx
│       ├── EligibilityCheck.tsx
│       ├── StrategySelector.tsx
│       ├── StrategyDetails.tsx
│       └── SubmissionConfirmation.tsx
├── hooks/
│   └── useTopUp.ts
├── services/
│   └── topUpService.ts
├── types/
│   └── topUp.types.ts
└── utils/
    └── topUpCalculations.ts
```

### Key Components

#### EnhancedLoanMonitoring.tsx
- Main page component with loan listing and filtering
- Top-up eligibility checking
- Dialog management

#### TopUpRequestDialog.tsx
- Multi-step wizard container
- State management for all steps
- Submission handling

#### EligibilityCheck.tsx
- Client and loan information display
- Eligibility criteria validation
- Top-up amount input

#### StrategySelector.tsx
- Strategy options display
- Real-time calculations
- Comparison table
- Interactive allocation controls

#### StrategyDetails.tsx
- Strategy-specific detailed breakdowns
- Affordability checks
- Requirements checklist
- DTI override handling

#### SubmissionConfirmation.tsx
- Request summary
- Workflow visualization
- Next steps information

### Backend Integration

#### TopUpService.ts
- Database operations for top-up requests
- Workflow management
- Statistics and reporting

#### useTopUp.ts
- React hooks for data management
- State management
- Error handling

### Database Schema

#### topup_requests table
```sql
CREATE TABLE topup_requests (
  id UUID PRIMARY KEY,
  request_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  existing_loan_id UUID REFERENCES loans(id),
  requested_amount DECIMAL(12,2) NOT NULL,
  selected_strategy VARCHAR(50) NOT NULL,
  strategy_details JSONB,
  disbursement_method VARCHAR(20),
  disbursement_details JSONB,
  processing_fee DECIMAL(12,2),
  insurance_fee DECIMAL(12,2),
  net_disbursement DECIMAL(12,2),
  status VARCHAR(50) NOT NULL,
  requires_dti_override BOOLEAN DEFAULT FALSE,
  dti_override_reason TEXT,
  dti_override_approved_by UUID REFERENCES staff(id),
  created_by UUID REFERENCES staff(id),
  approved_by UUID REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  disbursed_at TIMESTAMP,
  staff_notes TEXT
);
```

#### topup_approval_workflow table
```sql
CREATE TABLE topup_approval_workflow (
  id UUID PRIMARY KEY,
  topup_request_id UUID REFERENCES topup_requests(id),
  step_name VARCHAR(100),
  step_order INT,
  status VARCHAR(50),
  assigned_to UUID REFERENCES staff(id),
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMP,
  comments TEXT
);
```

## Usage

### For Staff Members

1. **Navigate to Loan Monitoring**: Go to `/staff/loans`
2. **View Loan List**: See all active loans with eligibility indicators
3. **Filter Loans**: Use search and filter options to find specific loans
4. **Initiate Top-Up**: Click "Top-Up" button for eligible loans
5. **Complete Workflow**: Follow the 4-step process:
   - Check eligibility
   - Select strategy
   - Review details
   - Confirm submission

### For Administrators

1. **Monitor Requests**: View pending top-up requests in dashboard
2. **Review Workflow**: Track approval progress
3. **Manage Approvals**: Approve or reject requests
4. **View Statistics**: Monitor top-up request metrics

## Configuration

### Eligibility Thresholds
- Payment History: 80% (configurable)
- DTI Ratio: 80% (configurable)
- Days Past Due: 0 (configurable)
- Maximum Exposure: 50% of annual income (configurable)

### Fee Structure
- Processing Fee: 1% of top-up amount
- Insurance Fee: 0.5% of top-up amount
- Net Disbursement: 98.5% of top-up amount

### Interest Rebates
- Unearned Interest Rebate: 50%
- Prepayment Penalty: Waived for top-ups

## Security & Compliance

- **User Authentication**: Required for all operations
- **Role-Based Access**: Different access levels for staff and supervisors
- **Audit Trail**: Complete logging of all actions
- **Data Validation**: Comprehensive input validation
- **Error Handling**: Graceful error handling and user feedback

## Performance

- **Real-time Calculations**: Optimized calculation engine
- **Lazy Loading**: Components loaded as needed
- **Caching**: Strategic data caching for performance
- **Debounced Input**: Prevents excessive API calls

## Future Enhancements

- **Mobile App Integration**: Mobile interface for field staff
- **SMS Notifications**: Automated client notifications
- **Advanced Analytics**: Detailed reporting and insights
- **Machine Learning**: Predictive eligibility scoring
- **API Integration**: Third-party service integrations

## Support

For technical support or feature requests, contact the development team or refer to the main project documentation.








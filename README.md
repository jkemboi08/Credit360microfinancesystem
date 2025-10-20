# MicroFinance Pro - Complete Loan Management Solution

A comprehensive microfinance management system built with React, TypeScript, and Supabase. BOT compliant and designed for scale.

## 🚀 Features

### Core Loan Management
- **Loan Applications**: Complete application workflow with approval processes
- **Loan Disbursement**: Automated disbursement tracking and management
- **Repayment Scheduling**: Flexible repayment plans and tracking
- **Loan Monitoring**: Real-time loan status and performance monitoring
- **Contract Generation**: Automated loan agreement generation

### Client Management
- **Client Registration**: Comprehensive client onboarding
- **Client Search**: Advanced search and filtering capabilities
- **Client Analytics**: Detailed client performance metrics
- **Document Management**: Secure document storage and retrieval

### Financial Management
- **Accounting Integration**: Complete double-entry bookkeeping
- **Budget Management**: Budget planning and tracking
- **Expense Management**: Comprehensive expense tracking
- **Payroll System**: Staff payroll management
- **Financial Reports**: BOT-compliant reporting

### Multi-Tenant Architecture
- **Tenant Management**: Multi-organization support
- **Role-Based Access**: Granular permission system
- **Data Isolation**: Secure tenant data separation

### Regulatory Compliance
- **BOT Reports**: Tanzania Bank of Tanzania compliance
- **Audit Trails**: Complete transaction logging
- **Data Integrity**: Comprehensive data validation

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context API
- **Routing**: React Router v7
- **Charts**: Recharts
- **PDF Generation**: jsPDF, html2canvas
- **Build Tool**: Vite

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clean-microfinance-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   Update the environment variables with your Supabase credentials.

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations from `src/database/migrations/`
3. Configure Row Level Security (RLS) policies
4. Set up storage buckets for document management

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   ├── dashboard/      # Dashboard components
│   ├── expense/        # Expense management
│   ├── regulatory/     # BOT compliance components
│   └── ui/             # Reusable UI components
├── pages/              # Page components
├── services/           # API services
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── database/           # Database migrations and schemas
```

## 🚀 Deployment

### Production Build
```bash
npm run build:prod
```

### Preview
```bash
npm run preview:prod
```

## 📊 Key Modules

- **Loan Management**: Complete loan lifecycle management
- **Client Management**: Client onboarding and relationship management
- **Accounting**: Financial transaction management
- **Reports**: Comprehensive reporting system
- **Staff Management**: Employee and payroll management
- **Multi-tenancy**: Multi-organization support

## 🔒 Security

- Row Level Security (RLS) for data isolation
- JWT-based authentication
- Role-based access control
- Secure file upload and storage
- Data encryption at rest and in transit

## 📈 Performance

- Optimized bundle size with Vite
- Code splitting and lazy loading
- Efficient database queries
- Caching strategies
- Real-time updates with Supabase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions, please open an issue in the repository.

## 🔄 Version History

- **v1.0.0**: Initial release with core microfinance features
- Complete loan management system
- BOT compliance integration
- Multi-tenant architecture

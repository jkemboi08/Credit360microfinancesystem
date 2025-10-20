import React from 'react';
import Layout from '../components/Layout';
import LoanStatusFixer from '../components/LoanStatusFixer';

const LoanStatusFixerPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <LoanStatusFixer />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoanStatusFixerPage;








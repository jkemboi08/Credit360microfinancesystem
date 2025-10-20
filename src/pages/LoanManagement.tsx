import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import EnhancedLoanMonitoring from './EnhancedLoanMonitoring';

const LoanMonitoring: React.FC = () => {
  return (
    <Layout>
      <EnhancedLoanMonitoring />
    </Layout>
  );
};

export default LoanMonitoring;

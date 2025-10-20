// Tenant Onboarding Wizard
// Multi-step wizard for new tenant setup

import React, { useState, useEffect } from 'react';
import { tenantManager } from '../../lib/tenantManager';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

interface TenantOnboardingData {
  // Step 1: Basic Information
  name: string;
  subdomain: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone: string;
  
  // Step 2: Business Information
  businessType: 'MFI' | 'SACCO' | 'BANK' | 'OTHER';
  registrationNumber: string;
  licenseNumber: string;
  address: string;
  city: string;
  country: string;
  
  // Step 3: Configuration
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  
  // Step 4: Branding
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  
  // Step 5: Plan Selection
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxClients: number;
  maxUsers: number;
}

const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<TenantOnboardingData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Tell us about your organization',
      component: BasicInfoStep
    },
    {
      id: 'business-info',
      title: 'Business Information',
      description: 'Legal and registration details',
      component: BusinessInfoStep
    },
    {
      id: 'configuration',
      title: 'Configuration',
      description: 'Set up your preferences',
      component: ConfigurationStep
    },
    {
      id: 'branding',
      title: 'Branding',
      description: 'Customize your appearance',
      component: BrandingStep
    },
    {
      id: 'plan-selection',
      title: 'Plan Selection',
      description: 'Choose your subscription plan',
      component: PlanSelectionStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create tenant
      const result = await tenantManager.createTenant(
        formData.name!,
        formData.subdomain!,
        formData.adminEmail!,
        formData.adminFirstName!,
        formData.adminLastName!
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create tenant');
      }

      // Set tenant context
      await tenantManager.getTenantById(result.tenantId!);

      // Update settings
      await tenantManager.updateTenantSetting('timezone', formData.timezone!);
      await tenantManager.updateTenantSetting('currency', formData.currency!);
      await tenantManager.updateTenantSetting('language', formData.language!);
      await tenantManager.updateTenantSetting('date_format', formData.dateFormat!);

      // Update branding
      await tenantManager.updateTenantBranding({
        logo_url: formData.logoUrl,
        primary_color: formData.primaryColor!,
        secondary_color: formData.secondaryColor!,
        accent_color: formData.accentColor!,
        font_family: formData.fontFamily!
      });

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (updates: Partial<TenantOnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Credit Management System!</h2>
          <p className="text-gray-600 mb-6">
            Your tenant has been created successfully. You can now start using the system.
          </p>
          <a
            href={`/tenant/${formData.subdomain}/dashboard`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h1>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

// Step 1: Basic Information
const BasicInfoStep: React.FC<any> = ({ formData, updateFormData, onNext, isFirst, isLast }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name) newErrors.name = 'Organization name is required';
    if (!formData.subdomain) newErrors.subdomain = 'Subdomain is required';
    if (!formData.adminEmail) newErrors.adminEmail = 'Admin email is required';
    if (!formData.adminFirstName) newErrors.adminFirstName = 'Admin first name is required';
    if (!formData.adminLastName) newErrors.adminLastName = 'Admin last name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., RYTHM Microfinance Limited"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subdomain *
          </label>
          <div className="flex">
            <input
              type="text"
              value={formData.subdomain || ''}
              onChange={(e) => updateFormData({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="rythm"
            />
            <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
              .creditmanagement.com
            </span>
          </div>
          {errors.subdomain && <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin First Name *
          </label>
          <input
            type="text"
            value={formData.adminFirstName || ''}
            onChange={(e) => updateFormData({ adminFirstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John"
          />
          {errors.adminFirstName && <p className="text-red-500 text-sm mt-1">{errors.adminFirstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Last Name *
          </label>
          <input
            type="text"
            value={formData.adminLastName || ''}
            onChange={(e) => updateFormData({ adminLastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Doe"
          />
          {errors.adminLastName && <p className="text-red-500 text-sm mt-1">{errors.adminLastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Email *
          </label>
          <input
            type="email"
            value={formData.adminEmail || ''}
            onChange={(e) => updateFormData({ adminEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="admin@rythm.com"
          />
          {errors.adminEmail && <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Phone
          </label>
          <input
            type="tel"
            value={formData.adminPhone || ''}
            onChange={(e) => updateFormData({ adminPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+255 123 456 789"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

// Step 2: Business Information
const BusinessInfoStep: React.FC<any> = ({ formData, updateFormData, onNext, onPrevious }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type
          </label>
          <select
            value={formData.businessType || 'MFI'}
            onChange={(e) => updateFormData({ businessType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="MFI">Microfinance Institution</option>
            <option value="SACCO">SACCO</option>
            <option value="BANK">Bank</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Number
          </label>
          <input
            type="text"
            value={formData.registrationNumber || ''}
            onChange={(e) => updateFormData({ registrationNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="REG123456"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          License Number
        </label>
        <input
          type="text"
          value={formData.licenseNumber || ''}
          onChange={(e) => updateFormData({ licenseNumber: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="LIC789012"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={formData.address || ''}
          onChange={(e) => updateFormData({ address: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your business address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => updateFormData({ city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dar es Salaam"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            value={formData.country || ''}
            onChange={(e) => updateFormData({ country: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tanzania"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

// Step 3: Configuration
const ConfigurationStep: React.FC<any> = ({ formData, updateFormData, onNext, onPrevious }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone || 'Africa/Dar_es_Salaam'}
            onChange={(e) => updateFormData({ timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Africa/Kampala">Africa/Kampala</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={formData.currency || 'TZS'}
            onChange={(e) => updateFormData({ currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TZS">Tanzanian Shilling (TZS)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="KES">Kenyan Shilling (KES)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={formData.language || 'en'}
            onChange={(e) => updateFormData({ language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="sw">Swahili</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={formData.dateFormat || 'DD/MM/YYYY'}
            onChange={(e) => updateFormData({ dateFormat: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

// Step 4: Branding
const BrandingStep: React.FC<any> = ({ formData, updateFormData, onNext, onPrevious }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL
        </label>
        <input
          type="url"
          value={formData.logoUrl || ''}
          onChange={(e) => updateFormData({ logoUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex">
            <input
              type="color"
              value={formData.primaryColor || '#3B82F6'}
              onChange={(e) => updateFormData({ primaryColor: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded-l-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.primaryColor || '#3B82F6'}
              onChange={(e) => updateFormData({ primaryColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Color
          </label>
          <div className="flex">
            <input
              type="color"
              value={formData.secondaryColor || '#1E40AF'}
              onChange={(e) => updateFormData({ secondaryColor: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded-l-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.secondaryColor || '#1E40AF'}
              onChange={(e) => updateFormData({ secondaryColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accent Color
          </label>
          <div className="flex">
            <input
              type="color"
              value={formData.accentColor || '#F59E0B'}
              onChange={(e) => updateFormData({ accentColor: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded-l-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.accentColor || '#F59E0B'}
              onChange={(e) => updateFormData({ accentColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Family
        </label>
        <select
          value={formData.fontFamily || 'Inter'}
          onChange={(e) => updateFormData({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Lato">Lato</option>
        </select>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

// Step 5: Plan Selection
const PlanSelectionStep: React.FC<any> = ({ formData, updateFormData, onPrevious, onSubmit, isLoading }) => {
  const plans = [
    {
      id: 'BASIC',
      name: 'Basic',
      price: 99,
      description: 'Perfect for small microfinance institutions',
      features: [
        'Up to 1,000 clients',
        'Up to 10 users',
        'Basic reporting',
        'Email support',
        '10GB storage'
      ],
      maxClients: 1000,
      maxUsers: 10
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: 299,
      description: 'Ideal for growing institutions',
      features: [
        'Up to 10,000 clients',
        'Up to 50 users',
        'Advanced reporting',
        'Priority support',
        '100GB storage',
        'API access'
      ],
      maxClients: 10000,
      maxUsers: 50
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 599,
      description: 'For large institutions with complex needs',
      features: [
        'Unlimited clients',
        'Unlimited users',
        'Custom reporting',
        'Dedicated support',
        'Unlimited storage',
        'Custom integrations',
        'SLA guarantee'
      ],
      maxClients: 999999,
      maxUsers: 999999
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              formData.plan === plan.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => updateFormData({ 
              plan: plan.id as any, 
              maxClients: plan.maxClients, 
              maxUsers: plan.maxUsers 
            })}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </div>
            
            <ul className="mt-6 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading || !formData.plan}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Tenant...' : 'Create Tenant'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingWizard;






























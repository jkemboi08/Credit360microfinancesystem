import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import {
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  BookOpen,
  Shield,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  CreditCard,
  DollarSign,
  FileText,
  Lock,
  Globe
} from 'lucide-react';

const Support: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useSupabaseAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqCategories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'loans', name: 'Loans', icon: CreditCard },
    { id: 'payments', name: 'Payments', icon: DollarSign },
    { id: 'kyc', name: 'KYC & Verification', icon: User },
    { id: 'data_rights', name: 'Data Rights', icon: Shield },
    { id: 'general', name: 'General', icon: FileText }
  ];

  const faqs = [
    {
      id: 1,
      category: 'loans',
      question: {
        en: 'How do I apply for a loan?',
        sw: 'Ninawezaje kuomba mkopo?'
      },
      answer: {
        en: 'You can apply for a loan through our online portal or visit any of our branches. You will need to provide your NIDA ID, proof of income, and complete our KYC verification process.',
        sw: 'Unaweza kuomba mkopo kupitia tovuti yetu au kutembelea tawi lolote la makampuni yetu. Utahitaji kutoa kitambulisho chako cha NIDA, uthibitisho wa mapato, na kukamilisha mchakato wetu wa uthibitishaji wa KYC.'
      }
    },
    {
      id: 2,
      category: 'payments',
      question: {
        en: 'What payment methods are accepted?',
        sw: 'Ni njia zipi za malipo zinazokubaliwa?'
      },
      answer: {
        en: 'We accept payments via M-Pesa, Tigo Pesa, Airtel Money, bank transfers, and cash payments at our branches. Mobile money is the most convenient option.',
        sw: 'Tunakubali malipo kupitia M-Pesa, Tigo Pesa, Airtel Money, uhamisho wa benki, na malipo ya fedha taslimu katika matawi yetu. Fedha za simu ni chaguo rahisi zaidi.'
      }
    },
    {
      id: 3,
      category: 'kyc',
      question: {
        en: 'What is KYC verification and why is it required?',
        sw: 'Uthibitishaji wa KYC ni nini na kwa nini unahitajika?'
      },
      answer: {
        en: 'KYC (Know Your Customer) verification is required by law to prevent fraud and money laundering. We verify your identity using NIDA ID, capture your photo and biometric data, and screen against sanctions lists.',
        sw: 'Uthibitishaji wa KYC (Kujua Mteja Wako) unahitajika kisheria kuzuia ulaghai na kuosha fedha. Tunathibitisha utambulisho wako kwa kutumia kitambulisho cha NIDA, kupiga picha yako na data ya kibayolojia, na kuchunguza dhidi ya orodha za vikwazo.'
      }
    },
    {
      id: 4,
      category: 'data_rights',
      question: {
        en: 'What are my data rights under the Data Protection Act?',
        sw: 'Ni haki zipi za data ninazozimiliki chini ya Sheria ya Ulinzi wa Data?'
      },
      answer: {
        en: 'Under the Data Protection Act 2022, you have the right to access, rectify, erase, and port your personal data. You can download your data, request corrections, or ask for deletion through our Data Subject Portal.',
        sw: 'Chini ya Sheria ya Ulinzi wa Data 2022, una haki ya kufikia, kurekebisha, kufuta, na kuhamisha data yako ya kibinafsi. Unaweza kupakua data yako, kuomba marekebisho, au kuomba ufutaji kupitia Mlango wetu wa Mhusika wa Data.'
      }
    },
    {
      id: 5,
      category: 'loans',
      question: {
        en: 'How is my interest rate calculated?',
        sw: 'Kiwango changu cha riba kinakokotolewa vipi?'
      },
      answer: {
        en: 'Interest rates are calculated based on your credit score, loan amount, repayment period, and risk assessment. We provide both nominal and effective annual rates (APR) for full transparency as required by the Microfinance Act 2018.',
        sw: 'Viwango vya riba vinakokotolewa kulingana na alama yako ya mkopo, kiasi cha mkopo, kipindi cha kulipa, na tathmini ya hatari. Tunatoa viwango vya kawaida na vya ufanisi vya kila mwaka (APR) kwa uwazi kamili kama inavyohitajika na Sheria ya Microfinance 2018.'
      }
    },
    {
      id: 6,
      category: 'general',
      question: {
        en: 'How can I get my free annual credit report?',
        sw: 'Ninawezaje kupata ripoti yangu ya bure ya mkopo ya kila mwaka?'
      },
      answer: {
        en: 'You are entitled to one free credit report per year from the Credit Reference Bureau. You can request this through our client portal or by visiting any branch. The report will be provided in PDF format.',
        sw: 'Una haki ya ripoti moja ya bure ya mkopo kila mwaka kutoka kwa Ofisi ya Marejeleo ya Mikopo. Unaweza kuiomba kupitia mlango wetu wa wateja au kwa kutembelea tawi lolote. Ripoti itatolewa katika muundo wa PDF.'
      }
    }
  ];

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const financialEducationResources = [
    {
      title: {
        en: 'Budgeting Basics',
        sw: 'Misingi ya Bajeti'
      },
      description: {
        en: 'Learn how to create and manage a personal budget',
        sw: 'Jifunze jinsi ya kuunda na kusimamia bajeti ya kibinafsi'
      },
      type: 'Course',
      duration: '30 minutes'
    },
    {
      title: {
        en: 'Understanding Interest Rates',
        sw: 'Kuelewa Viwango vya Riba'
      },
      description: {
        en: 'How loan interest and fees work',
        sw: 'Jinsi riba ya mkopo na ada zinavyofanya kazi'
      },
      type: 'Video',
      duration: '15 minutes'
    },
    {
      title: {
        en: 'Building Credit History',
        sw: 'Kujenga Historia ya Mkopo'
      },
      description: {
        en: 'Tips for maintaining a good credit score',
        sw: 'Vidokezo vya kudumisha alama nzuri ya mkopo'
      },
      type: 'Guide',
      duration: '10 minutes'
    },
    {
      title: {
        en: 'Mobile Money Safety',
        sw: 'Usalama wa Fedha za Simu'
      },
      description: {
        en: 'Best practices for secure mobile payments',
        sw: 'Mazoea bora ya malipo salama ya simu'
      },
      type: 'Article',
      duration: '5 minutes'
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{t('support')} & Help</h1>
          <p className="text-green-100">
            Get help with loans, payments, data rights, and financial education
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Support */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                Contact Support
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <Phone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Phone Support</h4>
                  <p className="text-sm text-gray-600 mt-1">+255 123 456 789</p>
                  <p className="text-xs text-gray-500">Mon-Fri 8AM-6PM</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Email Support</h4>
                  <p className="text-sm text-gray-600 mt-1">support@mfi.co.tz</p>
                  <p className="text-xs text-gray-500">24-48 hour response</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Live Chat</h4>
                  <p className="text-sm text-gray-600 mt-1">Available now</p>
                  <button className="text-xs text-purple-600 hover:text-purple-800 mt-1">
                    Start Chat
                  </button>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-orange-600" />
                Frequently Asked Questions
              </h3>

              {/* FAQ Categories */}
              <div className="flex flex-wrap gap-2 mb-6">
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <category.icon className="w-4 h-4 mr-2" />
                    {category.name}
                  </button>
                ))}
              </div>

              {/* FAQ Items */}
              <div className="space-y-3">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">
                        {faq.question[language]}
                      </span>
                      {expandedFaq === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-3 text-gray-700">
                        {faq.answer[language]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Education */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                {t('financial_education')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {financialEducationResources.map((resource, index) => (
                  <div key={index} className="p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {resource.title[language]}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                        {resource.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {resource.description[language]}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{resource.duration}</span>
                      <button className="text-sm text-indigo-600 hover:text-indigo-800">
                        Start Learning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Data Rights */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                {t('data_protection')} Rights
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium text-left">
                  <div className="flex items-center">
                    <Download className="w-5 h-5 text-white mr-3" />
                    <div>
                      <h4 className="font-medium text-white">Download My Data</h4>
                      <p className="text-sm text-green-100">Export all personal data</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium text-left">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-white mr-3" />
                    <div>
                      <h4 className="font-medium text-white">Request Data Correction</h4>
                      <p className="text-sm text-blue-100">Update incorrect information</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium text-left">
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-white mr-3" />
                    <div>
                      <h4 className="font-medium text-white">Request Data Deletion</h4>
                      <p className="text-sm text-red-100">Delete personal data</p>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  Your data rights are protected under the Data Protection Act 2022. 
                  All requests are processed within 30 days.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              
              <div className="space-y-2">
                <a href="#" className="block p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                  Privacy Policy
                </a>
                <a href="#" className="block p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                  Terms of Service
                </a>
                <a href="#" className="block p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                  Loan Terms & Conditions
                </a>
                <a href="#" className="block p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                  Fee Schedule
                </a>
                <a href="#" className="block p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                  Complaint Procedure
                </a>
              </div>
            </div>

            {/* Language & Accessibility */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-600" />
                Language & Accessibility
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Current Language</h4>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'English' : 'Kiswahili'}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Accessibility</h4>
                  <p className="text-sm text-gray-600">
                    Screen reader compatible, keyboard navigation supported
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Emergency Support</h3>
              <p className="text-sm text-red-800 mb-3">
                For urgent issues related to fraud, unauthorized transactions, or security concerns:
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-900">+255 700 000 000</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-900">emergency@mfi.co.tz</span>
                </div>
              </div>
              <p className="text-xs text-red-700 mt-2">Available 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
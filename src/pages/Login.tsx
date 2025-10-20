import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Globe, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardBody, CardTitle, CardDescription } from '../components/ui/Card';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'staff' // Fixed to staff since this is staff-only web app
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, isAuthenticated, user, loading: authLoading } = useSupabaseAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login page - auth state:', { isAuthenticated, user: user?.email, authLoading });
    if (isAuthenticated && user) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate(`/${formData.role}/dashboard`);
    }
  }, [isAuthenticated, user, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading || authLoading) return; // Prevent multiple submissions
    
    setLoading(true);
    
    try {
      console.log('🔐 Starting login process...');
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        console.log('✅ Login successful');
        toast.success(`Welcome! Login successful`);
        // The useEffect will handle the redirect when isAuthenticated becomes true
      } else {
        console.error('❌ Login failed:', result.error);
        toast.error(result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error('Login failed. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <Card variant="elevated" padding="xl" className="animate-fade-in">
          {/* Header */}
          <CardHeader className="text-center pb-6">
            <div className="flex flex-col items-center space-y-4">
              <img 
                src="/mfi_logo__2_-removebg-preview.png" 
                alt="RYTHM Microfinance Limited Logo" 
                className="w-48 h-40 object-contain" 
              />
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  RYTHM Microfinance Limited
                </CardTitle>
                <CardDescription className="text-base">
                  Credit Management System
                </CardDescription>
              </div>
              
              {/* Language Selector */}
              <div className="flex items-center justify-center space-x-2 bg-gray-50 rounded-lg p-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'sw')}
                  className="text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 font-medium"
                >
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                </select>
              </div>
            </div>
          </CardHeader>

          {/* Login Form */}
          <CardBody className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email/Username Input */}
              <Input
                label={t('email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter your email address"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              {/* Password Input */}
              <Input
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />


              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                fullWidth
                className="mt-6"
              >
                {loading ? 'Logging in...' : t('login')}
              </Button>


              {/* Forgot Password */}
              <div className="text-center pt-4">
                <a href="#" className="text-sm text-primary-600 hover:text-primary-800 transition-colors">
                  Forgot password? / Umesahau nenosiri?
                </a>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 space-y-2 animate-fade-in">
          <p>
            <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a> | 
            <a href="#" className="hover:text-primary-600 ml-1 transition-colors">Terms of Use</a> | 
            <a href="#" className="hover:text-primary-600 ml-1 transition-colors">Contact Support</a>
          </p>
          <p className="text-xs text-gray-500">
            Protected by AES-256 encryption | Compliant with BoT Regulations 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
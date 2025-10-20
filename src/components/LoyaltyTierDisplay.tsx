import React from 'react';
import { Star, Crown, Award, Gem, Zap, Shield, Clock, Gift } from 'lucide-react';

interface LoyaltyTierDisplayProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  status: 'new' | 'returning' | 'loyal' | 'vip' | 'at_risk' | null;
  performanceScore: number | null;
  lifetimeValue: number | null;
  totalLoans: number | null;
  showBenefits?: boolean;
  compact?: boolean;
}

const LoyaltyTierDisplay: React.FC<LoyaltyTierDisplayProps> = ({
  tier,
  status,
  performanceScore,
  lifetimeValue,
  totalLoans,
  showBenefits = true,
  compact = false
}) => {
  const getTierConfig = (tier: string | null) => {
    switch (tier) {
      case 'platinum':
        return {
          name: 'Platinum',
          color: 'purple',
          icon: Crown,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-300',
          iconColor: 'text-purple-600'
        };
      case 'gold':
        return {
          name: 'Gold',
          color: 'yellow',
          icon: Award,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          iconColor: 'text-yellow-600'
        };
      case 'silver':
        return {
          name: 'Silver',
          color: 'gray',
          icon: Star,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600'
        };
      case 'bronze':
        return {
          name: 'Bronze',
          color: 'orange',
          icon: Gem,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300',
          iconColor: 'text-orange-600'
        };
      default:
        return {
          name: 'Bronze',
          color: 'gray',
          icon: Gem,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600'
        };
    }
  };

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'vip':
        return {
          name: 'VIP',
          color: 'purple',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-300'
        };
      case 'loyal':
        return {
          name: 'Loyal',
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        };
      case 'returning':
        return {
          name: 'Returning',
          color: 'blue',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300'
        };
      case 'at_risk':
        return {
          name: 'At Risk',
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300'
        };
      default:
        return {
          name: 'New',
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        };
    }
  };

  const getTierBenefits = (tier: string | null) => {
    switch (tier) {
      case 'platinum':
        return [
          { icon: Zap, text: 'Instant approval', color: 'text-purple-600' },
          { icon: Gift, text: '1% interest discount', color: 'text-purple-600' },
          { icon: Shield, text: 'VIP support', color: 'text-purple-600' },
          { icon: Clock, text: 'Priority processing', color: 'text-purple-600' }
        ];
      case 'gold':
        return [
          { icon: Zap, text: 'Express approval', color: 'text-yellow-600' },
          { icon: Gift, text: '0.5% interest discount', color: 'text-yellow-600' },
          { icon: Shield, text: 'Dedicated support', color: 'text-yellow-600' },
          { icon: Clock, text: 'Faster processing', color: 'text-yellow-600' }
        ];
      case 'silver':
        return [
          { icon: Clock, text: 'Priority processing', color: 'text-gray-600' },
          { icon: Gift, text: '0.25% interest discount', color: 'text-gray-600' },
          { icon: Shield, text: 'Enhanced support', color: 'text-gray-600' }
        ];
      case 'bronze':
        return [
          { icon: Shield, text: 'Basic support', color: 'text-orange-600' },
          { icon: Gift, text: 'Welcome bonus', color: 'text-orange-600' }
        ];
      default:
        return [];
    }
  };

  const tierConfig = getTierConfig(tier);
  const statusConfig = getStatusConfig(status);
  const benefits = getTierBenefits(tier);
  const IconComponent = tierConfig.icon;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${tierConfig.bgColor} ${tierConfig.textColor} ${tierConfig.borderColor}`}>
        <IconComponent className={`w-4 h-4 ${tierConfig.iconColor}`} />
        <span className="text-sm font-medium">{tierConfig.name}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          {statusConfig.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${tierConfig.bgColor} ${tierConfig.borderColor} p-4`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-full ${tierConfig.bgColor}`}>
          <IconComponent className={`w-6 h-6 ${tierConfig.iconColor}`} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${tierConfig.textColor}`}>
            {tierConfig.name} Tier
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.name} Customer
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {performanceScore || 0}
          </div>
          <div className="text-sm text-gray-600">Performance Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {totalLoans || 0}
          </div>
          <div className="text-sm text-gray-600">Total Loans</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(lifetimeValue)}
          </div>
          <div className="text-sm text-gray-600">Lifetime Value</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {tier === 'platinum' ? '2.0x' : tier === 'gold' ? '1.5x' : tier === 'silver' ? '1.2x' : '1.0x'}
          </div>
          <div className="text-sm text-gray-600">Credit Limit</div>
        </div>
      </div>

      {showBenefits && benefits.length > 0 && (
        <div>
          <h4 className={`text-sm font-semibold ${tierConfig.textColor} mb-2`}>
            Tier Benefits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
                <span className="text-sm text-gray-700">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyTierDisplay;


import React, { useState } from 'react';

// Mock data types
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  features: string[];
}

interface UsageData {
  currentCredits: number;
  totalCredits: number;
  usedThisMonth: number;
  monthlyAverage: number;
  usageHistory: {
    date: string;
    credits: number;
  }[];
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  credits: number;
  downloadUrl?: string;
}

// Mock data
const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 29,
    features: ['100 AI Credits', 'Basic Support', 'Standard Processing']
  },
  {
    id: 'pro',
    name: 'Professional',
    credits: 500,
    price: 99,
    originalPrice: 145,
    popular: true,
    features: ['500 AI Credits', 'Priority Support', 'Fast Processing', 'Analytics Dashboard']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 2000,
    price: 299,
    originalPrice: 580,
    features: ['2000 AI Credits', '24/7 Support', 'Ultra Fast Processing', 'Advanced Analytics', 'Custom Integration']
  }
];

const usageData: UsageData = {
  currentCredits: 342,
  totalCredits: 500,
  usedThisMonth: 158,
  monthlyAverage: 145,
  usageHistory: [
    { date: '2024-01', credits: 120 },
    { date: '2024-02', credits: 145 },
    { date: '2024-03', credits: 158 },
    { date: '2024-04', credits: 132 },
    { date: '2024-05', credits: 167 },
    { date: '2024-06', credits: 158 }
  ]
};

const invoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    date: '2024-06-15',
    amount: 99.00,
    status: 'paid',
    description: 'Professional Plan - 500 Credits',
    credits: 500,
    downloadUrl: '#'
  },
  {
    id: 'INV-2024-002',
    date: '2024-05-15',
    amount: 99.00,
    status: 'paid',
    description: 'Professional Plan - 500 Credits',
    credits: 500,
    downloadUrl: '#'
  },
  {
    id: 'INV-2024-003',
    date: '2024-04-15',
    amount: 99.00,
    status: 'paid',
    description: 'Professional Plan - 500 Credits',
    credits: 500,
    downloadUrl: '#'
  },
  {
    id: 'INV-2024-004',
    date: '2024-03-15',
    amount: 29.00,
    status: 'paid',
    description: 'Starter Plan - 100 Credits',
    credits: 100,
    downloadUrl: '#'
  }
];

const SubscriptionPage: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<string>('pro');
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'usage'>('overview');

  const handlePurchase = (packageId: string) => {
    console.log('Purchasing package:', packageId);
    // Mock purchase flow
    alert('Redirecting to payment processor...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4ecdc4';
      case 'pending': return '#ffd93d';
      case 'failed': return '#ff6b6b';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '32px',
      minHeight: 'calc(100vh - 70px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1400,
        padding: 32,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        border: '1.5px solid rgba(255,255,255,0.18)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(8px)',
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 32, color: 'white', letterSpacing: 1, marginBottom: 24 }}>
          Subscription & Billing
        </h2>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 32,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 16
        }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'billing', label: 'Billing History' },
            { id: 'usage', label: 'Usage Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 12,
                color: 'white',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Current Plan & Credits */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
              marginBottom: 32
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: 24,
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
                <h3 style={{ color: 'white', marginBottom: 12, fontSize: 18 }}>Current Credits</h3>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#4ecdc4', marginBottom: 8 }}>
                  {usageData.currentCredits}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  of {usageData.totalCredits} total credits
                </div>
                <div style={{
                  width: '100%',
                  height: 8,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  marginTop: 12,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(usageData.currentCredits / usageData.totalCredits) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4ecdc4, #44a08d)',
                    borderRadius: 4
                  }} />
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: 24,
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
                <h3 style={{ color: 'white', marginBottom: 12, fontSize: 18 }}>This Month</h3>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#ff6b6b', marginBottom: 8 }}>
                  {usageData.usedThisMonth}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  credits used
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: 24,
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
                <h3 style={{ color: 'white', marginBottom: 12, fontSize: 18 }}>Monthly Average</h3>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#667eea', marginBottom: 8 }}>
                  {usageData.monthlyAverage}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  credits per month
                </div>
              </div>
            </div>

            {/* Credit Packages */}
            <h3 style={{ color: 'white', marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
              Purchase Credits
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
              marginBottom: 32
            }}>
              {creditPackages.map(pkg => (
                <div
                  key={pkg.id}
                  style={{
                    background: pkg.popular ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.10)',
                    borderRadius: 20,
                    padding: 24,
                    border: pkg.popular ? '2px solid #4ecdc4' : '1.5px solid rgba(255,255,255,0.18)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {pkg.popular && (
                    <div style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#4ecdc4',
                      color: 'white',
                      padding: '4px 16px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      MOST POPULAR
                    </div>
                  )}
                  
                  <h4 style={{ color: 'white', marginBottom: 8, fontSize: 20, fontWeight: 600 }}>
                    {pkg.name}
                  </h4>
                  
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: '#4ecdc4' }}>
                      ${pkg.price}
                    </span>
                    {pkg.originalPrice && (
                      <span style={{
                        fontSize: 18,
                        color: 'rgba(255,255,255,0.5)',
                        textDecoration: 'line-through',
                        marginLeft: 8
                      }}>
                        ${pkg.originalPrice}
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                      {pkg.credits.toLocaleString()} Credits
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      ${(pkg.price / pkg.credits).toFixed(2)} per credit
                    </div>
                  </div>

                  <ul style={{ marginBottom: 24, paddingLeft: 20 }}>
                    {pkg.features.map((feature, index) => (
                      <li key={index} style={{
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: 8,
                        fontSize: 14
                      }}>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    style={{
                      width: '100%',
                      background: pkg.popular ? '#4ecdc4' : 'rgba(255,255,255,0.1)',
                      color: pkg.popular ? 'white' : 'white',
                      border: 'none',
                      padding: '16px',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Purchase Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing History Tab */}
        {activeTab === 'billing' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
              Billing History
            </h3>
            <div style={{
              background: 'rgba(255,255,255,0.10)',
              borderRadius: 20,
              padding: 24,
              border: '1.5px solid rgba(255,255,255,0.18)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                gap: 16,
                padding: '16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                fontSize: 14
              }}>
                <div>Invoice</div>
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              
              {invoices.map(invoice => (
                <div
                  key={invoice.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                    gap: 16,
                    padding: '16px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ color: 'white', fontWeight: 500 }}>
                    {invoice.id}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {new Date(invoice.date).toLocaleDateString()}
                  </div>
                  <div style={{ color: 'white', fontWeight: 500 }}>
                    ${invoice.amount.toFixed(2)}
                  </div>
                  <div>
                    <span style={{
                      background: getStatusColor(invoice.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                  <div>
                    <button
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 8,
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Analytics Tab */}
        {activeTab === 'usage' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
              Usage Analytics
            </h3>
            
            {/* Usage Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.10)',
              borderRadius: 20,
              padding: 24,
              border: '1.5px solid rgba(255,255,255,0.18)',
              marginBottom: 24
            }}>
              <h4 style={{ color: 'white', marginBottom: 20, fontSize: 18 }}>Monthly Usage Trend</h4>
              <div style={{
                display: 'flex',
                alignItems: 'end',
                gap: 16,
                height: 200,
                padding: '20px 0'
              }}>
                {usageData.usageHistory.map((month, index) => {
                  const maxUsage = Math.max(...usageData.usageHistory.map(m => m.credits));
                  const height = (month.credits / maxUsage) * 100;
                  return (
                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '100%',
                        height: `${height}%`,
                        background: 'linear-gradient(180deg, #4ecdc4, #44a08d)',
                        borderRadius: '8px 8px 0 0',
                        minHeight: 20
                      }} />
                      <div style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 12,
                        marginTop: 8,
                        textAlign: 'center'
                      }}>
                        {month.credits}
                      </div>
                      <div style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 10,
                        marginTop: 4
                      }}>
                        {new Date(month.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Usage Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 24
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: 24,
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
                <h4 style={{ color: 'white', marginBottom: 12, fontSize: 16 }}>Peak Usage</h4>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ff6b6b' }}>
                  {Math.max(...usageData.usageHistory.map(m => m.credits))}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  credits in a month
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: 24,
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
                <h4 style={{ color: 'white', marginBottom: 12, fontSize: 16 }}>Average Daily</h4>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#667eea' }}>
                  {Math.round(usageData.monthlyAverage / 30)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  credits per day
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: 24,
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
                <h4 style={{ color: 'white', marginBottom: 12, fontSize: 16 }}>Total Spent</h4>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#4ecdc4' }}>
                  ${(invoices.reduce((sum, inv) => sum + inv.amount, 0)).toFixed(2)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  lifetime total
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage; 
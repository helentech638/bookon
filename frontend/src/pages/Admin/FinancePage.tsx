import React, { useState, useEffect } from 'react';
import { 
  CurrencyPoundIcon, 
  TagIcon, 
  CreditCardIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  description?: string;
  createdAt: string;
  parent: {
    firstName: string;
    lastName: string;
    email: string;
  };
  booking?: {
    id: string;
    activity: {
      title: string;
    };
    child: {
      firstName: string;
      lastName: string;
    };
  };
  refunds: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

interface Discount {
  id: string;
  name: string;
  code: string;
  type: string;
  value: number;
  usedCount: number;
  maxUses?: number;
  validFrom: string;
  validUntil?: string;
  active: boolean;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface Credit {
  id: string;
  amount: number;
  usedAmount: number;
  source: string;
  description?: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
  parent: {
    firstName: string;
    lastName: string;
    email: string;
  };
  creator?: {
    firstName: string;
    lastName: string;
  };
}

interface Refund {
  id: string;
  amount: number;
  method: string;
  reason: string;
  status: string;
  createdAt: string;
  parent: {
    firstName: string;
    lastName: string;
    email: string;
  };
  transaction: {
    id: string;
    amount: number;
    paymentMethod: string;
  };
  booking?: {
    id: string;
    activity: {
      title: string;
    };
  };
}

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'discounts' | 'credits' | 'refunds' | 'reports'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      let response;
      switch (activeTab) {
        case 'transactions':
          response = await fetch('/api/v1/finance/transactions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setTransactions(data.data || []);
          }
          break;
        case 'discounts':
          response = await fetch('/api/v1/finance/discounts', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setDiscounts(data.data || []);
          }
          break;
        case 'credits':
          response = await fetch('/api/v1/finance/credits', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setCredits(data.data || []);
          }
          break;
        case 'refunds':
          response = await fetch('/api/v1/finance/refunds', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setRefunds(data.data || []);
          }
          break;
        case 'reports':
          response = await fetch('/api/v1/finance/reports', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setStats(data.data);
          }
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'refunded':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'refunded':
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="w-4 h-4" />;
      case 'failed':
      case 'expired':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportData = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`/api/v1/finance/export/${type}?format=csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600">Manage transactions, discounts, credits, and refunds</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'discounts' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>New Discount</span>
            </button>
          )}
          {activeTab === 'credits' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>Issue Credit</span>
            </button>
          )}
          {activeTab === 'refunds' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>New Refund</span>
            </button>
          )}
          {activeTab !== 'reports' && (
            <button
              onClick={() => exportData(activeTab)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'transactions', name: 'Transactions', icon: CurrencyPoundIcon },
            { id: 'discounts', name: 'Discounts', icon: TagIcon },
            { id: 'credits', name: 'Credits', icon: CreditCardIcon },
            { id: 'refunds', name: 'Refunds', icon: ArrowPathIcon },
            { id: 'reports', name: 'Reports', icon: ChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
                  <span className="text-sm text-gray-500">{transactions.length} transactions</span>
                </div>
                
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <CurrencyPoundIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions found</p>
                    <p className="text-sm text-gray-500">Transactions will appear here as payments are processed</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.parent.firstName} {transaction.parent.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{transaction.parent.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {transaction.booking?.activity.title || 'N/A'}
                              </div>
                              {transaction.booking?.child && (
                                <div className="text-sm text-gray-500">
                                  {transaction.booking.child.firstName} {transaction.booking.child.lastName}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {transaction.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {getStatusIcon(transaction.status)}
                                <span className="ml-1">{transaction.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Discounts Tab */}
            {activeTab === 'discounts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Discounts</h3>
                  <span className="text-sm text-gray-500">{discounts.length} discounts</span>
                </div>
                
                {discounts.length === 0 ? (
                  <div className="text-center py-8">
                    <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No discounts found</p>
                    <p className="text-sm text-gray-500">Create your first discount to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {discounts.map((discount) => (
                      <div key={discount.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{discount.name}</h4>
                          <div className="flex items-center space-x-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              discount.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {discount.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">Code: <span className="font-mono font-medium">{discount.code}</span></p>
                        <p className="text-sm text-gray-500 mb-2">
                          {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)} off
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{discount.usedCount} used</span>
                          {discount.maxUses && (
                            <span>of {discount.maxUses}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center space-x-1">
                            <EyeIcon className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center space-x-1">
                            <PencilIcon className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Credits Tab */}
            {activeTab === 'credits' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Credits</h3>
                  <span className="text-sm text-gray-500">{credits.length} credits</span>
                </div>
                
                {credits.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No credits found</p>
                    <p className="text-sm text-gray-500">Credits will appear here as they are issued</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {credits.map((credit) => (
                          <tr key={credit.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {credit.parent.firstName} {credit.parent.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{credit.parent.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(credit.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(credit.usedAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                {credit.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                                {getStatusIcon(credit.status)}
                                <span className="ml-1">{credit.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {credit.expiresAt ? formatDate(credit.expiresAt) : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Refunds Tab */}
            {activeTab === 'refunds' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Refunds</h3>
                  <span className="text-sm text-gray-500">{refunds.length} refunds</span>
                </div>
                
                {refunds.length === 0 ? (
                  <div className="text-center py-8">
                    <ArrowPathIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No refunds found</p>
                    <p className="text-sm text-gray-500">Refunds will appear here as they are processed</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {refunds.map((refund) => (
                          <tr key={refund.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {refund.parent.firstName} {refund.parent.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{refund.parent.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {refund.booking?.activity.title || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(refund.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {refund.method}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refund.status)}`}>
                                {getStatusIcon(refund.status)}
                                <span className="ml-1">{refund.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(refund.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Finance Reports</h3>
                  <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="1y">Last year</option>
                    </select>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Export Report</span>
                    </button>
                  </div>
                </div>
                
                {stats ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Transaction Stats */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CurrencyPoundIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatCurrency(stats.transactions?.paidAmount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Discount Stats */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <TagIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Discounts Used</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.discounts?.totalUsed || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Credit Stats */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CreditCardIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Credits Issued</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatCurrency(stats.credits?.totalIssued || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Refund Stats */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ArrowPathIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Refunds Processed</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatCurrency(stats.refunds?.total || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No report data available</p>
                    <p className="text-sm text-gray-500">Select a time period to view reports</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancePage;

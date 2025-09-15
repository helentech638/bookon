import React, { useState, useEffect } from 'react';
import { 
  CurrencyPoundIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  parentName: string;
  childName: string;
  activity: string;
  venue: string;
  amount: number;
  paymentMethod: string;
  status: string;
  date: string;
  time: string;
  createdAt: string;
}

interface FinanceStats {
  totalRevenue: number;
  cardPayments: number;
  tfcPayments: number;
  creditPayments: number;
}

const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: '',
    status: ''
  });

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      if (!token) {
        return;
      }

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(filters.search && { search: filters.search }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...(filters.status && { status: filters.status })
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(buildApiUrl(`/business/finance/transactions?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions || []);
        setStats(data.data.stats || null);
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Transactions fetch error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Transactions loading timeout - please refresh');
        toast.error('Transactions loading timeout - please refresh');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load transactions');
        toast.error('Failed to load transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'transactions', name: 'Transactions', icon: CreditCardIcon },
    { id: 'discounts', name: 'Discounts', icon: BanknotesIcon },
    { id: 'credits', name: 'Credits', icon: ArrowTrendingUpIcon },
    { id: 'refunds', name: 'Refunds', icon: CreditCardIcon },
    { id: 'reports', name: 'Reports', icon: ChartBarIcon }
  ];


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'Card': return 'bg-blue-100 text-blue-800';
      case 'Tax-Free Childcare': return 'bg-purple-100 text-purple-800';
      case 'Credit': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTransactions = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyPoundIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£{stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Card Payments</p>
              <p className="text-2xl font-bold text-gray-900">£{stats?.cardPayments?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">TFC Payments</p>
              <p className="text-2xl font-bold text-gray-900">£{stats?.tfcPayments?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Credit Used</p>
              <p className="text-2xl font-bold text-gray-900">£{stats?.creditPayments?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a]"
            />
          </div>
          <select 
            value={filters.paymentMethod}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a]"
          >
            <option value="">All Payment Methods</option>
            <option value="card">Card</option>
            <option value="tax_free_childcare">Tax-Free Childcare</option>
            <option value="credit">Credit</option>
          </select>
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a]"
          >
            <option value="">All Status</option>
            <option value="succeeded">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <Button className="bg-[#00806a] hover:bg-[#006d5a] text-white">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent / Child
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.parentName}</div>
                        <div className="text-sm text-gray-500">{transaction.childName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.activity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      £{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(transaction.paymentMethod)}`}>
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date} {transaction.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => {/* View transaction */}}
                        className="text-[#00806a] hover:text-[#006d5a]"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderDiscounts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Discounts</h2>
        <Button className="bg-[#00806a] hover:bg-[#006d5a] text-white">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Discount
        </Button>
      </div>
      <Card className="bg-white p-6">
        <p className="text-gray-500">Discount management coming soon...</p>
      </Card>
    </div>
  );

  const renderCredits = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Credits</h2>
        <Button className="bg-[#00806a] hover:bg-[#006d5a] text-white">
          <PlusIcon className="w-4 h-4 mr-2" />
          Issue Credit
        </Button>
      </div>
      <Card className="bg-white p-6">
        <p className="text-gray-500">Credit management coming soon...</p>
      </Card>
    </div>
  );

  const renderRefunds = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Refunds</h2>
      </div>
      <Card className="bg-white p-6">
        <p className="text-gray-500">Refund management coming soon...</p>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
        <div className="flex space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a]">
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
          <Button className="bg-[#00806a] hover:bg-[#006d5a] text-white">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyPoundIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gross Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£5,250</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Discounts Applied</p>
              <p className="text-2xl font-bold text-gray-900">£125</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£5,125</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chart visualization coming soon...</p>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transactions': return renderTransactions();
      case 'discounts': return renderDiscounts();
      case 'credits': return renderCredits();
      case 'refunds': return renderRefunds();
      case 'reports': return renderReports();
      default: return renderTransactions();
    }
  };

  return (
    <BusinessLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#00806a] text-[#00806a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </BusinessLayout>
  );
};

export default FinancePage;

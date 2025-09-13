import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CurrencyPoundIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/authService';

interface WalletCredit {
  id: string;
  parentId: string;
  providerId?: string;
  bookingId?: string;
  amount: number;
  usedAmount: number;
  expiryDate: string;
  source: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  usedAt?: string;
  transactionId?: string;
}

interface WalletBalance {
  totalCredits: number;
  availableCredits: number;
  usedCredits: number;
  expiredCredits: number;
  creditsByProvider: Record<string, number>;
  credits: WalletCredit[];
}

const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }

      const result = await response.json();
      setBalance(result.data);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setError('Failed to load wallet balance');
    } finally {
      setLoading(false);
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (credit: WalletCredit) => {
    const now = new Date();
    const expiryDate = new Date(credit.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (credit.status === 'expired' || expiryDate <= now) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="destructive">Expires Soon</Badge>;
    } else if (credit.status === 'used') {
      return <Badge variant="secondary">Used</Badge>;
    } else {
      return <Badge variant="secondary">Active</Badge>;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'cancellation':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
      case 'provider_cancellation':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'refund':
        return <ArrowPathIcon className="h-4 w-4 text-blue-500" />;
      case 'transfer':
        return <ArrowPathIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <CurrencyPoundIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'cancellation':
        return 'Cancellation Credit';
      case 'provider_cancellation':
        return 'Provider Cancellation';
      case 'refund':
        return 'Refund Credit';
      case 'transfer':
        return 'Transfer';
      case 'manual':
        return 'Manual Credit';
      default:
        return source.charAt(0).toUpperCase() + source.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Wallet</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchWalletBalance} className="w-full">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your credits and view your balance</p>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CurrencyPoundIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Credits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(balance?.availableCredits || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Credits</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(balance?.totalCredits || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Used Credits</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(balance?.usedCredits || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired Credits</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(balance?.expiredCredits || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credits by Provider */}
        {Object.keys(balance?.creditsByProvider || {}).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Credits by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(balance?.creditsByProvider || {}).map(([provider, amount]) => (
                  <div key={provider} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {provider === 'general' ? 'General Credits' : provider}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credits List */}
        <Card>
          <CardHeader>
            <CardTitle>Credit History</CardTitle>
          </CardHeader>
          <CardContent>
            {balance?.credits.length === 0 ? (
              <div className="text-center py-8">
                <CurrencyPoundIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No credits available</p>
                <p className="text-sm text-gray-500 mt-2">
                  Credits will appear here when you receive them from cancellations or refunds
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {balance?.credits.map((credit) => {
                  const now = new Date();
                  const expiryDate = new Date(credit.expiryDate);
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const availableAmount = credit.amount - credit.usedAmount;

                  return (
                    <div key={credit.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getSourceIcon(credit.source)}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {getSourceLabel(credit.source)}
                            </h3>
                            {credit.description && (
                              <p className="text-sm text-gray-600">{credit.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(availableAmount)}
                          </p>
                          {getStatusBadge(credit)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <p className="font-medium">{formatCurrency(credit.amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Used:</span>
                          <p className="font-medium">{formatCurrency(credit.usedAmount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Expires:</span>
                          <p className="font-medium">{formatDate(credit.expiryDate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Days Left:</span>
                          <p className={`font-medium ${
                            daysUntilExpiry <= 30 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                          </p>
                        </div>
                      </div>

                      {credit.usedAt && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            Used on: {formatDate(credit.usedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How Credits Work</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Credits are issued when you cancel bookings (minus admin fee)</li>
                  <li>• Provider cancellations result in full credits (no admin fee)</li>
                  <li>• Credits can be used for future bookings</li>
                  <li>• Credits expire after 12 months</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Using Credits</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Credits are automatically applied at checkout</li>
                  <li>• You can choose how much credit to use</li>
                  <li>• Credits are used in order of expiry date</li>
                  <li>• You'll receive email reminders before expiry</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;

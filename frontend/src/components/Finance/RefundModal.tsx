import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  CurrencyPoundIcon,
  ArrowPathIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  refund?: {
    id: string;
    amount: number;
    method: string;
    reason: string;
    status: string;
    parentId: string;
    transactionId: string;
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
  } | null;
  onSave: (refund: any) => void;
  onDelete?: (id: string) => void;
}

const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  refund,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    transactionId: '',
    parentId: '',
    amount: 0,
    method: 'original_payment',
    reason: '',
    status: 'processing'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refundMethods = [
    { value: 'original_payment', label: 'Original Payment Method', description: 'Refund to the original payment method', icon: CreditCardIcon },
    { value: 'credit', label: 'Account Credit', description: 'Add credit to parent account', icon: ArrowPathIcon }
  ];

  const refundReasons = [
    'Booking cancelled by parent',
    'Booking cancelled by provider',
    'Activity cancelled',
    'Technical issue',
    'Duplicate payment',
    'Incorrect amount charged',
    'Service not provided',
    'Other'
  ];

  const refundStatuses = [
    { value: 'processing', label: 'Processing', description: 'Refund is being processed' },
    { value: 'refunded', label: 'Refunded', description: 'Refund has been completed' },
    { value: 'failed', label: 'Failed', description: 'Refund failed to process' }
  ];

  useEffect(() => {
    if (refund) {
      setFormData({
        transactionId: refund.transactionId,
        parentId: refund.parentId,
        amount: refund.amount,
        method: refund.method,
        reason: refund.reason,
        status: refund.status
      });
      setSelectedTransaction(refund.transaction);
    } else {
      setFormData({
        transactionId: '',
        parentId: '',
        amount: 0,
        method: 'original_payment',
        reason: '',
        status: 'processing'
      });
      setSelectedTransaction(null);
    }
    setErrors({});
    setSearchTerm('');
  }, [refund, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/v1/finance/transactions?status=paid', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTransactionSelect = (transaction: any) => {
    setSelectedTransaction(transaction);
    handleInputChange('transactionId', transaction.id);
    handleInputChange('parentId', transaction.parentId);
    handleInputChange('amount', transaction.amount);
    setSearchTerm(`${transaction.parent.firstName} ${transaction.parent.lastName} - ${transaction.booking?.activity?.title || 'Transaction'}`);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.transactionId) {
      newErrors.transactionId = 'Please select a transaction';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Refund amount must be greater than 0';
    }
    
    if (selectedTransaction && formData.amount > selectedTransaction.amount) {
      newErrors.amount = 'Refund amount cannot exceed transaction amount';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Refund reason is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving refund:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (refund && onDelete && window.confirm('Are you sure you want to delete this refund?')) {
      try {
        await onDelete(refund.id);
        onClose();
      } catch (error) {
        console.error('Error deleting refund:', error);
      }
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    `${transaction.parent.firstName} ${transaction.parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.booking?.activity?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {refund ? 'Edit Refund' : 'Process Refund'}
            </h2>
            <p className="text-sm text-gray-600">
              {refund ? 'Update refund details' : 'Process a refund for a transaction'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Transaction Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Transaction *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transactions by parent name, email, or activity..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <CurrencyPoundIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              
              {searchTerm && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <button
                        key={transaction.id}
                        onClick={() => handleTransactionSelect(transaction)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.parent.firstName} {transaction.parent.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{transaction.parent.email}</div>
                            {transaction.booking?.activity?.title && (
                              <div className="text-sm text-gray-600">
                                {transaction.booking.activity.title}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              £{parseFloat(transaction.amount.toString()).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-sm">No transactions found</div>
                  )}
                </div>
              )}
              
              {selectedTransaction && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">
                        {selectedTransaction.parent.firstName} {selectedTransaction.parent.lastName}
                      </div>
                      <div className="text-sm text-blue-700">{selectedTransaction.parent.email}</div>
                      {selectedTransaction.booking?.activity?.title && (
                        <div className="text-sm text-blue-600">
                          {selectedTransaction.booking.activity.title}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-blue-900">
                        £{parseFloat(selectedTransaction.amount.toString()).toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-700">
                        {selectedTransaction.paymentMethod}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.transactionId && (
                <p className="mt-1 text-sm text-red-600">{errors.transactionId}</p>
              )}
            </div>

            {/* Refund Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount (£) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyPoundIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0.01"
                  max={selectedTransaction ? parseFloat(selectedTransaction.amount.toString()) : undefined}
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                  className={`w-full pl-10 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
              {selectedTransaction && (
                <p className="mt-1 text-xs text-gray-500">
                  Maximum refund: £{parseFloat(selectedTransaction.amount.toString()).toFixed(2)}
                </p>
              )}
            </div>

            {/* Refund Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Method *
              </label>
              <div className="space-y-2">
                {refundMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label key={method.value} className="flex items-start">
                      <input
                        type="radio"
                        name="method"
                        value={method.value}
                        checked={formData.method === method.value}
                        onChange={(e) => handleInputChange('method', e.target.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-start">
                        <Icon className="w-5 h-5 text-gray-600 mt-0.5 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{method.label}</div>
                          <div className="text-sm text-gray-500">{method.description}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Refund Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Reason *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reason ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a reason...</option>
                {refundReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            {/* Status (only for editing) */}
            {refund && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {refundStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refund Summary */}
            {formData.amount > 0 && selectedTransaction && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Refund Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Amount:</span>
                    <span className="font-medium">£{parseFloat(selectedTransaction.amount.toString()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Amount:</span>
                    <span className="font-medium">£{formData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium">
                      {refundMethods.find(m => m.value === formData.method)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reason:</span>
                    <span className="font-medium">{formData.reason}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {refund && onDelete && (
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {refund ? 'Update Refund' : 'Process Refund'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;

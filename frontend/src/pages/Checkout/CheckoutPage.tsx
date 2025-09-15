import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, CreditCardIcon, TagIcon, GiftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface Activity {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  price: number;
  venue: {
    name: string;
    address: string;
  };
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  yearGroup?: string;
}

interface Credit {
  id: string;
  amount: number;
  usedAmount: number;
  expiresAt: string;
  description: string;
}

interface PromoCodeResult {
  success: boolean;
  data?: {
    code: string;
    name: string;
    type: string;
    discountAmount: number;
    finalAmount: number;
  };
  message?: string;
}

const CheckoutPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const navigate = useNavigate();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [selectedCreditId, setSelectedCreditId] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeResult, setPromoCodeResult] = useState<PromoCodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [error, setError] = useState('');

  // Calculate totals
  const originalAmount = activity?.price || 0;
  const promoDiscount = promoCodeResult?.data?.discountAmount || 0;
  const creditAmount = selectedCreditId ? credits.find(c => c.id === selectedCreditId)?.amount || 0 : 0;
  const finalAmount = Math.max(0, originalAmount - promoDiscount - creditAmount);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch activity details
        const activityResponse = await fetch(buildApiUrl(`/activities/${activityId}`), {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        });
        
        if (!activityResponse.ok) throw new Error('Failed to fetch activity');
        const activityData = await activityResponse.json();
        setActivity(activityData.data);

        // Fetch child details
        if (childId) {
          const childResponse = await fetch(buildApiUrl(`/children/${childId}`), {
            headers: {
              'Authorization': `Bearer ${authService.getToken()}`
            }
          });
          
          if (!childResponse.ok) throw new Error('Failed to fetch child');
          const childData = await childResponse.json();
          setChild(childData.data);
        }

        // Fetch available credits
        const creditsResponse = await fetch(buildApiUrl('/wallet/credits'), {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        });
        
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          setCredits(creditsData.data.filter((credit: Credit) => 
            credit.amount > credit.usedAmount && 
            new Date(credit.expiresAt) > new Date()
          ));
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load checkout data');
      } finally {
        setIsLoading(false);
      }
    };

    if (activityId) {
      fetchData();
    }
  }, [activityId, childId]);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    setError('');
    
    try {
      const response = await fetch(buildApiUrl('/promo-codes/validate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          amount: originalAmount,
          activityId
        })
      });
      
      const result = await response.json();
      setPromoCodeResult(result);
      
      if (!result.success) {
        setError(result.message || 'Invalid promo code');
      }
    } catch (err) {
      console.error('Error applying promo code:', err);
      setError('Failed to apply promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setPromoCodeResult(null);
    setError('');
  };

  const handleProceedToPayment = () => {
    // Navigate to payment with all the data
    const paymentData = {
      activityId,
      childId,
      originalAmount,
      promoDiscount,
      creditAmount,
      finalAmount,
      promoCode: promoCodeResult?.data?.code,
      creditId: selectedCreditId
    };
    
    navigate('/payment', { state: paymentData });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a]"></div>
        </div>
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/activities')}>
              Back to Activities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Activity Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Activity</span>
              <span className="font-medium">{activity?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Child</span>
              <span className="font-medium">{child?.firstName} {child?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-medium">
                {activity?.startDate && new Date(activity.startDate).toLocaleDateString('en-GB')} at {activity?.startTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Venue</span>
              <span className="font-medium">{activity?.venue.name}</span>
            </div>
          </div>
        </Card>

        {/* Promo Code */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TagIcon className="h-5 w-5 mr-2 text-[#00806a]" />
            Promo Code
          </h3>
          
          {!promoCodeResult ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyPromoCode}
                  disabled={!promoCode.trim() || isApplyingPromo}
                  variant="outline"
                  className="px-6"
                >
                  {isApplyingPromo ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-900">{promoCodeResult.data?.name}</div>
                  <div className="text-sm text-green-700">Code: {promoCodeResult.data?.code}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-900">-£{promoCodeResult.data?.discountAmount.toFixed(2)}</div>
                  <button
                    onClick={handleRemovePromoCode}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Credits */}
        {credits.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <GiftIcon className="h-5 w-5 mr-2 text-[#00806a]" />
              Available Credits
            </h3>
            
            <div className="space-y-3">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedCreditId === ''
                    ? 'border-[#00806a] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCreditId('')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">No credit</div>
                    <div className="text-sm text-gray-600">Pay full amount</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedCreditId === ''
                      ? 'border-[#00806a] bg-[#00806a]'
                      : 'border-gray-300'
                  }`}>
                    {selectedCreditId === '' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {credits.map((credit) => (
                <div
                  key={credit.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCreditId === credit.id
                      ? 'border-[#00806a] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCreditId(credit.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">£{credit.amount.toFixed(2)} Credit</div>
                      <div className="text-sm text-gray-600">
                        {credit.description} • Expires {new Date(credit.expiresAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedCreditId === credit.id
                        ? 'border-[#00806a] bg-[#00806a]'
                        : 'border-gray-300'
                    }`}>
                      {selectedCreditId === credit.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Payment Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Activity Price</span>
              <span>£{originalAmount.toFixed(2)}</span>
            </div>
            
            {promoDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo Discount</span>
                <span>-£{promoDiscount.toFixed(2)}</span>
              </div>
            )}
            
            {creditAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Credit Applied</span>
                <span>-£{creditAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total to Pay</span>
                <span className="text-[#00806a]">£{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <div className="pt-6">
          <Button
            onClick={handleProceedToPayment}
            disabled={finalAmount < 0}
            className="w-full bg-[#00806a] hover:bg-[#006d5a] text-white py-3 text-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <CreditCardIcon className="h-5 w-5 mr-2" />
            {finalAmount === 0 ? 'Complete Booking' : `Pay £${finalAmount.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

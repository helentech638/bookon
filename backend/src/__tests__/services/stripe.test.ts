import StripeService from '../../services/stripe';
import { RefundRequest } from '../../types';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    paymentMethods: {
      retrieve: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
      retrieve: jest.fn(),
      list: jest.fn(),
    },
    transfers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      list: jest.fn(),
    },
    balance: {
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('StripeService', () => {
  let stripeService: StripeService;
  let mockStripe: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.STRIPE_SECRET_KEY = 'test_secret_key';
    process.env.STRIPE_PLATFORM_FEE_PERCENTAGE = '2.9';
    process.env.STRIPE_PLATFORM_FEE_FIXED = '0.30';
    
    stripeService = new StripeService();
    mockStripe = require('stripe');
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PLATFORM_FEE_PERCENTAGE;
    delete process.env.STRIPE_PLATFORM_FEE_FIXED;
  });

  describe('constructor', () => {
    it('should throw error if STRIPE_SECRET_KEY is missing', () => {
      delete process.env.STRIPE_SECRET_KEY;
      expect(() => new StripeService()).toThrow('STRIPE_SECRET_KEY is required');
    });

    it('should initialize with default fee values', () => {
      const service = new StripeService();
      expect(service.getPlatformFeeConfig()).toEqual({
        percentage: 2.9,
        fixed: 0.30,
      });
    });

    it('should initialize with custom fee values', () => {
      process.env.STRIPE_PLATFORM_FEE_PERCENTAGE = '3.5';
      process.env.STRIPE_PLATFORM_FEE_FIXED = '0.50';
      
      const service = new StripeService();
      expect(service.getPlatformFeeConfig()).toEqual({
        percentage: 3.5,
        fixed: 0.50,
      });
    });
  });

  describe('createConnectAccount', () => {
    it('should create an Express Connect account successfully', async () => {
      const mockAccount = {
        id: 'acct_test123',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        country: 'GB',
        email: 'test@example.com',
        default_currency: 'gbp',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.accounts.create.mockResolvedValue(mockAccount);

      const result = await stripeService.createConnectAccount({
        email: 'test@example.com',
        country: 'GB',
        business_type: 'individual',
        individual: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@example.com',
        },
      });

      expect(result).toEqual({
        id: 'acct_test123',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        country: 'GB',
        email: 'test@example.com',
        default_currency: 'gbp',
      });

      expect(mockStripeInstance.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        country: 'GB',
        email: 'test@example.com',
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        individual: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@example.com',
        },
      });
    });

    it('should create a company Connect account successfully', async () => {
      const mockAccount = {
        id: 'acct_test456',
        business_type: 'company',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        country: 'US',
        email: 'company@example.com',
        default_currency: 'usd',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.accounts.create.mockResolvedValue(mockAccount);

      const result = await stripeService.createConnectAccount({
        email: 'company@example.com',
        country: 'US',
        business_type: 'company',
        company: {
          name: 'Test Company Ltd',
          phone: '+1234567890',
        },
      });

      expect(result.business_type).toBe('company');
      expect(mockStripeInstance.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company: {
            name: 'Test Company Ltd',
            phone: '+1234567890',
          },
        })
      );
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: 2500,
        currency: 'gbp',
        status: 'requires_payment_method',
        client_secret: 'pi_test123_secret_test',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent({
        amount: 25.00,
        currency: 'gbp',
        payment_method_types: ['card'],
        metadata: { bookingId: 'booking_123' },
      });

      expect(result).toEqual(mockPaymentIntent);
      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2500,
        currency: 'gbp',
        payment_method_types: ['card'],
        metadata: { bookingId: 'booking_123' },
      });
    });

    it('should create a payment intent with Connect account', async () => {
      const mockPaymentIntent = {
        id: 'pi_test456',
        amount: 2500,
        currency: 'gbp',
        status: 'requires_payment_method',
        client_secret: 'pi_test456_secret_test',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent({
        amount: 25.00,
        currency: 'gbp',
        payment_method_types: ['card'],
        application_fee_amount: 250,
        transfer_data: {
          destination: 'acct_test123',
        },
      });

      expect(result).toEqual(mockPaymentIntent);
      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2500,
        currency: 'gbp',
        payment_method_types: ['card'],
        application_fee_amount: 250,
        transfer_data: {
          destination: 'acct_test123',
        },
      });
    });
  });

  describe('createRefund', () => {
    it('should create a refund successfully', async () => {
      const mockRefund = {
        id: 're_test123',
        amount: 2500,
        currency: 'gbp',
        status: 'succeeded',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.refunds.create.mockResolvedValue(mockRefund);

      const refundRequest: RefundRequest = {
        paymentIntentId: 'pi_test123',
        amount: 25.00,
        reason: 'requested_by_customer',
      };

      const result = await stripeService.createRefund(refundRequest);

      expect(result).toEqual(mockRefund);
      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 2500,
        reason: 'requested_by_customer',
      });
    });

    it('should create a refund with Connect account', async () => {
      const mockRefund = {
        id: 're_test456',
        amount: 2500,
        currency: 'gbp',
        status: 'succeeded',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.refunds.create.mockResolvedValue(mockRefund);

      const refundRequest: RefundRequest = {
        paymentIntentId: 'pi_test123',
        amount: 25.00,
        reason: 'requested_by_customer',
        connectAccountId: 'acct_test123',
      };

      const result = await stripeService.createRefund(refundRequest);

      expect(result).toEqual(mockRefund);
      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 2500,
        reason: 'requested_by_customer',
      }, {
        stripeAccount: 'acct_test123',
      });
    });
  });

  describe('listRefunds', () => {
    it('should list refunds successfully', async () => {
      const mockRefunds = {
        data: [
          { id: 're_test123', amount: 2500, status: 'succeeded' },
          { id: 're_test456', amount: 1500, status: 'succeeded' },
        ],
        has_more: false,
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.refunds.list.mockResolvedValue(mockRefunds);

      const result = await stripeService.listRefunds('pi_test123', 10);

      expect(result).toEqual(mockRefunds);
      expect(mockStripeInstance.refunds.list).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        limit: 10,
      });
    });
  });

  describe('calculatePlatformFee', () => {
    it('should calculate platform fee correctly', () => {
      const fee = stripeService.calculatePlatformFee(100.00);
      // 100 * 0.029 + 0.30 = 3.20
      expect(fee).toBe(320); // in cents
    });

    it('should calculate platform fee for small amounts', () => {
      const fee = stripeService.calculatePlatformFee(10.00);
      // 10 * 0.029 + 0.30 = 0.59
      expect(fee).toBe(59); // in cents
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature successfully', () => {
      const mockEvent = { id: 'evt_test123', type: 'payment_intent.succeeded' };
      const mockStripeInstance = mockStripe();
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = stripeService.verifyWebhookSignature(
        'test_payload',
        'test_signature',
        'test_secret'
      );

      expect(result).toEqual(mockEvent);
      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
        'test_payload',
        'test_signature',
        'test_secret'
      );
    });

    it('should throw error on signature verification failure', () => {
      const mockStripeInstance = mockStripe();
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => {
        stripeService.verifyWebhookSignature(
          'test_payload',
          'test_signature',
          'test_secret'
        );
      }).toThrow('Invalid signature');
    });
  });

  describe('getConnectAccount', () => {
    it('should retrieve Connect account successfully', async () => {
      const mockAccount = {
        id: 'acct_test123',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        country: 'GB',
        email: 'test@example.com',
        default_currency: 'gbp',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await stripeService.getConnectAccount('acct_test123');

      expect(result).toEqual({
        id: 'acct_test123',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        country: 'GB',
        email: 'test@example.com',
        default_currency: 'gbp',
      });
    });
  });

  describe('updateConnectAccount', () => {
    it('should update Connect account successfully', async () => {
      const mockAccount = {
        id: 'acct_test123',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        country: 'GB',
        email: 'test@example.com',
        default_currency: 'gbp',
      };

      const mockStripeInstance = mockStripe();
      mockStripeInstance.accounts.update.mockResolvedValue(mockAccount);

      const result = await stripeService.updateConnectAccount('acct_test123', {
        business_profile: {
          url: 'https://example.com',
          mcc: '7399',
        },
      });

      expect(result).toEqual(mockAccount);
      expect(mockStripeInstance.accounts.update).toHaveBeenCalledWith(
        'acct_test123',
        {
          business_profile: {
            url: 'https://example.com',
            mcc: '7399',
          },
        }
      );
    });
  });
});

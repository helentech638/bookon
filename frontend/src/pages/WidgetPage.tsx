import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import EmbeddableWidget from '../components/booking/EmbeddableWidget';

const WidgetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // Extract configuration from URL parameters
  const config = {
    venueId: searchParams.get('venueId') || undefined,
    activityId: searchParams.get('activityId') || undefined,
    theme: (searchParams.get('theme') as 'light' | 'dark' | 'auto') || 'light',
    primaryColor: searchParams.get('primaryColor') || '#00806a',
    position: searchParams.get('position') || 'bottom-right',
    showLogo: searchParams.get('showLogo') !== 'false',
    customCSS: searchParams.get('customCSS') || '',
    isEmbedded: searchParams.get('embedded') === 'true'
  };

  // Check if config is passed as JSON
  const configParam = searchParams.get('config');
  if (configParam) {
    try {
      const parsedConfig = JSON.parse(decodeURIComponent(configParam));
      Object.assign(config, parsedConfig);
    } catch (error) {
      console.error('Failed to parse widget config:', error);
    }
  }

  // Notify parent window that widget is ready
  useEffect(() => {
    if (config.isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'WIDGET_READY',
        config
      }, '*');
    }
  }, [config.isEmbedded]);

  // Handle booking success
  const handleBookingSuccess = (data: any) => {
    if (config.isEmbedded && window.parent !== window) {
      // Send message to parent window
      window.parent.postMessage({
        type: 'BOOKING_SUCCESS',
        ...data
      }, '*');
    } else {
      // Show success message if not embedded
      toast.success('Booking successful!');
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    if (config.isEmbedded && window.parent !== window) {
      // Send error message to parent window
      window.parent.postMessage({
        type: 'BOOKING_ERROR',
        error
      }, '*');
    } else {
      // Show error message if not embedded
      toast.error(error);
    }
  };

  // Handle payment cancel
  const handlePaymentCancel = () => {
    if (config.isEmbedded && window.parent !== window) {
      // Send cancel message to parent window
      window.parent.postMessage({
        type: 'BOOKING_CANCELLED'
      }, '*');
    }
  };

  return (
    <div className={`min-h-screen ${config.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <EmbeddableWidget
          config={config}
          onClose={() => {
            if (config.isEmbedded && window.parent !== window) {
              window.parent.postMessage({
                type: 'WIDGET_CLOSED'
              }, '*');
            }
          }}
          isEmbedded={config.isEmbedded}
          onSuccess={handleBookingSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      </div>
    </div>
  );
};

export default WidgetPage;

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ComputerDesktopIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CurrencyPoundIcon,
  BellIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { authService } from '../../services/authService';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: ComputerDesktopIcon, path: '/admin' },
    { id: 'activities', name: 'Activities', icon: CalendarDaysIcon, path: '/admin/activities' },
    { id: 'venues', name: 'Venues', icon: MapPinIcon, path: '/admin/venues' },
    { id: 'bookings', name: 'Bookings', icon: ClipboardDocumentListIcon, path: '/admin/bookings' },
    { id: 'registers', name: 'Registers', icon: DocumentTextIcon, path: '/admin/registers' },
    { id: 'payments', name: 'Payments', icon: CurrencyPoundIcon, path: '/admin/payments' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, path: '/admin/notifications' },
    { id: 'webhooks', name: 'Webhooks', icon: MegaphoneIcon, path: '/admin/webhooks' },
    { id: 'widget', name: 'Widget Management', icon: ComputerDesktopIcon, path: '/admin/widget' },
    { id: 'communications', name: 'Communications', icon: ChatBubbleLeftRightIcon, path: '/admin/communications' },
    { id: 'settings', name: 'Settings', icon: CogIcon, path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Side Panel */}
      <div className="w-64 bg-gray-800 text-white">
        {/* Logo and Logout */}
        <div className="p-4 border-b border-gray-700">
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white min-h-full">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

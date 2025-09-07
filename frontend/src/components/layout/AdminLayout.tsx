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
  CogIcon,
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon
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
    { id: 'tfc-queue', name: 'TFC Queue', icon: ClockIcon, path: '/admin/tfc-queue' },
    { id: 'provider-settings', name: 'Provider Settings', icon: BuildingOfficeIcon, path: '/admin/provider-settings' },
    { id: 'wallet-management', name: 'Wallet Management', icon: CreditCardIcon, path: '/admin/wallet-management' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, path: '/admin/notifications' },
    { id: 'webhooks', name: 'Webhooks', icon: MegaphoneIcon, path: '/admin/webhooks' },
    { id: 'widget', name: 'Widget Management', icon: ComputerDesktopIcon, path: '/admin/widget' },
    { id: 'communications', name: 'Communications', icon: ChatBubbleLeftRightIcon, path: '/admin/communications' },
    { id: 'audit-logs', name: 'Audit Logs', icon: ShieldCheckIcon, path: '/admin/audit-logs' },
    { id: 'data-retention', name: 'Data Retention', icon: ExclamationTriangleIcon, path: '/admin/data-retention' },
    { id: 'settings', name: 'System Settings', icon: CogIcon, path: '/admin/settings' },
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
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        {/* Logo and Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">BookOn Admin</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
          >
            Logout
          </Button>
        </div>
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

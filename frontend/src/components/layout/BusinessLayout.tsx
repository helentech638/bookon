import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  CalendarDaysIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon,
  CurrencyPoundIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  CogIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import Footer from './Footer';

interface BusinessLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/business/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/business/dashboard'
    },
    {
      name: 'Activities',
      href: '/business/activities',
      icon: CalendarDaysIcon,
      current: location.pathname.startsWith('/business/activities')
    },
    {
      name: 'Templates',
      href: '/business/templates',
      icon: DocumentDuplicateIcon,
      current: location.pathname.startsWith('/business/templates')
    },
    {
      name: 'Venues',
      href: '/business/venues',
      icon: BuildingOfficeIcon,
      current: location.pathname.startsWith('/business/venues')
    },
    {
      name: 'Finance',
      href: '/business/finance',
      icon: CurrencyPoundIcon,
      current: location.pathname.startsWith('/business/finance'),
      children: [
        { name: 'Transactions', href: '/business/finance/transactions', icon: CreditCardIcon },
        { name: 'Discounts', href: '/business/finance/discounts', icon: BanknotesIcon },
        { name: 'Credits', href: '/business/finance/credits', icon: ArrowTrendingUpIcon },
        { name: 'Refunds', href: '/business/finance/refunds', icon: CreditCardIcon },
        { name: 'Reports', href: '/business/finance/reports', icon: ChartBarIcon }
      ]
    },
    {
      name: 'Communications',
      href: '/business/communications',
      icon: ChatBubbleLeftRightIcon,
      current: location.pathname.startsWith('/business/communications'),
      children: [
        { name: 'Automated Emails', href: '/business/communications/automated', icon: EnvelopeIcon },
        { name: 'Broadcasts', href: '/business/communications/broadcasts', icon: MegaphoneIcon },
        { name: 'Email Log', href: '/business/communications/logs', icon: DocumentTextIcon }
      ]
    },
    {
      name: 'Registers',
      href: '/business/registers',
      icon: ClipboardDocumentListIcon,
      current: location.pathname.startsWith('/business/registers')
    },
    {
      name: 'Users',
      href: '/business/users',
      icon: UsersIcon,
      current: location.pathname.startsWith('/business/users')
    },
    {
      name: 'Settings',
      href: '/business/settings',
      icon: CogIcon,
      current: location.pathname.startsWith('/business/settings')
    }
  ];

  const isCurrentPath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-[#00806a]">BookOn Business</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isCurrentPath(item.href)
                      ? 'bg-[#00806a] text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
                {item.children && isCurrentPath(item.href) && (
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          location.pathname === child.href
                            ? 'bg-[#00806a] text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-[#00806a]">BookOn Business</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isCurrentPath(item.href)
                      ? 'bg-[#00806a] text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
                {item.children && isCurrentPath(item.href) && (
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          location.pathname === child.href
                            ? 'bg-[#00806a] text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-600"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h2 className="ml-4 text-lg font-semibold text-gray-900 lg:ml-0">
                {navigation.find(item => isCurrentPath(item.href))?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <Button
                onClick={() => navigate('/business/activities/new')}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Activity
              </Button>
              
              {/* Notifications */}
              <div className="relative">
                <button className="text-gray-500 hover:text-gray-600">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
              
              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">{user?.businessName}</p>
                </div>
                <div className="h-8 w-8 bg-[#00806a] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default BusinessLayout;

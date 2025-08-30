import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  CalendarIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'parent' | 'staff' | 'admin';
  } | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Base navigation for all users
  const baseNavigation = [
    { name: 'Activities', href: '/activities', current: false },
    { name: 'Venues', href: '/venues', current: false },
  ];

  // Parent-specific navigation
  const parentNavigation = [
    { name: 'Book Activity', href: '/bookings/flow', current: false, icon: CalendarIcon },
    { name: 'My Bookings', href: '/bookings', current: false, icon: CalendarIcon },
    { name: 'My Children', href: '/children', current: false, icon: UserGroupIcon },
  ];

  // Staff/Admin navigation
  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', current: false, icon: Cog6ToothIcon },
    { name: 'Bookings', href: '/bookings', current: false, icon: CalendarIcon },
    { name: 'Registers', href: '/admin/registers', current: false, icon: ClipboardDocumentListIcon },
    { name: 'Financial', href: '/admin/financial', current: false, icon: CreditCardIcon },
    { name: 'Payment Settings', href: '/admin/payment-settings', current: false, icon: CreditCardIcon },
    { name: 'Export Center', href: '/admin/export', current: false, icon: DocumentArrowDownIcon },
    { name: 'Widget', href: '/admin/widget', current: false, icon: AcademicCapIcon },
  ];

  // Combine navigation based on user role
  const getNavigation = () => {
    if (!user) return baseNavigation;
    
    if (user.role === 'parent') {
      return [...baseNavigation, ...parentNavigation];
    }
    
    if (user.role === 'staff' || user.role === 'admin') {
      return [...baseNavigation, ...adminNavigation];
    }
    
    return baseNavigation;
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-[#041c30] to-[#00806a] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">BookOn</span>
              </div>
            </Link>
            
            {/* Desktop navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center"
                >
                  {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side - User menu and mobile button */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {user && (
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
            )}

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </span>
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserCircleIcon className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    
                    {/* Parent-specific menu items */}
                    {user.role === 'parent' && (
                      <>
                        <Link
                          to="/children"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          Manage Children
                        </Link>
                        <Link
                          to="/bookings/flow"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Book New Activity
                        </Link>
                      </>
                    )}
                    
                    {/* Admin/Staff menu items */}
                    {(user.role === 'staff' || user.role === 'admin') && (
                      <>
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Cog6ToothIcon className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/registers"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                          Registers
                        </Link>
                                                 <Link
                           to="/admin/financial"
                           className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                           onClick={() => setIsUserMenuOpen(false)}
                         >
                           <CreditCardIcon className="h-4 w-4 mr-2" />
                           Financial
                         </Link>
                         <Link
                           to="/admin/payment-settings"
                           className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                           onClick={() => setIsUserMenuOpen(false)}
                         >
                           <CreditCardIcon className="h-4 w-4 mr-2" />
                           Payment Settings
                         </Link>
                         <Link
                           to="/admin/widget"
                           className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                           onClick={() => setIsUserMenuOpen(false)}
                         >
                           <AcademicCapIcon className="h-4 w-4 mr-2" />
                           Widget Management
                         </Link>
                      </>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-[#00806a] hover:bg-[#006d5a] text-white px-4 py-2 text-sm font-medium rounded-md transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium rounded-md hover:bg-gray-100 flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon && <item.icon className="h-5 w-5 mr-3" />}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

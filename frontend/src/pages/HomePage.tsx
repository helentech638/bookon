import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  CalendarDaysIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Illustration */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Calendar Icon */}
        <div className="absolute top-20 right-20 text-green-100 opacity-20">
          <CalendarDaysIcon className="w-32 h-32" />
        </div>
        {/* Checkmark Icon */}
        <div className="absolute bottom-20 left-20 text-green-100 opacity-20">
          <CheckCircleIcon className="w-24 h-24" />
        </div>
        {/* Floating dots */}
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-green-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-green-300 rounded-full opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-green-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Trusted by 100+ schools & clubs
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Simple. Seamless.
              <span className="text-[#00806a]"> Bookings.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your school clubs and activities with our intuitive booking platform. 
              Manage schedules, track attendance, and simplify administration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/register"
                className="bg-[#00806a] hover:bg-[#006d5a] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link
                to="/demo"
                className="border-2 border-[#00806a] text-[#00806a] hover:bg-[#00806a] hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Watch Demo
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-1" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-1" />
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-1" />
                <span>UK Based</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to manage activities
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From booking management to attendance tracking, we've got you covered
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <CalendarDaysIcon className="w-8 h-8 text-[#00806a]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Easy Booking Management</h3>
                <p className="text-gray-600 mb-4">
                  Create and manage activities with simple drag-and-drop scheduling. 
                  Parents can book with just a few clicks.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Intuitive calendar interface
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Automated confirmations
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Real-time availability
                  </li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <UsersIcon className="w-8 h-8 text-[#00806a]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Parent & Staff Portal</h3>
                <p className="text-gray-600 mb-4">
                  Dedicated portals for parents to book activities and staff to manage schedules. 
                  Everyone stays informed and organized.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Parent-friendly interface
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Staff management tools
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Communication hub
                  </li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <ChartBarIcon className="w-8 h-8 text-[#00806a]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics & Reporting</h3>
                <p className="text-gray-600 mb-4">
                  Get insights into attendance patterns, popular activities, and revenue tracking. 
                  Make data-driven decisions for your programs.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Attendance tracking
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Revenue analytics
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Custom reports
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How BookOn Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get started in minutes with our simple 3-step process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-[#00806a] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Set Up Your Venue</h3>
                <p className="text-gray-600">
                  Create your venue profile, add activities, and set your schedule. 
                  Our setup wizard guides you through every step.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-[#00806a] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Invite Parents</h3>
                <p className="text-gray-600">
                  Send invitations to parents who can then create accounts and start 
                  booking activities for their children.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-[#00806a] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Manage & Grow</h3>
                <p className="text-gray-600">
                  Track attendance, manage bookings, and use analytics to optimize 
                  your programs and grow your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#00806a] to-[#006d5a] text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to streamline your activities?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Join hundreds of schools and clubs already using BookOn to manage their activities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-[#00806a] hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white hover:bg-white hover:text-[#00806a] px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;

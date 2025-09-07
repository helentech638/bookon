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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Simplified Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Static gradient orbs - no animation */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-[#00806a]/5 to-[#041c30]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-[#041c30]/3 to-[#00806a]/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 backdrop-blur-sm border border-[#00806a]/20 text-[#00806a] rounded-full text-sm font-semibold mb-8 shadow-lg">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Trusted by 100+ schools & clubs worldwide
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              Simple. Seamless.
              <span className="bg-gradient-to-r from-[#00806a] to-[#041c30] bg-clip-text text-transparent"> Bookings.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Transform your school clubs and activities with our cutting-edge booking platform. 
              <span className="text-gray-800 font-medium"> Manage schedules effortlessly, track attendance intelligently, and simplify administration completely.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/register"
                className="bg-gradient-to-r from-[#00806a] to-[#041c30] hover:from-[#006b5a] hover:to-[#052a42] text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link
                to="/demo"
                className="border-2 border-[#00806a] text-[#00806a] hover:bg-[#00806a] hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors duration-200"
              >
                Watch Demo
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-[#00806a] mr-2" />
                <span className="font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-[#00806a] mr-2" />
                <span className="font-medium">SSL Secure</span>
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-[#00806a] mr-2" />
                <span className="font-medium">UK Based</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-gradient-to-b from-white/80 to-slate-50/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-full text-sm font-semibold text-[#00806a] mb-6">
                <AcademicCapIcon className="w-4 h-4 mr-2" />
                Powerful Features
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Everything you need to 
                <span className="bg-gradient-to-r from-[#00806a] to-[#041c30] bg-clip-text text-transparent"> manage activities</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                From intelligent booking management to comprehensive attendance tracking, 
                <span className="text-gray-800 font-medium"> we've got every aspect covered</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-xl flex items-center justify-center mb-6">
                  <CalendarDaysIcon className="w-8 h-8 text-[#00806a]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Smart Booking Management</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create and manage activities with intelligent drag-and-drop scheduling. 
                  <span className="text-gray-800 font-medium">Parents can book with just a few clicks.</span>
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Intuitive calendar interface
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Automated confirmations
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Real-time availability
                  </li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-xl flex items-center justify-center mb-6">
                  <UsersIcon className="w-8 h-8 text-[#00806a]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Dual Portal System</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Dedicated portals for parents to book activities and staff to manage schedules. 
                  <span className="text-gray-800 font-medium">Everyone stays informed and organized.</span>
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Parent-friendly interface
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Staff management tools
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Communication hub
                  </li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-xl flex items-center justify-center mb-6">
                  <ChartBarIcon className="w-8 h-8 text-[#00806a]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced Analytics</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Get insights into attendance patterns, popular activities, and revenue tracking. 
                  <span className="text-gray-800 font-medium">Make data-driven decisions for your programs.</span>
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Attendance tracking
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    Revenue analytics
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
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
        <section className="py-20 bg-gradient-to-r from-[#00806a] to-[#041c30] text-white">
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

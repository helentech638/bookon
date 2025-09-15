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
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 backdrop-blur-sm border border-[#00806a]/20 text-[#00806a] rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 shadow-lg">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Trusted by 100+ schools & clubs worldwide</span>
                <span className="sm:hidden">Trusted by 100+ schools</span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight">
              Simple. Seamless.
              <span className="bg-gradient-to-r from-[#00806a] to-[#041c30] bg-clip-text text-transparent"> Bookings.</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed font-light px-2">
              Transform your school clubs and activities with our cutting-edge booking platform. 
              <span className="text-gray-800 font-medium"> Manage schedules effortlessly, track attendance intelligently, and simplify administration completely.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10 md:mb-12 px-4">
              <Link
                to="/register"
                className="bg-gradient-to-r from-[#00806a] to-[#041c30] hover:from-[#006b5a] hover:to-[#052a42] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl text-center"
              >
                Start Free Trial
              </Link>
              <Link
                to="/demo"
                className="border-2 border-[#00806a] text-[#00806a] hover:bg-[#00806a] hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold transition-colors duration-200 text-center"
              >
                Watch Demo
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-gray-600 px-4">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-[#00806a] mr-2 flex-shrink-0" />
                <span className="font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-[#00806a] mr-2 flex-shrink-0" />
                <span className="font-medium">SSL Secure</span>
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="w-4 h-4 text-[#00806a] mr-2 flex-shrink-0" />
                <span className="font-medium">UK Based</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white/80 to-slate-50/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-full text-xs sm:text-sm font-semibold text-[#00806a] mb-4 sm:mb-6">
                <AcademicCapIcon className="w-4 h-4 mr-2" />
                Powerful Features
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
                Everything you need to 
                <span className="bg-gradient-to-r from-[#00806a] to-[#041c30] bg-clip-text text-transparent"> manage activities</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                From intelligent booking management to comprehensive attendance tracking, 
                <span className="text-gray-800 font-medium"> we've got every aspect covered</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="group bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-200">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <CalendarDaysIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#00806a]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Smart Booking Management</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
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
              <div className="group bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-200">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#00806a]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dual Portal System</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
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
              <div className="group bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-200">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#00806a]/10 to-[#041c30]/10 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#00806a]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Advanced Analytics</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
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
        <section className="py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 px-2">
                How BookOn Works
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Get started in minutes with our simple 3-step process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#00806a] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-xl sm:text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Set Up Your Venue</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Create your venue profile, add activities, and set your schedule. 
                  Our setup wizard guides you through every step.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#00806a] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-xl sm:text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Invite Parents</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Send invitations to parents who can then create accounts and start 
                  booking activities for their children.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#00806a] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-xl sm:text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Manage & Grow</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Track attendance, manage bookings, and use analytics to optimize 
                  your programs and grow your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-[#00806a] to-[#041c30] text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">
              Ready to streamline your activities?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8 px-4">
              Join hundreds of schools and clubs already using BookOn to manage their activities
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link
                to="/register"
                className="bg-white text-[#00806a] hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors shadow-lg text-center"
              >
                Start Free Trial
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white hover:bg-white hover:text-[#00806a] px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors text-center"
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

import Link from "next/link";
import { ArrowRight, MapPin, Navigation, Shield, BarChart3, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Navigation className="w-8 h-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">Vazhikatti</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-indigo-600 transition">Features</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition">How It Works</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-indigo-600 transition">Pricing</Link>
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 transition">Sign In</Link>
              <Link href="/pricing" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-4">
            <Shield className="w-4 h-4 mr-2" /> Enterprise-Grade Navigation Solution
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Validate and Improve <span className="block text-indigo-600">Indoor Navigation</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Transform static floor plans into intelligent navigation systems. Vazhikatti validates maps, analyzes navigation patterns, and delivers actionable insights for healthcare facilities, campuses, and complex buildings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-lg font-medium">
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/upload" className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-lg font-medium">
              Upload Your Maps
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
          <div><div className="text-3xl font-bold mb-2">500+</div>Facilities Optimized</div>
          <div><div className="text-3xl font-bold mb-2">2M+</div>Navigation Points Mapped</div>
          <div><div className="text-3xl font-bold mb-2">99.9%</div>Accuracy Rate</div>
          <div><div className="text-3xl font-bold mb-2">24/7</div>System Uptime</div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Navigation Analytics</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From map validation to real-time navigation, we provide the complete toolkit for indoor wayfinding excellence.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Map Validation</h3>
            <p className="text-gray-600">Automatically validate floor plans for navigation accuracy, identify bottlenecks, and optimize routing paths.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
            <p className="text-gray-600">Gain insights into visitor patterns, dwell times, and navigation efficiency with comprehensive dashboards.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">User-Centric Design</h3>
            <p className="text-gray-600">Intuitive interfaces for both administrators and end-users, ensuring seamless adoption and engagement.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How Vazhikatti Works</h2>
          <p className="text-xl text-gray-600">Transform your facility in four simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {["Upload Maps", "Edit & Validate", "Deploy Navigation", "Analyze & Optimize"].map((step, idx) => (
            <div key={idx}>
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">{idx + 1}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{step}</h3>
              <p className="text-gray-600">{[
                "Import your floor plans and building layouts",
                "Define navigation points and optimize routes",
                "Launch live navigation for your visitors",
                "Monitor performance and continuously improve"
              ][idx]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-indigo-600 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Indoor Navigation?</h2>
          <p className="text-xl text-indigo-200 mb-8">Join hundreds of facilities using Vazhikatti to deliver exceptional wayfinding experiences.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition text-lg font-medium">Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" /></Link>
            <Link href="/upload" className="inline-flex items-center px-8 py-4 border border-white text-white rounded-lg hover:bg-indigo-700 transition text-lg font-medium">Schedule Demo</Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Navigation className="w-8 h-8 text-indigo-400" />
              <span className="text-xl font-bold text-white">Vazhikatti</span>
            </div>
            <p className="text-gray-400">Enterprise-grade indoor navigation and analytics platform.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
              <li><Link href="/upload" className="hover:text-white transition">Upload</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition">About</Link></li>
              <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition">Documentation</Link></li>
              <li><Link href="#" className="hover:text-white transition">API Reference</Link></li>
              <li><Link href="#" className="hover:text-white transition">Status</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          &copy; {new Date().getFullYear()} Vazhikatti. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

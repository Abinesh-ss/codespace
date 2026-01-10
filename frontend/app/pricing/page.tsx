import Link from "next/link";
import { CheckCircle2, Star, ArrowRight, Zap, Shield, Headphones, Users } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small facilities testing indoor navigation",
      price: "$99",
      period: "per month",
      icon: <Zap className="w-6 h-6" />,
      features: [
        "Up to 5 floor plans",
        "Basic navigation analytics",
        "Mobile app access",
        "Email support",
        "1 user account",
        "Standard API access"
      ],
      cta: "Start Free Trial",
      popular: false,
      trial: "14-day free trial"
    },
    {
      name: "Professional",
      description: "Ideal for hospitals and large facilities",
      price: "$299",
      period: "per month",
      icon: <Shield className="w-6 h-6" />,
      features: [
        "Up to 50 floor plans",
        "Advanced analytics dashboard",
        "Real-time navigation",
        "Priority email & phone support",
        "10 user accounts",
        "Advanced API with webhooks",
        "Custom branding options",
        "Monthly performance reports"
      ],
      cta: "Start Free Trial",
      popular: true,
      trial: "30-day free trial"
    },
    {
      name: "Enterprise",
      description: "Complete solution for healthcare systems and campuses",
      price: "Custom",
      period: "contact for pricing",
      icon: <Users className="w-6 h-6" />,
      features: [
        "Unlimited floor plans",
        "Enterprise analytics suite",
        "AI-powered route optimization",
        "Dedicated account manager",
        "Unlimited user accounts",
        "Full API & SDK access",
        "White-label solutions",
        "On-premise deployment option",
        "Custom integrations",
        "SLA guarantees"
      ],
      cta: "Contact Sales",
      popular: false,
      trial: "Custom pilot program"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">HN</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HospiNav Pro</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-indigo-600 transition">Home</Link>
              <Link href="/pricing" className="text-indigo-600 font-medium">Pricing</Link>
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 transition">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-6">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            No credit card required for trial
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your facility. Start with a free trial and upgrade as you grow.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
              14-day free trials
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
              No setup fees
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-indigo-600 transform md:scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      {plan.icon}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    {plan.trial && (
                      <p className="text-sm text-green-600 font-medium mt-2">{plan.trial}</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.name === "Enterprise" ? "/login" : "/login"}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition flex items-center justify-center ${
                      plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How does the free trial work?</h3>
              <p className="text-gray-600">
                Start with full access to all features in your chosen plan. No credit card required. 
                After your trial ends, you can upgrade to continue using HospiNav Pro.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I change plans anytime?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing adjustments.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and ACH transfers for enterprise accounts. 
                Annual billing comes with a 20% discount.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Is my data secure?</h3>
              <p className="text-gray-600">
                Absolutely. We use industry-standard encryption, comply with HIPAA regulations, 
                and conduct regular security audits. Your data is always protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-indigo-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Facility Navigation?
          </h2>
          <p className="text-xl text-indigo-200 mb-8">
            Join hundreds of healthcare facilities using HospiNav Pro to deliver exceptional wayfinding experiences.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition text-lg font-medium"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">HN</span>
            </div>
            <span className="text-xl font-bold text-white">HospiNav Pro</span>
          </div>
          <p className="text-gray-400">
            © {new Date().getFullYear()} HospiNav Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

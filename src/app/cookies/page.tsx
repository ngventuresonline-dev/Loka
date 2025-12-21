'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CookiesPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookies Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies are necessary for the website to function properly. They enable core 
                functionality such as security, network management, and accessibility.
              </p>
              <p className="text-sm text-gray-600">Cannot be disabled in our systems.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Functional Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies allow the website to remember choices you make (such as your username, 
                language, or region) and provide enhanced, personalized features.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies help us understand how visitors interact with our website by collecting 
                and reporting information anonymously. This helps us improve our services and user experience.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Marketing Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies are used to track visitors across websites to display relevant 
                advertisements. They may be set by our advertising partners.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              In addition to our own cookies, we may also use various third-party cookies to report 
              usage statistics, deliver advertisements, and provide enhanced functionality. These 
              third-party services may include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Analytics providers (e.g., Google Analytics)</li>
              <li>Advertising networks</li>
              <li>Social media platforms</li>
              <li>Content delivery networks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Management</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies. 
              You can also delete cookies that have already been set. Check your browser's help section 
              for instructions.</li>
              <li><strong>Opt-Out Tools:</strong> You can use opt-out tools provided by third-party 
              analytics and advertising services.</li>
              <li><strong>Our Cookie Preferences:</strong> You can manage your cookie preferences through 
              our website settings (when available).</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-4">
              <p className="text-gray-800">
                <strong>Note:</strong> Disabling certain cookies may impact the functionality of our 
                website and your user experience.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Opt-Out Options</h2>
            <p className="text-gray-700 mb-4">
              To opt-out of specific cookie types:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Analytics cookies: Use browser settings or opt-out tools provided by analytics providers</li>
              <li>Marketing cookies: Use the Digital Advertising Alliance's opt-out page or similar tools</li>
              <li>Functional cookies: Adjust your browser settings, though this may affect website functionality</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> support@lokazen.in</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong> Kokarya Business Synergy Centre, Jayanagar, Bengaluru 560041</p>
              <p className="text-gray-700"><strong>Company:</strong> Unit of N & G Ventures</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link href="/" className="text-[#FF5200] hover:text-[#E4002B] transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-24 sm:pt-28 lg:pt-32 pb-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Collection Practices</h2>
            <p className="text-gray-700 mb-4">
              Lokazen collects information necessary to provide our commercial real estate matchmaking services. 
              This includes information you provide when creating an account, searching for properties, listing properties, 
              making payments, or using our services.
            </p>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information We Collect</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, company name, business registration details, tax identification numbers</li>
                <li><strong>Property Information:</strong> Property details, location, size, amenities, rental rates, availability, property documents</li>
                <li><strong>Brand Requirements:</strong> Space requirements, location preferences, budget, business type, operational needs</li>
                <li><strong>Financial Information:</strong> Payment card details (processed securely through third-party processors), billing addresses, transaction history, invoice records</li>
                <li><strong>Usage Data:</strong> Platform activity, search history, property views, interactions with other users, communication logs</li>
                <li><strong>Technical Information:</strong> IP address, device information, browser type, operating system, cookies and tracking technologies</li>
                <li><strong>Communication Data:</strong> Messages exchanged through our platform, feedback, support requests</li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Information from Third Parties</h3>
              <p className="text-gray-700 mb-4">
                We may receive information about you from third-party sources, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Payment processors and financial institutions</li>
                <li>Credit bureaus and verification services</li>
                <li>Social media platforms (if you connect your account)</li>
                <li>Public records and government databases</li>
                <li>Business partners and referral sources</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How Data is Used and Shared</h2>
            <p className="text-gray-700 mb-4">
              Your information is used to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Match brands with suitable commercial properties</li>
              <li>Provide location intelligence and market insights</li>
              <li>Facilitate communications between parties</li>
              <li>Improve our services and platform functionality</li>
              <li>Send relevant updates and notifications</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information to third parties. Information may be shared with 
              potential matches (brands or property owners) as part of our matchmaking services, with your consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Rights and Data Security</h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect your personal information from unauthorized 
              access, alteration, disclosure, or destruction. However, no method of transmission over the internet 
              is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
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


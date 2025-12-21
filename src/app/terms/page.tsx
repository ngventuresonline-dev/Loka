'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Services Provided</h2>
            <p className="text-gray-700 mb-4">
              Lokazen provides a commercial real estate matchmaking platform that facilitates connections 
              between brands seeking commercial spaces and property owners. Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>AI-powered property matching based on brand requirements</li>
              <li>Location intelligence and market insights</li>
              <li>Facilitation of initial connections between parties</li>
              <li>Platform access for property listings and brand profiles</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              Users are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Providing accurate and truthful information</li>
              <li>Conducting their own due diligence on properties and brands</li>
              <li>Verifying all property details, legal documents, and compliance requirements</li>
              <li>Ensuring compliance with all applicable laws and regulations</li>
              <li>Handling all negotiations, agreements, and transactions independently</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimers</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-4">
              <p className="text-gray-800 font-semibold mb-2">Important Disclaimers:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Lokazen is not liable for disputes between owners and brands.</strong> We facilitate connections only and are not a party to any rental agreements or transactions.</li>
                <li><strong>Our role is limited to providing location intelligence and facilitating connections.</strong> We do not participate in negotiations, verify property conditions, or guarantee the accuracy of listings.</li>
                <li><strong>We are not responsible for actual rental agreements, transactions, or property condition.</strong> All agreements are between the brand and property owner directly.</li>
                <li><strong>Users are solely responsible for due diligence, verification, and legal matters.</strong> We recommend consulting with legal and real estate professionals before entering into any agreements.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, Lokazen and N & G Ventures shall not be liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Any disputes, losses, or damages arising from transactions between users</li>
              <li>Inaccuracies in property listings or brand information</li>
              <li>Property condition, legal status, or compliance issues</li>
              <li>Failure of matches to result in successful transactions</li>
              <li>Any indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms & Conditions are governed by the laws of India. Any disputes arising from 
              these terms or the use of our services shall be subject to the exclusive jurisdiction 
              of the courts in Bengaluru, Karnataka, India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
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


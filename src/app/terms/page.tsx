'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-24 sm:pt-28 lg:pt-32 pb-16">
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Terms and Fee Structure</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
              <p className="text-gray-800 font-semibold mb-3">Our Service Fees:</p>
              <p className="text-gray-700 mb-4">
                Lokazen charges fees for various services provided on our platform. All fees are non-refundable unless otherwise specified in these terms or as required by applicable law.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Brand Onboarding Fee</h3>
              <p className="text-gray-700 mb-3">
                Brands seeking commercial spaces are required to pay a one-time onboarding fee to access our platform and services. This fee covers:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-3">
                <li>Platform access and account setup</li>
                <li>Initial property matching and recommendations</li>
                <li>Access to location intelligence tools</li>
                <li>Customer support and onboarding assistance</li>
              </ul>
              <p className="text-gray-700 mb-2">
                <strong>Payment Terms:</strong> The brand onboarding fee must be paid in full before account activation. Payment is due immediately upon completion of the onboarding process.
              </p>
              <p className="text-gray-700">
                <strong>Refund Policy:</strong> No refunds will be provided for any onboarding charges.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Marketing Charges</h3>
              <p className="text-gray-700 mb-3">
                Additional marketing and promotional services may be available to enhance your visibility on the platform. Marketing charges apply to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-3">
                <li>Featured listings and premium placement</li>
                <li>Enhanced profile visibility and promotion</li>
                <li>Targeted marketing campaigns</li>
                <li>Priority matching and recommendations</li>
                <li>Social media and digital marketing services</li>
              </ul>
              <p className="text-gray-700 mb-2">
                <strong>Payment Terms:</strong> Marketing charges are billed separately and may be charged on a one-time, monthly, or campaign basis as agreed upon. Payment is due as per the billing cycle or campaign terms.
              </p>
              <p className="text-gray-700">
                <strong>Refund Policy:</strong> No refunds will be provided for any onboarding charges.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Success Fee Upon Closure</h3>
              <p className="text-gray-700 mb-3">
                Upon successful closure of a commercial real estate transaction facilitated through our platform, Lokazen charges a success fee. This fee is applicable when:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-3">
                <li>A brand and property owner enter into a legally binding rental or lease agreement</li>
                <li>The transaction was initiated or facilitated through our platform</li>
                <li>The agreement is executed within 12 months of the initial match or introduction</li>
                <li>Both parties acknowledge Lokazen's role in facilitating the connection</li>
              </ul>
              <p className="text-gray-700 mb-2">
                <strong>Fee Calculation:</strong> The success fee is calculated as a percentage of the total annual rental value or as a fixed amount, as specified in the service agreement. The exact fee structure will be communicated at the time of match or as per the signed service agreement.
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Payment Terms:</strong> The success fee is due and payable within 15 days of the execution of the rental/lease agreement. Payment must be made by the party responsible as per the service agreement (typically the brand or as mutually agreed).
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Obligation to Report:</strong> Both parties (brand and property owner) are obligated to inform Lokazen of any successful closure within 7 days of agreement execution. Failure to report may result in additional charges and legal action.
              </p>
              <p className="text-gray-700">
                <strong>Non-Payment Consequences:</strong> Failure to pay the success fee within the specified timeframe will result in late payment charges, suspension of platform access, and may lead to legal proceedings to recover the amount due along with associated costs.
              </p>
            </div>

            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">General Payment Terms</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-3">
                <li><strong>Payment Methods:</strong> We accept payments through credit/debit cards, net banking, UPI, and other approved payment gateways. All payments are processed securely through third-party payment processors.</li>
                <li><strong>Currency:</strong> All fees are quoted and payable in Indian Rupees (INR) unless otherwise specified.</li>
                <li><strong>Taxes:</strong> All fees are exclusive of applicable taxes (GST, service tax, etc.). Users are responsible for paying all applicable taxes as per Indian tax laws.</li>
                <li><strong>Late Payments:</strong> Late payment charges of 2% per month (24% per annum) may be applied to overdue amounts. We reserve the right to suspend or terminate services for non-payment.</li>
                <li><strong>Disputes:</strong> Any disputes regarding fees must be raised within 7 days of invoice date. After this period, invoices are considered accepted and payable.</li>
                <li><strong>Chargebacks:</strong> Unauthorized chargebacks or payment reversals may result in immediate account suspension and additional administrative charges.</li>
              </ul>
            </div>
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
              <li>Timely payment of all applicable fees and charges</li>
              <li>Reporting successful closures to Lokazen as required</li>
              <li>Maintaining the confidentiality of any proprietary information shared during the matching process</li>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property and Confidentiality</h2>
            <p className="text-gray-700 mb-4">
              All content, technology, algorithms, and proprietary information on the Lokazen platform are the exclusive property of Lokazen and N & G Ventures. Users agree that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>They will not copy, reproduce, or distribute any proprietary information without written consent</li>
              <li>They will not reverse engineer, decompile, or attempt to extract our matching algorithms or business logic</li>
              <li>They will maintain confidentiality of any proprietary information shared during the service period</li>
              <li>Any unauthorized use of our intellectual property will result in immediate termination and legal action</li>
              <li>Users grant Lokazen a non-exclusive license to use their brand/property information for matching and marketing purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination and Account Suspension</h2>
            <p className="text-gray-700 mb-4">
              Lokazen reserves the right to suspend or terminate user accounts at any time for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Non-payment of fees or charges</li>
              <li>Violation of these terms and conditions</li>
              <li>Fraudulent, illegal, or unethical activities</li>
              <li>Misrepresentation of information</li>
              <li>Attempts to circumvent our fee structure or payment obligations</li>
              <li>Any activity that may harm our business, reputation, or other users</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Upon termination, all outstanding fees remain due and payable. Users will lose access to all platform services, but their obligations under these terms, including payment obligations, will continue.
            </p>
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
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions, technical failures, or platform downtime</li>
              <li>Third-party actions or content</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Our total liability, if any, shall not exceed the total amount of fees paid by the user in the 12 months preceding the claim. This limitation applies regardless of the legal theory (contract, tort, negligence, etc.) under which the claim is brought.
            </p>
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mt-4">
              <p className="text-gray-800 font-semibold mb-2">Important:</p>
              <p className="text-gray-700">
                Lokazen is a matchmaking platform only. We do not guarantee successful matches, transactions, or outcomes. 
                We are not a party to any rental agreements, and all transactions are solely between brands and property owners. 
                Users acknowledge that they use our services at their own risk.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 mb-4">
              Users agree to indemnify, defend, and hold harmless Lokazen, N & G Ventures, their officers, directors, employees, 
              and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including 
              reasonable attorney fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>User's violation of these terms and conditions</li>
              <li>User's use or misuse of the platform</li>
              <li>User's transactions or interactions with other users</li>
              <li>User's violation of any laws or regulations</li>
              <li>User's infringement of any intellectual property or other rights</li>
              <li>Any false, inaccurate, or misleading information provided by the user</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              In the event of any dispute, controversy, or claim arising out of or relating to these terms, 
              the services, or the relationship between the parties, the following process shall apply:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4">
              <li><strong>Good Faith Negotiation:</strong> Parties agree to first attempt to resolve disputes through good faith negotiation for a period of 30 days.</li>
              <li><strong>Mediation:</strong> If negotiation fails, disputes shall be referred to mediation by a mutually agreed mediator in Bengaluru, Karnataka.</li>
              <li><strong>Arbitration:</strong> If mediation fails, disputes shall be resolved through binding arbitration under the Arbitration and Conciliation Act, 2015, by a sole arbitrator appointed by mutual consent or by the courts in Bengaluru.</li>
              <li><strong>Jurisdiction:</strong> Notwithstanding the above, Lokazen reserves the right to seek injunctive relief or file claims in the courts of Bengaluru, Karnataka, India, which shall have exclusive jurisdiction over all legal proceedings.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms & Conditions are governed by and construed in accordance with the laws of India, 
              without regard to conflict of law principles. Any disputes arising from these terms or the use 
              of our services shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.
            </p>
            <p className="text-gray-700 mb-4">
              Users accessing our services from outside India acknowledge that they are responsible for compliance 
              with local laws and regulations in their jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modifications to Terms</h2>
            <p className="text-gray-700 mb-4">
              Lokazen reserves the right to modify these Terms & Conditions at any time. Material changes will 
              be communicated to users via email or platform notifications at least 30 days before they take effect. 
              Continued use of our services after such modifications constitutes acceptance of the updated terms.
            </p>
            <p className="text-gray-700 mb-4">
              If you do not agree to the modified terms, you must discontinue use of our services and may request 
              account closure. However, all fees paid prior to such discontinuation remain non-refundable, and any 
              outstanding obligations, including payment obligations, will continue to apply.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Severability and Waiver</h2>
            <p className="text-gray-700 mb-4">
              If any provision of these terms is found to be invalid, illegal, or unenforceable, the remaining 
              provisions shall continue in full force and effect. The invalid provision shall be modified to the 
              minimum extent necessary to make it valid and enforceable.
            </p>
            <p className="text-gray-700 mb-4">
              Failure by Lokazen to enforce any right or provision of these terms shall not constitute a waiver 
              of such right or provision. Any waiver must be in writing and signed by an authorized representative 
              of Lokazen.
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


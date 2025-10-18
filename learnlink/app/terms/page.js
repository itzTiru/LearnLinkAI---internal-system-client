// app/terms/page.js
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Terms of Service - EduRecommend",
  description: "Our Terms of Service outline the rules and guidelines for using EduRecommend's services.",
};

export default function TermsOfService() {
  return (
    <main className={`${geistSans.variable} antialiased min-h-screen bg-gray-50 py-12`}>
      <div className="max-w-4xl mx-auto px-6">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600">
            Last updated: October 18, 2025
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using EduRecommend ("we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use our Services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              These Terms apply to our website, mobile app, and any related services (collectively, the "Services").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Eligibility</h2>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 13 years old to use our Services. By using the Services, you represent that you meet this requirement and are not barred from using the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To access certain features, you must create an account with accurate information. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate accounts for violations of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Use the Services for illegal purposes.</li>
              <li>Upload harmful content or malware.</li>
              <li>Impersonate others or violate intellectual property rights.</li>
              <li>Spam or engage in abusive behavior.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We may remove content or terminate access for violations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All content on the Services, including recommendations and roadmaps, is owned by us or our licensors. You are granted a limited, non-exclusive license to use the Services for personal, non-commercial purposes.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You retain ownership of your user-generated content but grant us a worldwide, royalty-free license to use it for Service improvement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Disclaimers and Limitations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Services are provided "as is" without warranties. We do not guarantee accuracy of recommendations or uninterrupted access.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our liability is limited to the maximum extent permitted by law. You agree to indemnify us against claims arising from your use of the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your access at any time, with or without notice, for any reason, including violations of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update these Terms periodically. Changes will be posted here with the updated date. Continued use constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              Questions about these Terms? Contact us at legal@edurecommend.com.
            </p>
          </section>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2025 EduRecommend. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
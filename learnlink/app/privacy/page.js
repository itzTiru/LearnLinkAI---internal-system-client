// app/privacy/page.js
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Privacy Policy - EduRecommend",
  description: "Read our Privacy Policy to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicy() {
  return (
    <main className={`${geistSans.variable} antialiased min-h-screen bg-gray-50 py-12`}>
      <div className="max-w-4xl mx-auto px-6">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Last updated: October 18, 2025
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to EduRecommend ("we," "our," or "us"). We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website [edurecommend.com], use our mobile application, or engage with our services (collectively, the "Services").
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our Services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our practices, please do not use our Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information to provide, improve, and personalize our Services. The types of information we collect include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li><strong>Personal Information:</strong> Name, email address, education level, interests, and other details you provide during registration or profile setup.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our Services, such as search queries, recommendations viewed, and device information (e.g., IP address, browser type).</li>
              <li><strong>Cookies and Tracking Technologies:</strong> Data collected via cookies, web beacons, and similar technologies to enhance user experience and analyze usage.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We do not collect sensitive personal information (e.g., health or financial data) unless explicitly provided for specific features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>To provide and personalize learning recommendations and roadmaps.</li>
              <li>To communicate with you, including updates and promotional content (with opt-out options).</li>
              <li>To improve our Services through analytics and research.</li>
              <li>To comply with legal obligations and prevent fraud.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sharing Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share it with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Service providers (e.g., cloud hosting, analytics tools) under strict confidentiality agreements.</li>
              <li>Legal authorities if required by law.</li>
              <li>Business partners for joint services, with your consent.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              In the event of a merger or acquisition, your information may be transferred as an asset.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement reasonable security measures to protect your information, including encryption and access controls. However, no system is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have rights to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Access, correct, or delete your personal information.</li>
              <li>Withdraw consent or object to processing.</li>
              <li>Request data portability.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, contact us at privacy@edurecommend.com. We respond within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Services are not intended for children under 13. We do not knowingly collect data from children. If we discover such data, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy periodically. Changes will be posted here with the updated date. Continued use of our Services after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@edurecommend.com
              <br />
              Address: EduRecommend Inc., 123 Learning St., EduCity, EC 12345
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
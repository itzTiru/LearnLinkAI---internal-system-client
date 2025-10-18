// app/cookies/page.js
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cookie Policy - EduRecommend",
  description: "Learn about our use of cookies and how they help improve your experience on EduRecommend.",
};

export default function CookiePolicy() {
  return (
    <main className={`${geistSans.variable} antialiased min-h-screen bg-gray-50 py-12`}>
      <div className="max-w-4xl mx-auto px-6">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-xl text-gray-600">
            Last updated: October 18, 2025
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cookies are small text files stored on your device by websites you visit. They help us remember your preferences, analyze usage, and provide a better experience.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We use cookies on EduRecommend to enhance functionality and personalize content. You can manage cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following categories of cookies:
            </p>
            <ul className="space-y-4 mb-4">
              <li>
                <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                <p className="text-gray-700">Necessary for basic site functionality, such as maintaining your login session. These cannot be disabled.</p>
              </li>
              <li>
                <h3 className="font-semibold text-gray-900">Performance Cookies</h3>
                <p className="text-gray-700">Help us understand how visitors interact with the site (e.g., page views, bounce rates). Collected anonymously.</p>
              </li>
              <li>
                <h3 className="font-semibold text-gray-900">Functional Cookies</h3>
                <p className="text-gray-700">Enable features like personalized recommendations and language preferences.</p>
              </li>
              <li>
                <h3 className="font-semibold text-gray-900">Targeting Cookies</h3>
                <p className="text-gray-700">Used by third-party advertisers to show relevant ads based on your browsing history.</p>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We partner with third parties (e.g., Google Analytics, YouTube) that may set cookies. These are governed by their privacy policies.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Google Analytics: For traffic analysis.</li>
              <li>YouTube: For embedded videos.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can control cookies via:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Your browser settings (e.g., Chrome, Safari).</li>
              <li>Our cookie consent banner (where applicable).</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Disabling cookies may limit site functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              Questions about cookies? Email us at privacy@edurecommend.com.
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
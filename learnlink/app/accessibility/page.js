// app/accessibility/page.js
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Accessibility - EduRecommend",
  description: "Our commitment to making EduRecommend accessible to all users.",
};

export default function Accessibility() {
  return (
    <main className={`${geistSans.variable} antialiased min-h-screen bg-gray-50 py-12`}>
      <div className="max-w-4xl mx-auto px-6">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
          <p className="text-xl text-gray-600">
            Last updated: October 18, 2025
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At EduRecommend, we are dedicated to ensuring our Services are accessible to everyone, including individuals with disabilities. We strive to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Accessibility is integral to our mission of inclusive education.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features for Accessibility</h2>
            <ul className="space-y-4 mb-4">
              <li>
                <h3 className="font-semibold text-gray-900">Keyboard Navigation</h3>
                <p className="text-gray-700">All interactive elements are accessible via keyboard.</p>
              </li>
              <li>
                <h3 className="font-semibold text-gray-900">Screen Reader Support</h3>
                <p className="text-gray-700">Semantic HTML, alt text for images, and ARIA labels for dynamic content.</p>
              </li>
              <li>
                <h3 className="font-semibold text-gray-900">Color Contrast</h3>
                <p className="text-gray-700">High contrast ratios for text and interactive elements.</p>
              </li>
              <li>
                <h3 className="font-semibold text-gray-900">Resizable Text</h3>
                <p className="text-gray-700">Text can be zoomed up to 200% without loss of functionality.</p>
              </li>
              <li>
                <h3 className="font-semibold text-gray-900">Mobile Responsiveness</h3>
                <p className="text-gray-700">Optimized for touch devices and various screen sizes.</p>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ongoing Efforts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We regularly audit our Services with tools like WAVE and Lighthouse, and incorporate user feedback.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our development team includes accessibility training and follows inclusive design principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback and Reporting</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We welcome feedback on accessibility. If you encounter barriers, please report them.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Email: accessibility@edurecommend.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              We comply with applicable laws, including the Americans with Disabilities Act (ADA) and Section 508.
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
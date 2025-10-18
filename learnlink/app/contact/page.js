// app/contact/page.js
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Contact Us - EduRecommend",
  description: "Get in touch with us for support, feedback, or inquiries.",
};

export default function ContactUs() {
  return (
    <main className={`${geistSans.variable} antialiased min-h-screen bg-gray-50 py-12`}>
      <div className="max-w-4xl mx-auto px-6">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">
            We'd love to hear from you. Reach out for any reason!
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-12 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Subject line"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your message..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Support</h3>
              <p className="text-gray-700 mb-2">For help with accounts or features</p>
              <p className="text-blue-600 font-medium">support@edurecommend.com</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Partnerships</h3>
              <p className="text-gray-700 mb-2">Inquiries about collaborations</p>
              <p className="text-blue-600 font-medium">sales@edurecommend.com</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Press & Media</h3>
              <p className="text-gray-700 mb-2">For journalists and media requests</p>
              <p className="text-blue-600 font-medium">press@edurecommend.com</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Inquiries</h3>
              <p className="text-gray-700 mb-2">All other questions</p>
              <p className="text-blue-600 font-medium">hello@edurecommend.com</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Address</h3>
              <p className="text-gray-700">
                EduRecommend Inc.
                <br />
                123 Learning St.
                <br />
                EduCity, EC 12345
                <br />
                United States
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2025 EduRecommend. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
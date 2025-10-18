'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaCog, FaGithub, FaTwitter, FaLinkedin, FaEnvelope, FaHeart, FaBook, FaRocket, FaUsers } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Navbar() {
  const [userProfile, setUserProfile] = useState(null);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [sessionManagement, setSessionManagement] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // Pages where navbar should not appear
  const hideNavbarPages = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarPages.includes(pathname);

  // Dynamically import session-management
  useEffect(() => {
    import("../lib/session-management").then((mod) => {
      setSessionManagement(mod.default || mod);
    });
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!sessionManagement || !shouldShowNavbar) return;

      const token = sessionManagement.getToken();
      if (!token || !sessionManagement.isAuthenticated()) {
        sessionManagement.clearToken();
        router.replace("/login");
        return;
      }

      try {
        const decodedUser = sessionManagement.getUser();
        if (!decodedUser) throw new Error("Invalid session");

        const email = decodedUser.email;
        const encodedEmail = encodeURIComponent(email);

        const res = await fetch(`http://localhost:8000/personal/${encodedEmail}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 401) {
            sessionManagement.clearToken();
            router.replace("/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setUserProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        if (err.message.includes("401") || err.message.includes("session")) {
          sessionManagement.clearToken();
          router.replace("/login");
        }
      }
    };

    if (sessionManagement) {
      fetchUserProfile();
    }
  }, [sessionManagement, pathname, shouldShowNavbar, router]);

  const handleChooseAnotherAccount = () => {
    if (sessionManagement) {
      sessionManagement.clearToken();
      router.push("/login");
      setShowAccountPopup(false);
    }
  };

  const handleSignUp = () => {
    router.push("/register");
    setShowAccountPopup(false);
  };

  const handleSettings = () => {
    router.push("/settings");
    setShowAccountPopup(false);
  };

  const handleLogout = () => {
    if (sessionManagement) {
      sessionManagement.clearToken();
      router.push("/login");
      setShowAccountPopup(false);
    }
  };

  const getPageTitle = () => {
    if (pathname === '/search' || pathname === '/' || pathname === '/home') return 'Explore';
    if (pathname === '/personal') return 'My Profile';
    if (pathname === '/search-results') return 'Search Results';
    return 'EduRecommend';
  };

  const getPageSubtitle = () => {
    if (pathname === '/search' || pathname === '/') {
      return 'What do you want to learn?';
    }
    if (pathname === '/personal') {
      return userProfile?.name ? `${userProfile.name}'s Profile` : 'Your Profile';
    }
    return 'Continue your learning journey';
  };

  if (!shouldShowNavbar) return null;

  return (
    <header className="bg-white shadow-sm p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-600">
              {getPageSubtitle()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/search')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              pathname === '/search' || pathname === '/'
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Home
          </button>
          
          <button
            onClick={() => router.push('/personal')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              pathname === '/personal'
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            My Profile
          </button>

          <div className="relative">
            <button
              onClick={() => setShowAccountPopup(!showAccountPopup)}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md"
              title={userProfile?.name || 'Account'}
            >
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </button>
            
            {showAccountPopup && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowAccountPopup(false)}
                />
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-64 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {userProfile?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {userProfile?.email || 'user@example.com'}
                        </p>
                      </div>
                    </div>
                    {userProfile?.education_level && (
                      <p className="text-xs text-blue-600 mt-1">
                        {userProfile.education_level}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleChooseAnotherAccount}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    Choose another account
                  </button>
                  
                  <button 
                    onClick={handleSignUp}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    Sign up
                  </button>
                  
                  <button 
                    onClick={handleSettings}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2"
                  >
                    <FaCog />
                    <span>Settings</span>
                  </button>
                  
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  // Pages where footer should not appear
  const hideFooterPages = ['/login', '/register'];
  const shouldShowFooter = !hideFooterPages.includes(pathname);

  if (!shouldShowFooter) return null;

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaBook className="text-white text-xl" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                EduRecommend
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your personalized learning companion powered by AI. Discover courses, build roadmaps, and achieve your educational goals.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <FaGithub className="text-lg" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-700 hover:bg-blue-400 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <FaTwitter className="text-lg" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-700 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <FaLinkedin className="text-lg" />
              </a>
              <a
                href="mailto:contact@edurecommend.com"
                className="w-9 h-9 bg-gray-700 hover:bg-purple-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <FaEnvelope className="text-lg" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push('/search')}
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm flex items-center space-x-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/personal')}
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm flex items-center space-x-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  <span>My Profile</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/upload-pdf')}
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm flex items-center space-x-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  <span>Document Summarization</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/roadmap-generation')}
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm flex items-center space-x-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  <span>Roadmap Generation</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/settings')}
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm flex items-center space-x-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  <span>Settings</span>
                </button>
              </li>
            </ul>
          </div>

          

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/cookies"
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a
                  href="/accessibility"
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Accessibility
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        
        
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>© 2025 EduRecommend. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>Made with</span>
              <FaHeart className="text-red-500 animate-pulse" />
              <span>for learners worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
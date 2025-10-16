'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaCog } from "react-icons/fa";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
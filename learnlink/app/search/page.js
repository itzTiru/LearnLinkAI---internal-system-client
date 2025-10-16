'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";

export default function PersonalizedHomePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [recording, setRecording] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const router = useRouter();
   const [sessionManagement, setSessionManagement] = useState(null);
  const [particles, setParticles] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // Generate particles once on client side only
  useEffect(() => {
    setIsClient(true);
    const generatedParticles = [...Array(15)].map((_, i) => ({
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      background: `rgba(${100 + Math.random() * 155}, ${110 + Math.random() * 145}, ${230 + Math.random() * 25}, 0.5)`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 5
    }));
    setParticles(generatedParticles);
  }, []);

  // Dynamically import session-management
  useEffect(() => {
    import("../../lib/session-management").then((mod) => {
      setSessionManagement(mod.default || mod);
    });
  }, []);

  // Auto-redirect if not authenticated
  useEffect(() => {
    const checkAuth = () => {
      if (sessionManagement && !sessionManagement.isAuthenticated()) {
        sessionManagement.clearToken();
        router.replace("/login");
      }
    };
    if (sessionManagement) {
      const timer = setTimeout(checkAuth, 100);
      return () => clearTimeout(timer);
    }
  }, [sessionManagement, router]);

  useEffect(() => {
    fetchUserData();
  }, [sessionManagement]);

  const fetchUserData = async () => {
    if (!sessionManagement) return;

    const token = sessionManagement.getToken();
    if (!token || !sessionManagement.isAuthenticated()) {
      sessionManagement.clearToken();
      router.replace("/login");
      return;
    }

    const decodedUser = sessionManagement.getUser();
    if (!decodedUser) {
      sessionManagement.clearToken();
      router.replace("/login");
      return;
    }

    const email = decodedUser.email;
    const encodedEmail = encodeURIComponent(email);
    console.log('Decoded email:', email);  // For debugging

    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch profile using /personal/{email} to match ProfilePage
      const profileRes = await fetch(`http://localhost:8000/personal/${encodedEmail}`, {
        headers
      });
      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          sessionManagement.clearToken();
          router.replace("/login");
          return;
        }
        throw new Error(`Profile fetch failed: ${profileRes.status}`);
      }
      const profileData = await profileRes.json();
      setUserProfile(profileData.profile || profileData);  // Adjust if wrapped

     const recMode = aiMode ? 'ai' : 'traditional';
      const recRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/recommendations`, {
        headers
      });
      if (!recRes.ok) {
        if (recRes.status === 401) {
          sessionManagement.clearToken();
          router.replace("/login");
          return;
        }
        throw new Error(`Recommendations fetch failed: ${recRes.status}`);
      }
      const recData = await recRes.json();
      setRecommendations(recData.recommendations || []);

      // Fetch recent searches
    //   const searchRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/recent-searches`, {
    //     headers
    //   });
    //   if (!searchRes.ok) {
    //     if (searchRes.status === 401) {
    //       sessionManagement.clearToken();
    //       router.replace("/login");
    //       return;
    //     }
    //     throw new Error(`Searches fetch failed: ${searchRes.status}`);
    //   }
    //   const searchData = await searchRes.json();
    //   setRecentSearches(searchData.searches || []);
    // } catch (err) {
    //   console.error('Error fetching user data:', err);
    //   setError(`Failed to load your personalized content: ${err.message}`);
    //   if (err.message.includes("401") || err.message.includes("session")) {
    //     sessionManagement.clearToken();
    //     router.replace("/login");
    //   }
    } finally {
      setLoading(false);
    }
  };

  const cleanTranscript = (text) => {
    return text
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const handleSearch = async (customQuery) => {
    const q = customQuery ?? query;
    if (!q.trim()) return;

    if (!sessionManagement || !sessionManagement.isAuthenticated()) {
      setError('Please log in to search.');
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = sessionManagement.getToken();
      const endpoint = aiMode
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/aiinfo`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: q,
          max_results: 10,
          platforms: ['web', 'youtube']
        })
      });
      if (!response.ok) {
        if (response.status === 401) {
          sessionManagement.clearToken();
          router.replace("/login");
          return;
        }
        throw new Error(`Search failed: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.results || []);
      setShowSearch(true);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    }
    setLoading(false);
  };

   const toggleAiMode = () => {
  setIsFading(true);
  setTimeout(async () => {
    const newMode = !aiMode;
    setAiMode(newMode);
    
    // Refetch recommendations with new mode
    if (userProfile && sessionManagement) {
      const recMode = newMode ? 'ai' : 'traditional';
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/recommendations?mode=${recMode}`, {
          headers: { Authorization: `Bearer ${sessionManagement.getToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    }
    
    setIsFading(false);
  }, 300);
};

  const handleMicClick = async () => {
    if (recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', blob, 'voice.webm');

          try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transcribe`, {
              method: 'POST',
              body: formData
            });
            if (!resp.ok) {
              throw new Error(`Transcription failed: ${resp.status}`);
            }
            const data = await resp.json();
            let transcript = data.text || '';
            transcript = cleanTranscript(transcript);
            setQuery(transcript);
            handleSearch(transcript);
          } catch (err) {
            console.error('Transcription error:', err);
            setError('Voice transcription failed. Try again.');
          }
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error('Microphone access error:', err);
        setError('Microphone access denied.');
      }
    }
  };

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your personalized experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      
      <div
        className={`fixed inset-0 z-0 transition-opacity duration-500 ${
          aiMode ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)',
        }}
      >
        {/* Stars */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20% 30%, white, transparent),
                           radial-gradient(2px 2px at 60% 70%, white, transparent),
                           radial-gradient(1px 1px at 50% 50%, white, transparent),
                           radial-gradient(1px 1px at 80% 10%, white, transparent),
                           radial-gradient(2px 2px at 90% 60%, white, transparent),
                           radial-gradient(1px 1px at 33% 80%, white, transparent),
                           radial-gradient(1px 1px at 15% 90%, white, transparent)`,
          backgroundSize: '200% 200%',
          animation: 'twinkle 4s ease-in-out infinite'
        }}></div>

        {/* Network Lines SVG */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }}>
          <defs>
            <radialGradient id="nodeGradient">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </radialGradient>
            <linearGradient id="lineGradient">
              <stop offset="0%" stopColor="#667eea" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#764ba2" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Animated Lines */}
          <line x1="20%" y1="30%" x2="40%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="40%" y1="50%" x2="60%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
          </line>
          <line x1="60%" y1="30%" x2="80%" y2="40%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.5s" repeatCount="indefinite" />
          </line>
          <line x1="80%" y1="40%" x2="70%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4.5s" repeatCount="indefinite" />
          </line>
          <line x1="70%" y1="70%" x2="50%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.2s" repeatCount="indefinite" />
          </line>
          <line x1="50%" y1="80%" x2="30%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="4.8s" repeatCount="indefinite" />
          </line>
          <line x1="30%" y1="70%" x2="20%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3.8s" repeatCount="indefinite" />
          </line>
          <line x1="40%" y1="50%" x2="70%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="5s" repeatCount="indefinite" />
          </line>
          <line x1="60%" y1="30%" x2="50%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4.2s" repeatCount="indefinite" />
          </line>

          {/* Network Nodes */}
          <circle cx="20%" cy="30%" r="4" fill="url(#nodeGradient)">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="40%" cy="50%" r="5" fill="url(#nodeGradient)">
            <animate attributeName="r" values="5;7;5" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="60%" cy="30%" r="4" fill="url(#nodeGradient)">
            <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="80%" cy="40%" r="5" fill="url(#nodeGradient)">
            <animate attributeName="r" values="5;7;5" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="70%" cy="70%" r="4" fill="url(#nodeGradient)">
            <animate attributeName="r" values="4;6;4" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="50%" cy="80%" r="5" fill="url(#nodeGradient)">
            <animate attributeName="r" values="5;8;5" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="30%" cy="70%" r="4" fill="url(#nodeGradient)">
            <animate attributeName="r" values="4;6;4" dur="3.2s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Floating Particles */}
<div className="absolute inset-0 overflow-hidden">
  {isClient && particles.map((particle, i) => (
    <div
      key={i}
      className="absolute rounded-full"
      style={{
        width: `${particle.width}px`,
        height: `${particle.height}px`,
        background: particle.background,
        left: particle.left,
        top: particle.top,
        animation: `float ${particle.duration}s ease-in-out infinite`,
        animationDelay: `${particle.delay}s`
      }}
    />
  ))}
</div>
      </div>

      <div
        className={`relative z-10 min-h-screen transition-all duration-300 ${
          aiMode ? 'bg-transparent text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
        } ${isFading ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Bar with AI Toggle */}
          <div className="mb-12">
            <div className="relative max-w-3xl mx-auto">
              <input
                type="text"
                placeholder={aiMode ? '🔍 Search the knowledge galaxy...' : '🔍 What would you like to learn today?'}
                value={query}
                onChange={(e) => setQuery(cleanTranscript(e.target.value))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full px-6 py-4 pr-48 rounded-2xl shadow-lg text-lg transition-all ${
                  aiMode
                    ? 'border-2 border-blue-400 bg-gray-800/80 text-white backdrop-blur-sm placeholder-blue-200'
                    : 'border-2 border-blue-200 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  onClick={handleMicClick}
                  className={`p-3 rounded-xl transition-all ${
                    recording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : aiMode
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white shadow-md`}
                  title={recording ? 'Stop recording' : 'Voice search'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  onClick={toggleAiMode}
                  className={`px-4 py-3 text-white rounded-xl font-medium transition-all shadow-md ${
                    aiMode
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 animate-pulse'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  AI {aiMode ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => handleSearch()}
                  className={`px-5 py-3 text-white rounded-xl font-medium transition-all shadow-md ${
                    aiMode
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className={`max-w-3xl mx-auto mb-6 p-4 rounded-lg ${
              aiMode ? 'bg-red-900/50 border border-red-500 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Search Results - Separated by Platform */}
          {showSearch && searchResults.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                  {aiMode ? '🌌 AI-Powered Results' : 'Search Results'}
                </h2>
                <button
                  onClick={() => setShowSearch(false)}
                  className={`text-sm font-medium ${
                    aiMode ? 'text-blue-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Back to Home
                </button>
              </div>

              {/* YouTube Results */}
              {searchResults.filter(r => r.platform === 'youtube').length > 0 && (
                <div className="mb-10">
                  <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className="text-red-500">▶</span> YouTube Videos
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {searchResults
                      .filter(result => result.platform === 'youtube')
                      .map((result, idx) => {
                        const getYouTubeId = (url) => {
                          const match = url?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                          return match ? match[1] : null;
                        };
                        const videoId = getYouTubeId(result.url);
                        const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

                        const queryParams = new URLSearchParams({
                          page: 'youtube',
                          title: result.title || '',
                          description: result.description || '',
                          url: result.url || '',
                          platform: 'youtube',
                          aiMode: aiMode ? 'true' : 'false'
                        }).toString();

                        const handleCardClick = () => {
                          router.push(`/search-results?${queryParams}`);
                        };

                        return (
                          <div
                            key={idx}
                            onClick={handleCardClick}
                            className={`rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer group ${
                              aiMode ? 'bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-red-400/30' : 'bg-white border border-gray-100 hover:border-red-300'
                            }`}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                          >
                            {thumbnailUrl && (
                              <div className="relative w-full h-48 overflow-hidden bg-gray-900">
                                <img src={thumbnailUrl} alt={result.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.style.display = 'none'; }} />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="p-5">
                              <div className="flex items-start justify-between mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${aiMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'}`}>▶ YouTube</span>
                              </div>
                              <h3 className={`text-lg font-semibold mb-2 transition ${aiMode ? 'text-white group-hover:text-red-300' : 'text-gray-900 group-hover:text-red-600'} line-clamp-2`}>{result.title}</h3>
                              <p className={`text-sm mb-4 line-clamp-2 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>{result.description}</p>
                              <a href={result.url || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`text-sm font-medium hover:underline inline-flex items-center gap-1 ${aiMode ? 'text-red-400' : 'text-red-600'}`}>Watch Video →</a>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Web Results */}
             {searchResults.filter(r => r.platform === 'web').length > 0 && (
                <div>
                  <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className="text-blue-500">Web Resources</span>
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {searchResults
                      .filter(result => result.platform === 'web')
                      .map((result, idx) => {
                        const queryParams = new URLSearchParams({
                          page: 'web',
                          title: result.title || '',
                          description: result.description || '',
                          url: result.url || '',
                          platform: 'web',
                          aiMode: aiMode ? 'true' : 'false'
                        }).toString();

                        const handleCardClick = () => {
                          router.push(`/search-results?${queryParams}`);
                        };

                        return (
                          <div
                            key={idx}
                            onClick={handleCardClick}
                            className={`rounded-xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer group ${
                              aiMode ? 'bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-blue-400/30' : 'bg-white border border-gray-100 hover:border-blue-300'
                            }`}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${aiMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>Web</span>
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 transition ${aiMode ? 'text-white group-hover:text-blue-300' : 'text-gray-900 group-hover:text-blue-600'} line-clamp-2`}>{result.title}</h3>
                            <p className={`text-sm mb-4 line-clamp-3 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>{result.description}</p>
                            <a href={result.url || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`text-sm font-medium hover:underline inline-flex items-center gap-1 ${aiMode ? 'text-blue-400' : 'text-blue-600'}`}>Read More →</a>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Home Content */}
          {!showSearch && (
            <>
              <div className="mb-12">
                <h2 className={`text-2xl font-bold mb-2 ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                  {aiMode ? 'AI-Curated Recommendations' : 'Recommended for You'}
                </h2>
                <p className={`mb-6 ${aiMode ? 'text-blue-200' : 'text-gray-600'}`}>Based on your education level and interests</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, idx) => {
                      const queryParams = new URLSearchParams({
                        page: 'recommendation',
                        title: rec.title || '',
                        description: rec.description || '',
                        category: rec.category || '',
                        relevance_score: rec.relevance_score || '',
                        platform: rec.platform || '',
                        url: rec.url || '', // Added missing url param
                        aiMode: aiMode ? 'true' : 'false'
                      }).toString();

                      const handleCardClick = () => {
                        router.push(`/search-results?${queryParams}`);
                      };

                      return (
                        <div
                          key={idx}
                          onClick={handleCardClick}
                          className={`rounded-xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer group ${
                            aiMode ? 'bg-purple-900/40 hover:bg-purple-800/60 backdrop-blur-sm border border-purple-400/30' : 'bg-white border border-gray-100 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${aiMode ? 'bg-gradient-to-br from-lavender-600 to-lightgray-600' : 'bg-gradient-to-br from-lavender-500 to-lightgray-500'}`}>📚</div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${aiMode ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>{rec.category || 'Recommended'}</span>
                          </div>
                          <h3 className={`text-lg font-semibold mb-2 transition ${aiMode ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-600'}`}>{rec.title}</h3>
                          <p className={`text-sm mb-3 line-clamp-2 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>{rec.description}</p>
                          <div className={`flex items-center gap-2 text-xs ${aiMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>⭐ {rec.relevance_score || '95'}% match</span>
                            <span>•</span>
                            <span>{rec.platform || 'Multiple platforms'}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="text-6xl mb-4">🎓</div>
                      <p className={aiMode ? 'text-gray-300' : 'text-gray-600'}>
                        We're building your personalized recommendations...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {recentSearches.length > 0 && (
                <div className="mb-12">
                  <h2 className={`text-2xl font-bold mb-6 ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                    Continue Learning
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(search.query);
                          handleSearch(search.query);
                        }}
                        className={`px-4 py-2 rounded-full text-sm transition-all shadow-sm ${
                          aiMode
                            ? 'bg-gray-800/80 border-2 border-blue-400/50 text-white hover:border-blue-300 hover:bg-gray-700/80 backdrop-blur-sm'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        🔍 {search.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`rounded-2xl p-8 shadow-xl ${
                aiMode
                  ? 'bg-gradient-to-r from-purple-900/60 to-pink-900/60 backdrop-blur-sm border border-purple-400/30'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}>
                <h2 className="text-3xl font-bold mb-3 text-white">
                  {aiMode ? '🚀 Your AI Learning Journey' : 'Your Learning Journey'}
                </h2>
                <p className={`mb-6 ${aiMode ? 'text-purple-200' : 'text-blue-100'}`}>
                  Track your progress and discover new topics tailored to your goals
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1 text-white">
                      {userProfile?.completed_courses || 12}
                    </div>
                    <div className={`text-sm ${aiMode ? 'text-purple-200' : 'text-blue-100'}`}>
                      Courses Completed
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1 text-white">
                      {userProfile?.study_hours || 48}
                    </div>
                    <div className={`text-sm ${aiMode ? 'text-purple-200' : 'text-blue-100'}`}>
                      Hours of Learning
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1 text-white">
                      {userProfile?.topics_explored || 24}
                    </div>
                    <div className={`text-sm ${aiMode ? 'text-purple-200' : 'text-blue-100'}`}>
                      Topics Explored
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-40px) translateX(-10px); opacity: 0.8; }
          75% { transform: translateY(-20px) translateX(5px); opacity: 0.6; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
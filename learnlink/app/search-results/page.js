'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [aiMode, setAiMode] = useState(searchParams.get('aiMode') === 'true');
  const [loading, setLoading] = useState(true);
  const [enhancedDescription, setEnhancedDescription] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [particles, setParticles] = useState([]);
  const [relatedTopics, setRelatedTopics] = useState([]);
  const [isFading, setIsFading] = useState(false);
  const [sessionManagement, setSessionManagement] = useState(null);
  const [relatedTopicsLoading, setRelatedTopicsLoading] = useState(true);

  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || '';
  const url = searchParams.get('url') || '';
  const platform = searchParams.get('platform') || '';
  const category = searchParams.get('category') || '';
  const relevanceScore = searchParams.get('relevance_score') || '';

  // Dynamically import session-management
  useEffect(() => {
    import("../../lib/session-management").then((mod) => {
      setSessionManagement(mod.default || mod);
    });
  }, []);

  useEffect(() => {
    const generatedParticles = [...Array(20)].map(() => ({
      width: Math.random() * 4 + 1,
      height: Math.random() * 4 + 1,
      background: `rgba(${100 + Math.random() * 155}, ${110 + Math.random() * 145}, ${230 + Math.random() * 25}, 0.6)`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 5
    }));
    setParticles(generatedParticles);
  }, []);

  useEffect(() => {
    fetchEnhancedDescription();
    fetchRelatedTopics();
  }, [title]);  // Depend on title to refetch when it changes

  const fetchEnhancedDescription = async () => {
    setLoading(true);
    if (!description) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          platform,
          original_description: description,
          user_query: title
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEnhancedDescription(data.detailed_description);
      }
    } catch (error) {
      console.error('Failed to fetch enhanced description:', error);
      setEnhancedDescription(description);
    }
    setLoading(false);
  };

  const fetchRelatedTopics = async () => {
    setRelatedTopicsLoading(true);
    if (!title) {
      setRelatedTopicsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/related-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_query: title
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRelatedTopics(data.topics);
      } else {
        throw new Error('Failed to fetch topics');
      }
    } catch (error) {
      console.error('Failed to fetch related topics:', error);
      // Fallback to static
      const topics = [
        'Advanced Concepts',
        'Beginner Guide',
        'Practical Examples',
        'Deep Dive',
        'Quick Tutorial',
        'Expert Tips'
      ];
      setRelatedTopics(topics.sort(() => Math.random() - 0.5).slice(0, 4));
    }
    setRelatedTopicsLoading(false);
  };

  const toggleAiMode = () => {
    setIsFading(true);
    setTimeout(() => {
      setAiMode(!aiMode);
      setIsFading(false);
    }, 300);
  };

  const handleBookmark = async () => {
    if (!sessionManagement) {
      alert("Session not loaded. Please refresh.");
      return;
    }
    const token = sessionManagement.getToken();
    if (!token || !sessionManagement.isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const decodedUser = sessionManagement.getUser();
    const email = decodedUser.email;
    const encodedEmail = encodeURIComponent(email);

    try {
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
      let currentUser = await res.json();
      let bookmarks = currentUser.bookmarks || [];
      if (!bookmarks.includes(url)) {
        bookmarks.push(url);
        const updatedUser = { ...currentUser, bookmarks };
        const saveRes = await fetch("http://localhost:8000/personal/save", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updatedUser),
        });
        if (saveRes.ok) {
          alert("Bookmarked successfully!");
        } else {
          alert("Failed to bookmark.");
        }
      } else {
        alert("Already bookmarked!");
      }
    } catch (err) {
      console.error("Bookmark error:", err);
      alert("Error bookmarking.");
    }
  };

  const handleTopicClick = async (topic) => {
    try {
      const response = await fetch('http://localhost:8000/topic-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate topic description');
      }

      const data = await response.json();
      const newParams = new URLSearchParams({
        title: topic,
        description: data.detailed_description,
        url: '',
        platform: 'ai',
        category: 'Generated Topic',
        relevance_score: '100',
        aiMode: aiMode.toString()
      });

      router.push(`?${newParams.toString()}`);
    } catch (error) {
      console.error('Failed to handle topic click:', error);
      alert('Error loading topic details. Please try again.');
    }
  };

  const getYouTubeId = (url) => {
    const match = url?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = platform === 'youtube' ? getYouTubeId(url) : null;

  return (
    <div className="relative min-h-screen">
      {/* AI Mode Background */}
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
                           radial-gradient(2px 2px at 90% 60%, white, transparent)`,
          backgroundSize: '200% 200%',
          animation: 'twinkle 4s ease-in-out infinite'
        }}></div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle, i) => (
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

        {/* Neural Network */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }}>
          <defs>
            <radialGradient id="nodeGrad">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </radialGradient>
          </defs>
          <line x1="15%" y1="20%" x2="35%" y2="40%" stroke="rgba(102, 126, 234, 0.3)" strokeWidth="1">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="35%" y1="40%" x2="65%" y2="35%" stroke="rgba(102, 126, 234, 0.3)" strokeWidth="1">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.5s" repeatCount="indefinite" />
          </line>
          <line x1="65%" y1="35%" x2="85%" y2="50%" stroke="rgba(102, 126, 234, 0.3)" strokeWidth="1">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
          </line>
          <circle cx="15%" cy="20%" r="4" fill="url(#nodeGrad)">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="35%" cy="40%" r="5" fill="url(#nodeGrad)">
            <animate attributeName="r" values="5;7;5" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="65%" cy="35%" r="4" fill="url(#nodeGrad)">
            <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="85%" cy="50%" r="5" fill="url(#nodeGrad)">
            <animate attributeName="r" values="5;8;5" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Main Content */}
      <div
        className={`relative z-10 min-h-screen transition-all duration-300 ${
          aiMode ? 'bg-transparent text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
        } ${isFading ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                aiMode
                  ? 'bg-gray-800/80 border border-blue-400/50 text-white hover:bg-gray-700/80'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-400'
              }`}
            >
              ← Back to Search
            </button>
            
          </div>

          {/* Main Content Card */}
          <div className={`rounded-2xl shadow-2xl overflow-hidden mb-8 ${
            aiMode ? 'bg-gray-800/80 backdrop-blur-sm border border-purple-400/30' : 'bg-white'
          }`}>
            {/* Video/Content Preview */}
            {platform === 'youtube' && videoId && (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Content Details */}
            <div className="p-8">
              {/* Platform Badge & Category */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  platform === 'youtube'
                    ? aiMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                    : aiMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  {platform === 'youtube' ? '▶ YouTube' : '🌐 Web'}
                </span>
                {category && (
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    aiMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {category}
                  </span>
                )}
                {relevanceScore && (
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    aiMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                  }`}>
                    ⭐ {relevanceScore}% match
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className={`text-3xl font-bold mb-6 ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h1>

              {/* Description Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-semibold ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                    {aiMode ? '🤖 AI-Enhanced Description' : 'Description'}
                  </h2>
                  {enhancedDescription && enhancedDescription !== description && (
                    <button
                      onClick={() => setShowOriginal(!showOriginal)}
                      className={`text-sm font-medium underline ${
                        aiMode ? 'text-blue-300 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      {showOriginal ? 'Show Enhanced' : 'Show Original'}
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className={aiMode ? 'text-gray-300' : 'text-gray-600'}>
                      Generating AI-enhanced description...
                    </span>
                  </div>
                ) : (
                  <div className={`prose max-w-none ${aiMode ? 'prose-invert' : ''}`}>
                    <p className={`leading-relaxed whitespace-pre-wrap ${
                      aiMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {showOriginal ? description : (enhancedDescription || description)}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3 rounded-lg font-medium transition-all shadow-md ${
                    aiMode
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  {platform === 'youtube' ? '▶ Watch Video' : '🔗 Visit Website'}
                </a>
                <button
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    aiMode
                      ? 'bg-gray-700/80 border border-gray-600 text-white hover:bg-gray-600/80'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  📚 Add to Learning Path
                </button>
                <button
                  onClick={handleBookmark}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    aiMode
                      ? 'bg-gray-700/80 border border-gray-600 text-white hover:bg-gray-600/80'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  🔖 Bookmark
                </button>
              </div>

              {/* Learning Insights */}
              {aiMode && (
                <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
                  <h3 className="text-lg font-semibold text-white mb-4">💡 AI Learning Insights</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white mb-1">Beginner</div>
                      <div className="text-sm text-purple-200">Difficulty Level</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white mb-1">15-20 min</div>
                      <div className="text-sm text-purple-200">Estimated Time</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white mb-1">95%</div>
                      <div className="text-sm text-purple-200">Completion Rate</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Topics */}
          <div className={`rounded-2xl shadow-xl p-8 ${
            aiMode ? 'bg-gray-800/80 backdrop-blur-sm border border-blue-400/30' : 'bg-white'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${aiMode ? 'text-white' : 'text-gray-900'}`}>
              {aiMode ? '🌟 AI-Recommended Topics' : 'Related Topics'}
            </h2>
            {relatedTopicsLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={aiMode ? 'text-gray-300' : 'text-gray-600'}>
                  Loading related topics...
                </span>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {relatedTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={async () => await handleTopicClick(topic)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      aiMode
                        ? 'bg-gray-700/50 border border-purple-400/30 hover:bg-gray-600/50 text-white'
                        : 'bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎯</span>
                      <span className="font-medium">{topic}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
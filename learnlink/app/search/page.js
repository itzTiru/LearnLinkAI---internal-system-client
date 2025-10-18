'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, BookOpen, ExternalLink, Award, TrendingUp, Send, Bot, User, FileText, Map } from 'lucide-react';

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

  // AI Mode specific states
  const [sessionId, setSessionId] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [domain, setDomain] = useState('');
  const [intent, setIntent] = useState('');
  const [style, setStyle] = useState('');
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState(new Set());

  // Chat bot states
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const TIMEOUT_MS = 100000;

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
      const recRes = await fetch(`${API_BASE}/recommendations?mode=${recMode}`, {
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

      // Fetch recent searches (commented as in original)
      // const searchRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/recent-searches`, {
      //   headers
      // });
      // ...

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(`Failed to load your personalized content: ${err.message}`);
      if (err.message.includes("401") || err.message.includes("session")) {
        sessionManagement.clearToken();
        router.replace("/login");
      }
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

    if (aiMode && !results) {
      // In AI mode, trigger roadmap generation instead of regular search
      handleQuerySubmit(q);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = sessionManagement.getToken();
      const endpoint = aiMode
        ? `${API_BASE}/aiinfo`
        : `${API_BASE}/search`;
      
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
      
      // Reset AI-specific states when toggling
      setSessionId(null);
      setMcqs([]);
      setAnswers({});
      setResults(null);
      setDomain('');
      setIntent('');
      setStyle('');
      setExpandedSteps(new Set());
      setShowSearch(false);
      
      // Refetch recommendations with new mode
      if (userProfile && sessionManagement) {
        const recMode = newMode ? 'ai' : 'traditional';
        try {
          const res = await fetch(`${API_BASE}/recommendations?mode=${recMode}`, {
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

  const handleAiFeatureClick = (feature) => {
    if (feature === 'roadmap') {
      router.push('/roadmap-generation');
    } else if (feature === 'summarization') {
      router.push('/upload-pdf');
    }
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
            const resp = await fetch(`${API_BASE}/transcribe`, {
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

  // AI Mode: Roadmap Generation Functions
  const handleQuerySubmit = async (q) => {
    const currentQuery = q || query;
    if (!currentQuery.trim() || currentQuery.length < 3) {
      setError('Query must be at least 3 characters long.');
      return;
    }
    setLoading(true);
    setError(null);

    const token = sessionManagement.getToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}/start_session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: sessionManagement.getUser().email, query: currentQuery }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.session_id || !Array.isArray(data.mcqs)) {
        throw new Error('Invalid response: Missing session ID or MCQs.');
      }

      setSessionId(data.session_id);
      setMcqs(data.mcqs);
      setDomain(data.domain || 'Unknown');
      setIntent(data.intent || 'Unknown');
      setStyle(data.style || 'Unknown');
      setShowSearch(true); // Show the AI content in the search section

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (err.message.includes('fetch')) {
        setError('Cannot connect to server. Make sure backend is running.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qid, value) => {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) return;
    setAnswers((prev) => ({ ...prev, [qid]: parsedValue }));
  };

  const handleAnswersSubmit = async (e) => {
    e.preventDefault();
    
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = mcqs.length;
    
    if (!sessionId) {
      setError('No active session. Please start over.');
      return;
    }
    
    if (answeredCount !== totalQuestions) {
      setError(`Please answer all ${totalQuestions} questions. You've answered ${answeredCount}.`);
      return;
    }

    setLoading(true);
    setError(null);

    const token = sessionManagement.getToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}/submit_answers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId, answers }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.difficulty || !Array.isArray(data.roadmap)) {
        throw new Error('Invalid response: Missing difficulty or roadmap.');
      }

      setResults(data);

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. The server might be processing. Please wait and try again.');
      } else if (err.message.includes('fetch')) {
        setError('Cannot connect to server. Make sure backend is running.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setQuery('');
    setResults(null);
    setAnswers({});
    setMcqs([]);
    setError(null);
    setExpandedSteps(new Set());
    setShowSearch(false);
  };

  const toggleStep = (stepId) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
      intermediate: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
      advanced: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
    };
    return colors[difficulty] || colors.intermediate;
  };

  // Chat bot functions
  const handleChatSend = async () => {
    if (!chatInput.trim() || !sessionManagement) return;

    const userMessage = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = sessionManagement.getToken();
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = { role: 'bot', content: data.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Chat failed. Please try again.');
      const errorMessage = { role: 'bot', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="relative min-h-screen bg-white">
      
      <div
        className={`relative z-10 min-h-screen transition-all duration-300 bg-white text-gray-900 ${isFading ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Bar with AI Toggle */}
          <div className="mb-12">
            <div className="relative max-w-3xl mx-auto">
              <input
                type="text"
                placeholder={aiMode ? 'What do you want to learn? (AI Mode)' : 'What would you like to learn today?'}
                value={query}
                onChange={(e) => setQuery(cleanTranscript(e.target.value))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full px-6 py-4 pr-48 rounded-2xl shadow-lg text-lg transition-all ${
                  aiMode
                    ? 'border-2 border-blue-200 bg-white text-gray-900'
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
                      ? 'bg-blue-500 hover:bg-blue-600'
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
                      ? 'bg-blue-500 hover:bg-blue-600 animate-pulse'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  AI {aiMode ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => handleSearch()}
                  className={`px-5 py-3 text-white rounded-xl font-medium transition-all shadow-md ${
                    aiMode
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  {aiMode ? 'Explore' : 'Search'}
                </button>
              </div>
            </div>

            {/* AI Mode Navigation Buttons */}
            {aiMode && (
              <div className="max-w-3xl mx-auto mt-6 flex justify-center gap-4">
                <button
                  onClick={() => handleAiFeatureClick('roadmap')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <Map size={20} />
                  Roadmap Generation
                </button>
                <button
                  onClick={() => handleAiFeatureClick('summarization')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <FileText size={20} />
                  Document Summarization
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className={`max-w-3xl mx-auto mb-6 p-4 rounded-lg ${
              aiMode ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* AI Mode Content */}
          {aiMode && showSearch && (
            <div className="mb-12 max-w-4xl mx-auto">
              {/* Loading for AI */}
              {loading && (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Processing...</p>
                </div>
              )}

              {/* MCQ Questions */}
              {sessionId && mcqs.length > 0 && !results && !loading && (
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">
                    Assessment Questions
                  </h2>
                  <p className="mb-6 text-gray-600 text-sm">
                    <strong>Domain:</strong> {domain} | <strong>Intent:</strong> {intent} | <strong>Style:</strong> {style}
                  </p>
                  <form onSubmit={handleAnswersSubmit}>
                    {mcqs.map((q, index) => (
                      <div key={q.id} className="mb-6 border border-gray-300 p-6 rounded-xl bg-gray-50">
                        <p className="font-bold mb-4 text-gray-900 text-lg">
                          {index + 1}. {q.question}
                        </p>
                        {q.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center mb-3 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={optIndex}
                              checked={answers[q.id] === optIndex}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <p className="text-gray-700 font-semibold">Answered: {Object.keys(answers).length}/{mcqs.length} questions</p>
                    </div>
                    <button
                      type="submit"
                      disabled={Object.keys(answers).length !== mcqs.length}
                      className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold disabled:bg-gray-400"
                    >
                      {loading ? 'Generating Roadmap...' : 'Generate My Roadmap'}
                    </button>
                  </form>
                </div>
              )}

              {/* Roadmap Results */}
              {results && !loading && (
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Your Personalized Learning Roadmap
                    </h2>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-gray-50 rounded-xl border border-gray-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Award size={32} color="white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-gray-600 text-sm font-semibold">Difficulty Level</p>
                      <p className="text-2xl font-bold text-gray-900 capitalize">{results.difficulty.difficulty}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-gray-600 text-sm font-semibold">Score</p>
                      <p className="text-2xl font-bold text-gray-900">{results.difficulty.score}/{results.difficulty.total}</p>
                    </div>
                  </div>

                  {/* Learning Path */}
                  <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <TrendingUp size={24} color="#3b82f6" />
                    Learning Path
                  </h3>

                  <div className="space-y-6">
                    {results.roadmap.map((step, index) => {
                      const isExpanded = expandedSteps.has(step.id);
                      const resources = results.recommendations[step.title] || [];
                      const hasPrereq = step.prereq && step.prereq.length > 0;

                      return (
                        <div key={step.id} className="relative">
                          {/* Connector */}
                          {index < results.roadmap.length - 1 && (
                            <div className="absolute left-6 top-20 w-0.5 h-full bg-gradient-to-b from-blue-500 to-purple-600 opacity-30"></div>
                          )}
                          <div className="relative bg-gray-50 rounded-xl border border-gray-300 overflow-hidden shadow-md">
                            <div
                              onClick={() => toggleStep(step.id)}
                              className={`p-6 cursor-pointer transition-all ${isExpanded ? 'bg-gradient-to-r from-blue-100 to-purple-100' : ''}`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${isExpanded ? 'bg-gray-900/20' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h4>
                                  <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                                    <span className="flex items-center gap-1"><Clock size={16} /> {step.estimated_time_hours} hours</span>
                                    {hasPrereq && (
                                      <span className="px-3 py-1 bg-gray-200 rounded-full text-xs">
                                        Prereqs: {step.prereq.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronDown size={24} className={`text-gray-900 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            {isExpanded && resources.length > 0 && (
                              <div className="p-6 border-t border-gray-300 bg-white">
                                <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                  <BookOpen size={20} color="#3b82f6" /> Recommended Resources
                                </h5>
                                <div className="space-y-4">
                                  {resources.map((resource, idx) => (
                                    <a
                                      key={idx}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-300 hover:border-blue-300 transition-all hover:translate-x-2"
                                    >
                                      <ExternalLink size={18} color="#3b82f6" className="mt-1 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-blue-600 font-semibold text-sm">{resource.title}</p>
                                        <p className="text-gray-600 text-xs mt-1">{resource.description}</p>
                                        {resource.tags && resource.tags.length > 0 && (
                                          <div className="flex gap-2 mt-2 flex-wrap">
                                            {resource.tags.map((tag, tagIdx) => (
                                              <span key={tagIdx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                {tag}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Start New Query
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Traditional Search Results */}
          {showSearch && !aiMode && searchResults.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${aiMode ? 'text-white' : 'text-gray-900'}`}>
                  {aiMode ? 'AI-Powered Results' : 'Search Results'}
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
                    <span className="text-red-500">Play</span> YouTube Videos
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
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${aiMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'}`}>YouTube</span>
                              </div>
                              <h3 className={`text-lg font-semibold mb-2 transition ${aiMode ? 'text-white group-hover:text-red-300' : 'text-gray-900 group-hover:text-red-600'} line-clamp-2`}>{result.title}</h3>
                              <p className={`text-sm mb-4 line-clamp-2 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>{result.description}</p>
                              <a href={result.url || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`text-sm font-medium hover:underline inline-flex items-center gap-1 ${aiMode ? 'text-red-400' : 'text-red-600'}`}>Watch Video</a>
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
                    <span className="text-blue-500">Web</span> Web Resources
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
                            <p className={`text-sm mb-4 line-clamp-3 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}> {result.description}</p>
                            <a href={result.url || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`text-sm font-medium hover:underline inline-flex items-center gap-1 ${aiMode ? 'text-blue-400' : 'text-blue-600'}`}>Read More</a>
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
                <h2 className={`text-2xl font-bold mb-2 ${aiMode ? 'text-gray-900' : 'text-gray-900'}`}>
                  {aiMode ? 'AI-Curated Recommendations' : 'Recommended for You'}
                </h2>
                <p className={`mb-6 ${aiMode ? 'text-gray-600' : 'text-gray-600'}`}>Based on your education level and interests</p>
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
                        url: rec.url || '',
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
                            aiMode ? 'bg-white border border-gray-100 hover:border-purple-300' : 'bg-white border border-gray-100 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${aiMode ? 'bg-gradient-to-br from-lavender-500 to-lightgray-500' : 'bg-gradient-to-br from-lavender-500 to-lightgray-500'}`}>📚</div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${aiMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-100 text-purple-700'}`}>{rec.category || 'Recommended'}</span>
                          </div>
                          <h3 className={`text-lg font-semibold mb-2 transition ${aiMode ? 'text-gray-900 group-hover:text-purple-600' : 'text-gray-900 group-hover:text-purple-600'}`}>{rec.title}</h3>
                          <p className={`text-sm mb-3 line-clamp-2 ${aiMode ? 'text-gray-600' : 'text-gray-600'}`}>{rec.description}</p>
                          <div className={`flex items-center gap-2 text-xs ${aiMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
                      <p className={aiMode ? 'text-gray-600' : 'text-gray-600'}>
                        We're building your personalized recommendations...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {recentSearches.length > 0 && (
                <div className="mb-12">
                  <h2 className={`text-2xl font-bold mb-6 ${aiMode ? 'text-gray-900' : 'text-gray-900'}`}>
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
                            ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {search.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Bot - Professional UI */}
              <div className="rounded-2xl p-6 shadow-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    E
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">AI Chat Assistant</h2>
                    <p className="text-sm text-gray-500">Your dedicated learning companion</p>
                  </div>
                </div>
                <div className="h-80 bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto mb-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-16 flex flex-col items-center">
                      
                      <p className="text-sm">Start a conversation about your learning journey</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {msg.role === 'user' ? 'You' : 'Assistant'}
                          </span>
                          {msg.role !== 'user' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl shadow-sm max-w-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">Assistant</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">Assistant is typing...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2 border border-gray-200 rounded-xl p-2 bg-white">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg placeholder-gray-500"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatLoading}
                    className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors rounded-lg"
                  >
                    <Send size={18} />
                  </button>
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
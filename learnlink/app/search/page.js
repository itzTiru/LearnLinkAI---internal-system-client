'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ThreeScene from '../../components/ThreeScene';
import { useSearchParams } from "next/navigation";


export default function EducationSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState('all');
  const [aiMode, setAiMode] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [voiceCount, setVoiceCount] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const threeSceneRef = useRef(null);

  
  // Load counters from localStorage when the page opens
  useEffect(() => {
    setSearchCount(0);
    setVoiceCount(0);
  }, []);

  // ✅ Auto-fill from ?q= and trigger search
  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      handleSearch(q);
      // Add blue glow to input
      const input = document.getElementById("searchInput");
      if (input) {
        input.classList.add("ring-2", "ring-blue-400", "shadow-blue-200");
        setTimeout(() => {
          input.classList.remove("ring-2", "ring-blue-400", "shadow-blue-200");
        }, 1500);
      }
    }
  }, [searchParams]);


  const cleanTranscript = (text) => {
    return text
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const handleSearch = async (customQuery) => {
    const q = cleanTranscript(customQuery ?? query);
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const endpoint = aiMode
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/aiinfo`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`;
      const response = await axios.post(endpoint, {
        query: q,
        max_results: 10,
        platforms: ['web', 'youtube'],
      });
      setResults(response.data.results || []);

      // Update search count
      const updated = searchCount + 1;
      setSearchCount(updated);

    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    }
    setLoading(false);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) handleSearch();
      else setResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, aiMode]);

  const toggleAiMode = () => {
    setIsFading(true);
    setTimeout(() => {
      setAiMode((prev) => !prev);
      setIsFading(false);
    }, 300);
  };

  // -------------------
  // Voice Recording
  // -------------------
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
            const resp = await axios.post(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/transcribe`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            let transcript = resp.data.text || '';
            transcript = cleanTranscript(transcript);
            setQuery(transcript);
            handleSearch(transcript);
            // Update voice count
            const updated = voiceCount + 1;
            setVoiceCount(updated);

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

  const recommendations = [
    { title: 'Beginner Python Tutorial', platform: 'youtube', description: 'Learn Python basics with hands-on examples.' },
    { title: 'Introduction to React', platform: 'web', description: 'Master React for building modern web apps.' },
    { title: 'Machine Learning Basics', platform: 'youtube', description: 'Understand core ML concepts.' },
    { title: 'Web Development Fundamentals', platform: 'web', description: 'Build your first website from scratch.' },
  ];

  return (
    <div className="relative min-h-screen" style={{ willChange: 'contents' }}>
      <div
        ref={threeSceneRef}
        className={`fixed inset-0 z-0 transition-opacity duration-300 ${aiMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <ThreeScene />
      </div>

      <div
        className={`relative z-10 min-h-screen p-6 transition-opacity duration-300 ${aiMode ? 'bg-transparent text-white' : 'bg-gray-50 text-gray-900'} ${isFading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            {aiMode ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
                AI-Powered Knowledge Hub
              </span>
            ) : 'Educational Content Search'}
          </h1>
          <p className={`text-lg ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {aiMode
              ? <>Unlock a universe of tutorials, courses, and insights with AI precision.<br /><span className="italic text-sm text-blue-300">Navigate the cosmos of learning!</span></>
              : <>Discover tutorials, courses, and resources to enhance your learning.<br /><span className="italic text-sm">Explore a wide range of topics from programming to science!</span></>}
          </p>
        </div>

        {/* Search bar with mic and AI toggle */}

        <div className="flex justify-center mb-8 relative">
          <div className="relative w-full max-w-2xl flex items-center gap-3">
            {/* Search Input */}
            <input
              id="searchInput"
              type="text"
              placeholder={aiMode ? '🔍 Search the knowledge galaxy (e.g., AI, Quantum)' : '🔍 Search for tutorials (e.g., Python, React)'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`flex-1 px-6 py-4 rounded-full border shadow-lg text-lg ${aiMode ? 'border-blue-500 bg-gray-800/80 text-white backdrop-blur-sm' : 'border-blue-500 bg-white text-gray-900'
                } focus:ring-2 focus:outline-none transition-all duration-300 focus:ring-blue-500`}
            />


            {/* Mic Button */}
            <button
              onClick={handleMicClick}
              className={`relative p-4 rounded-full shadow-md transition-all duration-300 ${recording
                ? 'bg-blue-700 hover:bg-blue-800 text-white animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
                } flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
              title={recording ? 'Stop listening' : 'Start voice input'}
              aria-label={recording ? 'Stop voice input' : 'Start voice input'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke={recording ? "red" : "currentColor"}   // 🔹 Icon turns red when recording
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              {recording && (
                <span className="absolute -bottom-10 text-sm text-blue-100 bg-blue-700 px-2 py-1 rounded-md">
                  Listening...
                </span>
              )}
            </button>

            {/* AI Mode Toggle */}
            <button
              onClick={toggleAiMode}
              className={`px-4 py-2 text-white rounded-full text-lg transition-all duration-200 hover:scale-105 ${aiMode
                ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
              AI {aiMode ? 'On' : 'Off'}
            </button>
          </div>
        </div>


        {/* Results & Recommendations */}
        {!aiMode && !loading && results.length === 0 && (
          <div className="max-w-4xl mx-auto mb-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Recommended Learning Resources</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => setQuery(cleanTranscript(rec.title))}
                  className="p-4 rounded-lg bg-white hover:bg-gray-100 shadow-md cursor-pointer transition-transform duration-200 hover:scale-102"
                >
                  <h3 className="text-lg font-medium">{rec.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{rec.description} ({rec.platform})</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className={`text-center ${aiMode ? 'text-red-400' : 'text-red-600'} mb-6`}>{error}</p>}

        {/* Display search results */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {loading ? (
            <div className="col-span-full text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-blue-500">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            results
              .filter((result) => platform === 'all' || result.platform === platform)
              .map((result, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${aiMode ? 'bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm' : 'bg-white hover:bg-gray-50'
                    } animate-fadeIn`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <h2 className={`text-xl font-semibold mb-2 ${aiMode ? 'text-white' : 'text-gray-900'}`}>{result.title}</h2>
                  <p className={`mb-4 line-clamp-3 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>{result.description}</p>
                  <a
                    href={result.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-500 hover:underline"
                  >
                    View {result.platform === 'youtube' ? 'Video' : 'Resource'}
                  </a>
                </div>
              ))
          ) : (
            <p className="text-center col-span-full text-gray-600">
              ❌ No results found for "{query || 'all'}"
            </p>
          )}
        </div>

        {/* Filter section */}

        <div className="max-w-lg mx-auto mt-8 flex items-center gap-4">
          <label htmlFor="platform-filter" className={`font-semibold ${aiMode ? 'text-white' : 'text-gray-900'}`}>Filter Platform:</label>
          <select
            id="platform-filter"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={`px-3 py-2 rounded-md border shadow-md transition-all duration-300 focus:outline-none border-blue-500 focus:ring-2 focus:ring-blue-500 ${aiMode
              ? 'bg-gray-800/80 text-white backdrop-blur-sm'
              : 'bg-white text-gray-900'
              }`}
          >
            <option value="all">All</option>
            <option value="youtube">YouTube</option>
            <option value="web">Web</option>
          </select>
        </div>

        <style jsx>{`
          @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
        `}</style>
      </div>
    </div>
  );
}

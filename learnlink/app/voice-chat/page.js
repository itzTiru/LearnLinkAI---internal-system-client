'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ThreeScene from '../../components/ThreeScene';

export default function VoiceSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const threeSceneRef = useRef(null);

  // --- Voice recording handlers ---
  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      setRecording(false);
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioChunksRef.current = [];

      // Send audio to FastAPI /transcribe
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.wav');

      try {
        setLoading(true);
        const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transcribe`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const transcriptText = res.data.text || '';
        setQuery(transcriptText);

        // Auto-search after transcription
        handleSearch(transcriptText);
      } catch (err) {
        console.error(err);
        setError('Error transcribing voice');
      } finally {
        setLoading(false);
      }
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // --- Search handler ---
  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const endpoint = aiMode
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/aiinfo`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`;

      const res = await axios.post(endpoint, {
        query: searchQuery,
        max_results: 10,
        platforms: ['web', 'youtube']
      });

      setResults(res.data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch search results.');
    } finally {
      setLoading(false);
    }
  };

  // --- AI toggle with fade animation ---
  const toggleAiMode = () => {
    setIsFading(true);
    setTimeout(() => {
      setAiMode((prev) => !prev);
      setIsFading(false);
    }, 300);
  };

  return (
    <div className="relative min-h-screen">
      {/* 3D Background Scene */}
      <div
        ref={threeSceneRef}
        className={`fixed inset-0 z-0 transition-opacity duration-300 ${aiMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <ThreeScene />
      </div>

      <div
        className={`relative z-10 min-h-screen p-6 transition-opacity duration-300 ${aiMode ? 'bg-transparent text-white' : 'bg-gray-50 text-gray-900'
          } ${isFading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            {aiMode ? 'AI Knowledge Hub' : 'Voice-Powered Search'}
          </h1>
          <p className={`text-lg ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {aiMode ? 'Search with AI insights.' : 'Speak to search tutorials, courses, and more!'}
          </p>
        </div>

        {/* Search + Voice */}
        <div className="max-w-lg mx-auto flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search by voice or type..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`flex-1 px-4 py-3 rounded-xl border shadow-lg ${aiMode ? 'border-gray-600 bg-gray-800/80 text-white' : 'border-gray-300 bg-white text-gray-900'
              } focus:ring-2 focus:outline-none ${aiMode ? 'focus:ring-purple-500' : 'focus:ring-blue-500'}`}
          />
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-xl ${recording ? 'bg-red-500 animate-pulse' : 'bg-green-500 hover:bg-green-600'
              } text-white font-semibold`}
          >
            {recording ? 'Recording...' : '🎤'}
          </button>
          <button
            onClick={toggleAiMode}
            className={`px-4 py-2 rounded-xl ${aiMode ? 'bg-purple-600' : 'bg-blue-500'} text-white font-semibold`}
          >
            AI {aiMode ? 'On' : 'Off'}
          </button>
        </div>

        {/* Error Message */}
        {error && <p className={`text-center ${aiMode ? 'text-red-400' : 'text-red-600'} mb-4`}>{error}</p>}

        {/* Search Results */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {loading ? (
            <div className="col-span-full text-center">
              <div className={`inline-block w-10 h-10 border-4 ${aiMode ? 'border-purple-500' : 'border-blue-500'} border-t-transparent rounded-full animate-spin`}></div>
              <p className={`mt-2 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>Searching...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((res, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${aiMode ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white hover:bg-gray-50'
                  } animate-fadeIn`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h2 className={`text-xl font-semibold mb-2 ${aiMode ? 'text-white' : 'text-gray-900'}`}>{res.title}</h2>
                <p className={`mb-4 line-clamp-3 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>{res.description}</p>
                <a
                  href={res.url ? res.url.replace(/^\[|]$/g, '').replace('https:/', 'https://') : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-medium hover:underline ${aiMode ? 'text-purple-400' : 'text-blue-500'}`}
                >
                  View {res.platform === 'youtube' ? 'Video' : 'Resource'}
                </a>
              </div>
            ))
          ) : (
            <p className={`text-center col-span-full ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>
              ❌ No results found
            </p>
          )}
        </div>

        {/* Animations */}
        <style jsx>{`
          @keyframes fadeIn { from {opacity: 0; transform: translateY(10px);} to {opacity: 1; transform: translateY(0);} }
          .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
          .animate-pulse { animation: pulse 2s infinite; }
          @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
        `}</style>
      </div>
    </div>
  );
}
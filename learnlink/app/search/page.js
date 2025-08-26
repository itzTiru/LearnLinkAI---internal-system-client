'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function EducationSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState('all');
  const [aiMode, setAiMode] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = aiMode 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/aiinfo`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`;
      const response = await axios.post(endpoint, {
        query,
        max_results: 10,
        platforms: ['youtube', 'web'],
      });
      setResults(response.data.results || []);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, aiMode]); // Add aiMode to trigger search on toggle

  const toggleAiMode = () => {
    setAiMode(!aiMode);
  };

  const recommendations = [
    { title: 'Beginner Python Tutorial', platform: 'youtube', description: 'Learn Python basics with hands-on examples.' },
    { title: 'Introduction to React', platform: 'web', description: 'Master React for building modern web apps.' },
    { title: 'Machine Learning Basics', platform: 'youtube', description: 'Understand core ML concepts.' },
    { title: 'Web Development Fundamentals', platform: 'web', description: 'Build your first website from scratch.' },
  ];

  return (
    <div
      className={`min-h-screen p-6 transition-all duration-300 ${
        aiMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Educational Content Search</h1>
        <p className={`text-lg ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Discover tutorials, courses, and resources to enhance your learning.
          <br />
          <span className="italic text-sm">
            Explore a wide range of topics from programming to science!
          </span>
        </p>
      </div>

      <div className="max-w-lg mx-auto mb-8 relative">
        <input
          type="text"
          placeholder="🔍 Search for tutorials (e.g., Python, React)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border ${
            aiMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
          } focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300`}
        />
        <button
          onClick={toggleAiMode}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-transform duration-200 hover:scale-105 text-sm"
        >
          AI {aiMode ? 'On' : 'Off'}
        </button>
      </div>

      {!loading && results.length === 0 && (
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-xl font-semibold mb-4">Recommended Learning Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                onClick={() => setQuery(rec.title)}
                className={`p-4 rounded-lg cursor-pointer transition-transform duration-200 hover:scale-102 ${
                  aiMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } shadow-md`}
              >
                <h3 className="text-lg font-medium">{rec.title}</h3>
                <p className={`text-sm ${aiMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                  {rec.description} ({rec.platform})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className={`text-center ${aiMode ? 'text-red-400' : 'text-red-600'} mb-6`}>
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {loading ? (
          <div className="col-span-full text-center">
            <div
              className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            ></div>
            <p className={`mt-2 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>Searching...</p>
          </div>
        ) : results.length > 0 ? (
          results
            .filter((result) => platform === 'all' || result.platform === platform)
            .map((result, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  aiMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                } animate-fadeIn`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h2 className="text-xl font-semibold mb-2">{result.title}</h2>
                <p className={`mb-4 line-clamp-3 ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {result.description}
                </p>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm font-medium hover:underline"
                >
                  View {result.platform === 'youtube' ? 'Video' : 'Resource'}
                </a>
              </div>
            ))
        ) : (
          <p className={`text-center col-span-full ${aiMode ? 'text-gray-300' : 'text-gray-600'}`}>
            ❌ No results found for "{query || 'all'}"
          </p>
        )}
      </div>

      <div className="max-w-lg mx-auto mt-8 flex items-center gap-4">
        <label htmlFor="platform-filter" className="font-semibold">
          Filter Platform:
        </label>
        <select
          id="platform-filter"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={`px-3 py-2 rounded-md border ${
            aiMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
          } focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300`}
        >
          <option value="all">All</option>
          <option value="youtube">YouTube</option>
          <option value="web">Web</option>
        </select>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
}
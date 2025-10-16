// SearchResultDetail.jsx
'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SearchResultDetail() {
  const router = useRouter();
  const { page, index, title, url, platform, aiMode } = router.query;
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (title && url && platform) {
      setResult({ title, url, platform });
    } else {
      router.back();
    }
  }, [router.query, router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  const isAiMode = aiMode === 'true';

  return (
    <div className={`min-h-screen py-12 px-6 ${isAiMode ? 'bg-transparent text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Back to Results
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              platform === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {platform === 'youtube' ? '▶ YouTube' : '🌐 Web'}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-gray-900">{result.title}</h1>

        {result.platform === 'youtube' && (
          <div className="mb-6">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${result.url.match(/(?:v=)([^&]+)/)?.[1] || ''}`}
              title={result.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        )}

        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {result.platform === 'youtube' ? 'Watch on YouTube →' : 'Open Original Source →'}
        </a>
      </div>
    </div>
  );
}
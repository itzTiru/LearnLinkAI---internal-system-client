'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [message, setMessage] = useState("Loading...");
  const [dotStyles, setDotStyles] = useState([]);

  // Fetch message from FastAPI backend
  useEffect(() => {
    fetch("http://localhost:8000/api/message")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => {
        console.error("Error fetching message:", error);
        setMessage("Failed to connect to backend");
      });
  }, []);

  // Generate dot styles on client mount to avoid SSR mismatch
  useEffect(() => {
    const styles = [...Array(30)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
    }));
    setDotStyles(styles);
  }, []);

  return (
    <div className="min-h-screen bg-white-100 text-gray-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Galaxy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-purple-100/40 to-white/60 animate-starfield-enhanced z-0"></div>

      {/* Blinking Starry Dots Effect */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {dotStyles.map((style, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-purple-500/50 rounded-full animate-blink-star"
            style={style}
          ></div>
        ))}
      </div>

      {/* Pulsing Orbit Lines */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none z-20">
        <div className="flex space-x-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-10 bg-gradient-to-t from-blue-300/60 to-purple-300/60 animate-orbit-pulse-enhanced"
              style={{ animationDelay: `${i * 0.3}s`, opacity: 0.9 - i * 0.15 }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-30 flex flex-col items-center justify-center text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 animate-text-shimmer-enhanced">
          {message}
        </h1>
        <p className="text-lg md:text-xl text-gray-600/90 max-w-md animate-fade-in-enhanced">
          Discover cutting-edge learning experiences
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/upload-pdf"
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 hover:scale-105 transition-all duration-300 animate-button-glow-enhanced shadow-md"
          >
            Upload PDF
          </Link>
          <Link
            href="/search"
            className="px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-400 hover:scale-105 transition-all duration-300 animate-button-glow-enhanced shadow-md"
            style={{ animationDelay: '0.2s' }}
          >
            Search
          </Link>
          <Link
            href="/voice-chat"
            className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-400 hover:scale-105 transition-all duration-300 animate-button-glow-enhanced shadow-md"
            style={{ animationDelay: '0.4s' }}
          >
            Voice Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
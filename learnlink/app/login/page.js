"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [sessionManagement, setSessionManagement] = useState(null);

  // Dynamically import session-management on client side
  useEffect(() => {
    import("../../lib/session-management").then((mod) => {
      setSessionManagement(mod.default || mod); // Handle default export
    });
  }, []);

  // Auto-redirect if already logged in
// Auto-redirect useEffect
useEffect(() => {
  const checkAuth = () => {
    if (sessionManagement && sessionManagement.isAuthenticated()) {
      router.replace("/search");  // Use replace
    }
  };
  if (sessionManagement) {
    // Delay to avoid race with import
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }
}, [sessionManagement, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!sessionManagement) {
      setError("Session management not loaded yet.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionManagement.setToken(data.token); // Now this works!
        router.push("/search");
      } else {
        setError(data.detail || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Signing in...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <img
            src="https://via.placeholder.com/40"
            alt="Logo"
            className="h-10 mr-2"
          />
          <h1 className="text-2xl font-semibold">Sign In</h1>
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
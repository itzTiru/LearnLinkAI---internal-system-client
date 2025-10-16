"use client";

import { useRef, useState } from "react";

export default function PdfAnalyzerPage() {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Select file
  const handleSelectFile = () => fileInputRef.current?.click();

  // Upload file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setFileURL(URL.createObjectURL(file)); // For PDF preview
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload-pdf/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to process PDF");
      const data = await res.json();

      // Convert strings to arrays
      if (typeof data.keywords === "string")
        data.keywords = data.keywords.split(",").map((k) => k.trim());
      if (typeof data.search_queries === "string")
        data.search_queries = data.search_queries
          .split(";")
          .map((q) => q.trim())
          .filter(Boolean);

      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to process PDF.");
    } finally {
      setLoading(false);
    }
  };

  // Difficulty badge color
  const difficultyColor = (level) => {
    switch (level) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Highlight keywords
  const highlightKeywords = (summary, keywords) => {
    if (!keywords?.length) return summary;
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    const parts = summary.split(regex);

    return parts.map((part, idx) => {
      if (keywords.some((k) => k.toLowerCase() === part.toLowerCase())) {
        return (
          <span
            key={idx}
            className="bg-yellow-100 font-semibold text-gray-900 px-1 rounded cursor-pointer hover:bg-yellow-200"
            onClick={() =>
              window.open(`https://www.google.com/search?q=${part}`, "_blank")
            }
            title="Search this keyword on Google"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Voice reading
  const toggleVoice = () => {
    if (!result?.summary) return;
    if (!window.speechSynthesis) {
      alert("Your browser does not support voice reading.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(result.summary);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Ask question
  const handleAskQuestion = async () => {
    if (!question.trim() || !result?.summary) return;
    setChatLoading(true);
    setAnswer("");

    try {
      const res = await fetch("http://localhost:8000/ask-pdf/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.summary, question }),
      });

      if (!res.ok) throw new Error("Failed to get answer");
      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      console.error(err);
      setAnswer(" Failed to get an answer. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fbff] flex flex-col items-center py-8 px-4">
      <div className="max-w-7xl w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="text-center py-6 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h1 className="text-3xl font-bold"> AI PDF Reader & Analyzer</h1>
          <p className="text-sm opacity-90">
            Upload a PDF to analyze difficulty, extract keywords, and get a smart summary
          </p>
        </div>

        {/* Before Upload */}
        {!result && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleSelectFile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition"
            >
              {loading ? "Analyzing..." : "Upload PDF"}
            </button>
            {fileName && <p className="text-blue-600 font-medium"> {fileName}</p>}
          </div>
        )}

        {/* After Upload — Split View */}
        {result && (
          <div className="flex flex-col lg:flex-row">
            {/* LEFT: PDF Viewer */}
            <div className="w-full lg:w-1/2 border-r border-gray-200 bg-gray-50">
              <div className="p-4">
                <h2 className="font-semibold text-lg text-blue-600 mb-2">
                   Uploaded PDF
                </h2>
                <iframe
                  src={fileURL}
                  className="w-full h-[80vh] border rounded-lg shadow-sm"
                ></iframe>
              </div>
            </div>

            {/* RIGHT: Analysis Results */}
            <div className="w-full lg:w-1/2 p-6 space-y-6 overflow-y-auto max-h-[85vh]">
              {/* Difficulty */}
              <div
                className={`inline-block px-4 py-2 rounded-full font-semibold ${difficultyColor(
                  result.difficulty
                )}`}
              >
                Difficulty: {result.difficulty}
              </div>

              {/* Keywords */}
              {result.keywords?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg text-blue-500 mb-2">
                    Keywords
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((k, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 hover:bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm shadow-sm cursor-pointer"
                        onClick={() =>
                          window.open(`https://www.google.com/search?q=${k}`, "_blank")
                        }
                      >
                        🔍 {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Queries */}
              {result.search_queries?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg text-blue-500 mb-2">
                    Suggested Search Queries
                  </h2>
                  <div className="flex flex-col gap-2">
                    {result.search_queries.map((query, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          window.open(`https://www.google.com/search?q=${query}`, "_blank")
                        }
                        className="bg-blue-50 hover:bg-blue-100 text-blue-900 px-3 py-2 rounded-lg shadow-sm border-l-4 border-blue-400 cursor-pointer transition"
                      >
                         {query}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {result.summary && (
                <div>
                  <h2 className="font-semibold text-lg text-blue-500 mb-2">
                    Summary
                  </h2>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    {highlightKeywords(result.summary, result.keywords)}
                  </p>

                  {/* Word count, read time, voice */}
                  <div className="mt-4 flex gap-4 items-center">
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-gray-800 font-medium">
                       Words: {result.summary.trim().split(/\s+/).length}
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-gray-800 font-medium">
                      ⏱ {(result.summary.trim().split(/\s+/).length / 120).toFixed(1)}{" "}
                      min read
                    </div>
                    <button
                      onClick={toggleVoice}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isSpeaking
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      {isSpeaking ? "🔇 Stop" : "🔊 Listen"}
                    </button>
                  </div>
                </div>
              )}

              {/* Q&A */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="font-semibold text-lg text-blue-500 mb-3">
                   Ask Questions About This PDF
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask something about the document..."
                    className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={chatLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    {chatLoading ? "Thinking..." : "Ask"}
                  </button>
                </div>
                {answer && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{answer}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from "next/link";

export default function UploadPDF() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-200">Upload PDF</h1>
      <p className="text-lg mb-4 text-blue-100/80">Upload your PDF files here (feature under development).</p>
      <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-300">
        Back to Home
      </Link>
    </div>
  );
}
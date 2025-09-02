'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);

  const searchWithTranscription = async (query) => {
    try {
      console.log(`Searching for: "${query}"`);
      const response = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          max_results: 5,
          platforms: ['web'] // Use 'web' only until YouTube is fixed
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Search results:', data.results);
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch search results');
    }
  };

  const convertTo16kHzMono = async (inputBuffer) => {
    try {
      audioContextRef.current = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      const audioContext = audioContextRef.current;
      const sourceBuffer = await audioContext.decodeAudioData(inputBuffer);
      
      const offlineContext = new OfflineAudioContext({
        numberOfChannels: 1,
        length: Math.floor(sourceBuffer.duration * 16000),
        sampleRate: 16000
      });

      const source = offlineContext.createBufferSource();
      source.buffer = sourceBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();
      const wavBuffer = await audioBufferToWav(renderedBuffer);
      return new Uint8Array(wavBuffer);
    } catch (err) {
      console.error('Audio conversion error:', err);
      throw err;
    }
  };

  // Convert AudioBuffer to WAV (simplified, requires implementation)
  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    let offset = 0;
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2; // PCM format
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numChannels * 2, true); offset += 4;
    view.setUint16(offset, numChannels * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, buffer.length * numChannels * 2, true); offset += 4;

    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      view.setInt16(offset, channelData[i] * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  };

  const startRecording = async () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/transcribe');
      
      wsRef.current.onopen = () => {
        console.log('Connected to transcription server');
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        if (data.event === 'begin') {
          setSessionId(data.session_id);
        } else if (data.event === 'turn') {
          console.log(`Received transcript: "${data.transcript}", end_of_turn: ${data.end_of_turn}`);
          setTranscriptions((prev) => [
            ...prev,
            { text: data.transcript || '(Empty transcription)', endOfTurn: data.end_of_turn }
          ]);
          if (data.end_of_turn && data.transcript) {
            searchWithTranscription(data.transcript);
          }
        } else if (data.event === 'terminated') {
          console.log(`Session terminated: ${data.audio_duration_seconds}s`);
          setTranscriptions((prev) => [
            ...prev,
            { text: `Session ended: ${data.audio_duration_seconds}s processed`, endOfTurn: true }
          ]);
        } else if (data.event === 'error') {
          console.error('AssemblyAI error:', data.message);
          setError(data.message);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsRecording(false);
        setSessionId(null);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection failed');
        setIsRecording(false);
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      console.log('Microphone stream acquired:', streamRef.current.getAudioTracks());
      audioChunksRef.current = [];
      
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('audio/webm;codecs=opus not supported, trying audio/webm');
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('audio/webm not supported, trying audio/wav');
        mimeType = 'audio/wav';
      }
      console.log(`Using mimeType: ${mimeType}`);

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType,
        audioBitsPerSecond: 16000 * 16,
      });

      mediaRecorderRef.current.ondataavailable = async (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          let chunk = e.data;
          if (mimeType !== 'audio/webm;codecs=opus') {
            try {
              const converted = await convertTo16kHzMono(await e.data.arrayBuffer());
              chunk = new Blob([converted], { type: 'audio/wav' });
              console.log(`Converted audio chunk to WAV: ${chunk.size} bytes`);
            } catch (err) {
              console.error('Conversion error:', err);
              return;
            }
          }
          console.log(`Sending audio chunk: ${chunk.size} bytes`);
          wsRef.current.send(chunk);
          audioChunksRef.current.push(e.data); // Store original for playback
        } else {
          console.log(`No audio data or WebSocket closed: size=${e.data.size}, readyState=${wsRef.current?.readyState}`);
        }
      };

      mediaRecorderRef.current.onstart = () => {
        console.log('MediaRecorder started');
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder stopped');
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone or connect to server');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsRecording(false);
    setSessionId(null);
  };

  const testWithWavFile = async () => {
    try {
      const response = await fetch('/test.wav');
      if (!response.ok) {
        throw new Error(`Failed to fetch WAV file: ${response.status}`);
      }
      const audioBlob = await response.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const converted = await convertTo16kHzMono(arrayBuffer);
      const buffer = new Uint8Array(converted);

      wsRef.current = new WebSocket('ws://localhost:8000/ws/transcribe');
      
      wsRef.current.onopen = () => {
        console.log('Connected to transcription server for WAV test');
        setError(null);
        let offset = 0;
        const chunkSize = 4096;
        const interval = setInterval(() => {
          if (offset >= buffer.length || wsRef.current.readyState !== WebSocket.OPEN) {
            clearInterval(interval);
            wsRef.current.close();
            return;
          }
          const chunk = buffer.slice(offset, offset + chunkSize);
          console.log(`Sending WAV chunk: ${chunk.length} bytes`);
          wsRef.current.send(chunk);
          offset += chunkSize;
        }, 250);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        if (data.event === 'begin') {
          setSessionId(data.session_id);
        } else if (data.event === 'turn') {
          console.log(`Received transcript: "${data.transcript}", end_of_turn: ${data.end_of_turn}`);
          setTranscriptions((prev) => [
            ...prev,
            { text: data.transcript || '(Empty transcription)', endOfTurn: data.end_of_turn }
          ]);
          if (data.end_of_turn && data.transcript) {
            searchWithTranscription(data.transcript);
          }
        } else if (data.event === 'terminated') {
          console.log(`Session terminated: ${data.audio_duration_seconds}s`);
          setTranscriptions((prev) => [
            ...prev,
            { text: `Session ended: ${data.audio_duration_seconds}s processed`, endOfTurn: true }
          ]);
        } else if (data.event === 'error') {
          console.error('AssemblyAI error:', data.message);
          setError(data.message);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsRecording(false);
        setSessionId(null);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection failed');
      };

      setIsRecording(true);
    } catch (err) {
      console.error('Error testing WAV file:', err);
      setError('Failed to load WAV file');
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Real-Time Speech-to-Text</h1>
        
        <div className="flex justify-center mb-4 space-x-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-lg font-semibold text-white ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={testWithWavFile}
            className="px-4 py-2 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600"
          >
            Test with WAV
          </button>
          <button
            onClick={() => searchWithTranscription("test transcription")}
            className="px-4 py-2 rounded-lg font-semibold text-white bg-purple-500 hover:bg-purple-600"
          >
            Test Search
          </button>
        </div>

        {audioUrl && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Recorded Audio</h2>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {sessionId && (
          <p className="text-sm text-gray-600 mb-4">Session ID: {sessionId}</p>
        )}

        {error && (
          <p className="text-red-500 mb-4">{error}</p>
        )}

        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Transcriptions</h2>
          {transcriptions.length === 0 ? (
            <p className="text-gray-500">No transcriptions yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {transcriptions.map((trans, index) => (
                <li
                  key={index}
                  className={`p-2 rounded ${
                    trans.endOfTurn ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {trans.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Search Results</h2>
          {searchResults.length === 0 ? (
            <p className="text-gray-500">No search results yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <li key={index} className="p-2 bg-gray-100 rounded">
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                    {result.title}
                  </a>
                  <p>{result.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

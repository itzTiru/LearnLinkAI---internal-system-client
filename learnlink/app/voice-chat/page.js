'use client';
import { useState, useRef } from 'react';
import axios from 'axios';

export default function VoicePage() {
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioChunksRef.current = [];

      // Send audio directly to FastAPI /transcribe
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      try {
        const res = await axios.post('http://localhost:8000/transcribe', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setTranscript(res.data.text || 'No transcript received');
      } catch (err) {
        console.error(err);
        setTranscript('Error transcribing audio');
      }
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current.stop();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Voice to Text</h1>
      <button
        onClick={recording ? stopRecording : startRecording}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {recording ? 'Stop' : 'Start'} Recording
      </button>
      <p className="mt-4 font-mono">Transcript: {transcript}</p>
    </div>
  );
}

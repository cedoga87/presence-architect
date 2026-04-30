'use client';

import { useState, useRef, useCallback } from 'react';

interface VideoInputProps {
  onVideoReady: (data: { filename?: string; videoUrl?: string; originalName?: string }) => void;
}

export default function VideoInput({ onVideoReady }: VideoInputProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedFile(file.name);
      onVideoReady({ filename: data.filename, originalName: data.originalName });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onVideoReady]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlSubmit = () => {
    if (!urlValue.trim()) return;
    const url = urlValue.trim();
    const isLoom = url.includes('loom.com');
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    if (!isLoom && !isYoutube && !url.startsWith('http')) {
      setUploadError('Please enter a valid Loom or YouTube URL');
      return;
    }
    setUploadError('');
    onVideoReady({ videoUrl: url });
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            mode === 'upload' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📁 Upload Video
        </button>
        <button
          onClick={() => setMode('url')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            mode === 'url' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔗 Loom / YouTube URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Uploading...</p>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">✅</span>
              <p className="text-gray-800 font-medium text-sm">{uploadedFile}</p>
              <p className="text-gray-400 text-xs">Click to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">🎬</span>
              <div>
                <p className="text-gray-700 font-medium">Drop your video here</p>
                <p className="text-gray-400 text-sm mt-1">or click to browse · MP4, WebM, MOV, AVI · max 100 MB</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="https://www.loom.com/share/... or https://youtu.be/..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={!urlValue.trim()}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            <strong>Note:</strong> For Loom/YouTube URLs, you&apos;ll need to paste the transcript manually below since direct audio extraction is not available in this app.
          </div>
          {urlValue && !uploadError && (
            <p className="text-xs text-green-600">✓ URL set — proceed to add your transcript below</p>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
      )}
    </div>
  );
}

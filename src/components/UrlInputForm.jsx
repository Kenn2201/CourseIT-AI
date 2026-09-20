import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useModalViewport from './useModalViewport';
import { Sparkles, ArrowRight, Link2, Gamepad2, Layers, Radio, Code2, UploadCloud, FileText, CheckCircle, AlertCircle, RefreshCw, Lock, Boxes, Flame, Container } from 'lucide-react';
import { extractTextFromFile } from '../lib/ocr';
import { readApiResponse } from '../lib/api';

import { useUserCredits } from '../context/CreditContext';

const CROSS_DOC_PRESETS = [
  {
    name: 'React 19 Server Actions',
    framework: 'React / Next.js',
    url: 'https://react.dev/reference/rsc/server-components',
    icon: Boxes
  },
  {
    name: 'Godot 4 Signals & Nodes',
    framework: 'Godot Engine',
    url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html',
    icon: Radio
  },
  {
    name: 'Rust Borrowing & Lifetimes',
    framework: 'Rust Lang',
    url: 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html',
    icon: Flame
  },
  {
    name: 'Docker Multi-Stage Builds',
    framework: 'Docker / DevOps',
    url: 'https://docs.docker.com/build/building/multi-stage/',
    icon: Container
  }
];

const MODEL_OPTIONS = [
  { id: 'gemini-flash-lite-latest', label: 'Flash Lite (Fastest)', badge: '0.5 credits', publicAllowed: true },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Lite', badge: '1.0 credit', publicAllowed: false },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', badge: '2.0 credits', publicAllowed: false },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', badge: '5.0 credits', publicAllowed: false }
];

export default function UrlInputForm({ onSubmit, isLoading, quota, isAdmin, isAuthenticated, onOpenAdmin, isPending = false }) {
  const { credits, formatCredits } = useUserCredits();
  const [inputMode, setInputMode] = useState('url'); // 'url' | 'document'
  const [url, setUrl] = useState('');
  const [learningTopic, setLearningTopic] = useState('');
  const [discoverySeed, setDiscoverySeed] = useState(null);
  const [discoveryCandidates, setDiscoveryCandidates] = useState([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      const saved = localStorage.getItem('courseit_default_model');
      if (saved && (isAuthenticated || saved === 'gemini-flash-lite-latest')) {
        return saved;
      }
    } catch {}
    return 'gemini-flash-lite-latest';
  });
  const [error, setError] = useState('');
  const [ocrProgress, setOcrProgress] = useState(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const trialDialogRef = useModalViewport(showTrialModal, () => setShowTrialModal(false));
  const fileInputRef = useRef(null);
  const modelDropdownRef = useRef(null);

  // Sync with default model preference from settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('courseit_default_model');
      if (saved && (isAuthenticated || saved === 'gemini-flash-lite-latest')) {
        setSelectedModel(saved);
      }
    } catch {}
  }, [isAuthenticated]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If user is not authenticated, lock models to Flash Lite
  useEffect(() => {
    if (!isAuthenticated && selectedModel !== 'gemini-flash-lite-latest') {
      setSelectedModel('gemini-flash-lite-latest');
    }
  }, [isAuthenticated, selectedModel]);

  const guestRemaining = typeof quota?.remaining === 'number'
    ? quota.remaining
    : (typeof quota?.quota_remaining === 'number' ? quota.quota_remaining : null);
  const isGuestExhausted = !isAuthenticated && typeof guestRemaining === 'number' && guestRemaining <= 0;
  const isQuotaUnavailable = !isAdmin && (!quota || (isAuthenticated && !Number.isFinite(credits)));
  const isOutOfQuota = isAuthenticated ? (!isAdmin && Number.isFinite(credits) && credits <= 0) : isGuestExhausted;

  const handleSelectModel = (model) => {
    if (!isAuthenticated && !model.publicAllowed) {
      setShowTrialModal(true);
      setIsModelDropdownOpen(false);
      return;
    }
    setSelectedModel(model.id);
    setIsModelDropdownOpen(false);
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isPending) {
      setError('Your account is pending admin approval. You will receive an email once approved!');
      return;
    }

    if (isQuotaUnavailable) {
      setError('Trial or credit status is unavailable. Refresh and try again.');
      return;
    }

    if (isGuestExhausted) {
      setShowTrialModal(true);
      return;
    }

    if (isOutOfQuota) {
      setError('Generation limit reached. Please request a top-up or create an account for 250 credits.');
      return;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a documentation URL.');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL including https://');
      return;
    }

    // Double check model permission
    const modelToUse = isAuthenticated ? selectedModel : 'gemini-flash-lite-latest';
    onSubmit({ type: 'url', url: trimmed, inputUrl: discoverySeed || trimmed,
      topic: learningTopic.trim(), model: modelToUse,
      visibility: isAuthenticated ? visibility : 'public' });
  };

  const handleDiscover = async () => {
    setError('');
    setDiscoveryCandidates([]);
    if (!url.trim() || !learningTopic.trim()) {
      setError('Enter a documentation URL and a specific topic first.');
      return;
    }
    setDiscoveryLoading(true);
    try {
      const response = await fetch('/api/documentation/discover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), topic: learningTopic.trim() })
      });
      const data = await readApiResponse(response);
      setDiscoveryCandidates(data.candidates || []);
      if (!data.candidates?.length) setError('No matching section was found on this page. Enter a more specific documentation URL.');
      else setDiscoverySeed(data.sourceUrl);
    } catch (err) {
      setError(err.message || 'Could not inspect the documentation sections.');
    } finally { setDiscoveryLoading(false); }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setError('');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e) => {
    setError('');
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isPending) {
      setError('Your account is pending admin approval. You will receive an email once approved!');
      return;
    }

    if (isQuotaUnavailable) {
      setError('Trial or credit status is unavailable. Refresh and try again.');
      return;
    }

    if (isGuestExhausted) {
      setShowTrialModal(true);
      return;
    }

    if (isOutOfQuota) {
      setError('Generation limit reached. Please request a top-up or create an account for 250 credits.');
      return;
    }

    if (!selectedFile) {
      setError('Please select or drop a file to upload.');
      return;
    }

    const isImageFile = selectedFile.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(selectedFile.name);
    if (isAuthenticated && isImageFile && !/\.(png|jpe?g|webp)$/i.test(selectedFile.name)) {
      setError('Private source-image retention supports PNG, JPEG, and WebP. Convert this image before generating.');
      return;
    }
    if (isAuthenticated && isImageFile && selectedFile.size > 4 * 1024 * 1024) {
      setError('The original image must be 4 MB or smaller to save it privately with your course.');
      return;
    }

    try {
      // 1. Run client-side extraction / OCR via Tesseract.js
      const extracted = await extractTextFromFile(selectedFile, (prog) => {
        setOcrProgress(prog);
      });

      // Generation receives extracted text; a signed-in image is uploaded privately after the course is created.
      const modelToUse = isAuthenticated ? selectedModel : 'gemini-flash-lite-latest';
      onSubmit({
        type: 'document',
        title: extracted.title,
        text: extracted.text,
        sourceFile: isAuthenticated && isImageFile ? selectedFile : null,
        model: modelToUse,
        visibility: isAuthenticated ? visibility : 'public'
      });
    } catch (err) {
      setError(err.message || 'Failed to extract text from document.');
    } finally {
      setOcrProgress(null);
    }
  };

  const handlePresetClick = (presetUrl) => {
    if (isQuotaUnavailable) {
      setError('Trial or credit status is unavailable. Refresh and try again.');
      return;
    }
    if (isGuestExhausted) {
      setShowTrialModal(true);
      return;
    }
    setInputMode('url');
    setUrl(presetUrl);
    setDiscoverySeed(null);
    setDiscoveryCandidates([]);
    setError('');
    if (!isOutOfQuota && !isQuotaUnavailable) {
      const modelToUse = isAuthenticated ? selectedModel : 'gemini-flash-lite-latest';
      onSubmit({ type: 'url', url: presetUrl, inputUrl: presetUrl, topic: learningTopic.trim(), model: modelToUse,
        visibility: isAuthenticated ? visibility : 'public' });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setInputMode('url');
              setError('');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              inputMode === 'url'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Web Documentation URL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputMode('document');
              setVisibility('private');
              setError('');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              inputMode === 'document'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document / Scan (OCR)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-400/20 text-indigo-300 font-bold">
              NEW
            </span>
          </button>
        </div>
      </div>

      {/* Main Interactive Form Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 relative shadow-2xl z-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {inputMode === 'url' ? (
          <form onSubmit={handleUrlSubmit} className="space-y-4 relative z-20">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="https://docs.godotengine.org/en/stable/... or any dev docs"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setDiscoverySeed(null); setDiscoveryCandidates([]); }}
                  disabled={isLoading}
                  className="w-full py-3.5 pl-4 pr-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              {/* Model Tier Selector with Cross-out on Locked Models */}
              <div className="relative min-w-[210px]" ref={modelDropdownRef}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="w-full h-full py-3.5 pl-3.5 pr-8 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-white truncate">
                      {MODEL_OPTIONS.find(m => m.id === selectedModel)?.label || 'Flash Lite (Fastest)'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {MODEL_OPTIONS.find(m => m.id === selectedModel)?.badge || '0.5 cr'}
                    </span>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-800 mb-1">
                      Available Models
                    </div>
                    {MODEL_OPTIONS.map((opt) => {
                      const isLocked = !isAuthenticated && !opt.publicAllowed;
                      const isSelected = selectedModel === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectModel(opt)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer text-xs mb-1 ${
                            isSelected ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' : 'hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isLocked && <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                            <span
                              className={
                                isLocked
                                  ? 'line-through decoration-rose-400 text-slate-400 font-medium'
                                  : isSelected
                                  ? 'font-bold text-white'
                                  : 'text-slate-200'
                              }
                            >
                              {opt.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isLocked
                                  ? 'bg-rose-500/10 text-rose-300 line-through decoration-rose-400'
                                  : 'bg-slate-800 text-indigo-300'
                              }`}
                            >
                              {opt.badge}
                            </span>
                            {isLocked && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase">
                                Beta
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || isOutOfQuota || isQuotaUnavailable || isPending}
                className="btn-primary py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base font-semibold shadow-lg shadow-indigo-600/25 shrink-0 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isQuotaUnavailable ? (
                  <span>Credits temporarily unavailable</span>
                ) : isPending ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Pending Approval</span>
                  </>
                ) : (
                  <>
                    <span>Generate Course</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 space-y-3">
              <label className="block text-xs text-slate-300" htmlFor="learning-topic">What do you want to learn? (optional)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input id="learning-topic" type="text" maxLength={120} value={learningTopic}
                  onChange={event => { setLearningTopic(event.target.value); setDiscoveryCandidates([]); }}
                  placeholder="For example: Godot audio buses"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500" />
                <button type="button" onClick={handleDiscover} disabled={discoveryLoading || isLoading}
                  className="rounded-xl border border-indigo-500/50 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-50">
                  {discoveryLoading ? 'Inspecting one page…' : 'Find relevant sections'}
                </button>
              </div>
              {discoveryCandidates.length > 0 && (
                <div className="space-y-1" aria-label="Matching documentation sections">
                  <p className="text-xs text-slate-400">Choose a section; then generate your learning path.</p>
                  {discoveryCandidates.map(candidate => (
                    <button key={candidate.url} type="button" onClick={() => {
                      setUrl(candidate.url); setDiscoveryCandidates([]);
                    }} className="block w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-xs text-slate-200 hover:border-indigo-500">
                      <span className="font-semibold">{candidate.title}</span>
                      <span className="block truncate font-mono text-slate-500">{candidate.url}</span>
                    </button>
                  ))}
                </div>
              )}
              {discoverySeed && !discoveryCandidates.length && <p className="text-[11px] text-indigo-300">Selected section will be used as the source; the original documentation URL is recorded.</p>}
            </div>
          </form>
        ) : (
          <form onSubmit={handleDocumentSubmit} className="space-y-4 relative z-10">
            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-indigo-500 bg-indigo-950/20'
                  : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.txt,.md,.markdown,.json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="mt-2 text-xs text-rose-400 hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    Drag & drop scanned tutorial image, or <span className="text-indigo-400 underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports PNG, JPG, WEBP (OCR via Tesseract) or TXT, MD documents (up to 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* OCR Live Progress Bar */}
            {ocrProgress && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    {ocrProgress.status}
                  </span>
                  <span className="font-bold text-white font-mono">{ocrProgress.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
                    style={{ width: `${ocrProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <button
                  type="button"
                  disabled={isLoading || Boolean(ocrProgress)}
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="w-full py-3.5 pl-3.5 pr-8 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-white truncate">
                      {MODEL_OPTIONS.find(m => m.id === selectedModel)?.label || 'Flash Lite (Fastest)'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {MODEL_OPTIONS.find(m => m.id === selectedModel)?.badge || '0.5 cr'}
                    </span>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || isOutOfQuota || isQuotaUnavailable || !selectedFile || Boolean(ocrProgress) || isPending}
                className="btn-primary py-3 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base font-semibold shadow-lg shadow-indigo-600/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isLoading || ocrProgress ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Extracting & Generating...</span>
                  </>
                ) : isPending ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Pending Approval</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run OCR & Build Course</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {isAuthenticated ? (
          <label className="mt-4 flex flex-col gap-2 text-xs text-slate-300">
            <span>Who can read this course?</span>
            <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
              <option value="private">Private — only you and administrators</option>
              <option value="community">Community — signed-in CourseIT users</option>
              <option value="public">Public — anyone with the link</option>
            </select>
            {inputMode === 'document' && <span className="text-slate-500">For signed-in PNG/JPEG/WebP scans, the original image is saved privately for your history. Only you and administrators can preview it, even if the generated course is shared. Extracted text is sent for AI generation.</span>}
          </label>
        ) : (
          <p className="mt-4 text-xs text-amber-300">Guest courses appear on the public board and expire 30 minutes after creation. Source files stay on your device.</p>
        )}

        {/* Quota & Error Status Banners */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quota remaining counter */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOutOfQuota || isQuotaUnavailable ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>
              {isAuthenticated ? (
                <>Account Credits: <strong className="text-slate-200">{formatCredits(credits)} Cr Remaining</strong></>
              ) : (
                <>Shared Guest Trial: <strong className="text-indigo-400">{guestRemaining ?? '—'}/3 remaining</strong> (URL + OCR shared • 24h Window)</>
              )}
            </span>
          </div>

          {!isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer font-medium"
            >
              {isAuthenticated ? 'Need credit top-up?' : 'Sign up or log in for 250 account credits →'}
            </button>
          )}
        </div>
      </div>

      {/* 3/3 Trial Limit Exhausted / Beta Access Modal */}
      {showTrialModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in">
          <div ref={trialDialogRef} role="dialog" aria-modal="true" aria-label="Beta access required" className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100dvh-2rem)] shadow-2xl relative overflow-y-auto text-center">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Beta Access Required</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Free trial limit reached (3/3). You can use another free trial in 24 hours, or request access to the beta test for 250 beta credits!
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTrialModal(false);
                  if (onOpenAdmin) onOpenAdmin();
                }}
                className="btn-primary py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Request Access for Beta Test (250 Beta Credits)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTrialModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preset Multi-Framework Quick Links */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quick-Load Official Developer Docs (Cross-Ecosystem)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CROSS_DOC_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isCurrent = url === preset.url && inputMode === 'url';
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetClick(preset.url)}
                disabled={isLoading}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-2 group cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-xl bg-slate-800 text-indigo-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{preset.framework}</span>
                </div>
                <div className="text-xs font-semibold truncate w-full">{preset.name}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

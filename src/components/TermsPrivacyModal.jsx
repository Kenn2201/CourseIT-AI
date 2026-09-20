import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useModalViewport from './useModalViewport';
import { X, Shield, FileText, CheckCircle2, Lock, Eye, BookOpen } from 'lucide-react';
import { CURRENT_VERSION_LABEL, RELEASE_DATE } from '../constants/version';

export default function TermsPrivacyModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [tab, setTab] = useState(initialTab); // 'terms' | 'privacy'
  const dialogRef = useModalViewport(isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Terms and privacy" className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-y-auto max-h-[calc(100dvh-2rem)]">
        <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>CourseIT Legal & Beta Testing Policy</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Last updated: {RELEASE_DATE} &bull; CourseIT {CURRENT_VERSION_LABEL}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5 relative z-10">
          <button
            type="button"
            onClick={() => setTab('terms')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === 'terms'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10">
          {tab === 'terms' ? (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  1. Beta Testing & Fair Use
                </h4>
                <p className="text-slate-400">
                  CourseIT is currently in active Beta ({CURRENT_VERSION_LABEL}). By using the service, you agree to fair use of API reasoning resources. Each verified tester receives 250 beta credits upon admin approval for educational, personal, and professional learning synthesis. CourseIT credits are internal usage units and do not equal cash, USD, or provider API dollars.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  2. Document Processing & Synthesis
                </h4>
                <p className="text-slate-400">
                  CourseIT processes developer documentation URLs and uploaded scans/diagrams using client-side OCR and Gemini models. If Gemini is temporarily limited or unavailable, configured server-side fallbacks may use Mistral, Groq, or OpenRouter free models. Users retain all rights to original tutorials and custom code. CourseIT provides distilled educational learning paths and does not claim ownership of third-party documentation.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  3. Account Archiving & Termination
                </h4>
                <p className="text-slate-400">
                  You may archive your account or delete custom courses at any time from your Profile. Archived accounts immediately revoke session tokens and stop notifications, and can be reactivated by contacting the administrator.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  1. Client-Side Document Security
                </h4>
                <p className="text-slate-400">
                  Document OCR is performed directly in your browser using client-side Tesseract.js workers. The extracted text is sent to CourseIT's server and then to the AI provider used to generate the learning path. On a temporary Gemini failure, it may be sent to Mistral, Groq, or an OpenRouter free-model provider, which process it under their own policies. CourseIT does not sell your content.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  2. Authentication & Quota Data
                </h4>
                <p className="text-slate-400">
                  Authentication is managed securely via Appwrite Cloud. We store only your email, name, avatar preference, and credit balance. We do not store plain-text passwords or financial payment information.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  3. Zero Telemetry Selling & Communication
                </h4>
                <p className="text-slate-400">
                  CourseIT sends transactional notifications (approval, password reset, quota updates) via verified Resend infrastructure (<code className="text-indigo-300 font-mono">hello@courseit.kenncode.me</code>). We never sell telemetry or user data to advertisers.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-5 mt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono relative z-10">
          <span>CourseIT &bull; Engineered by Kenn Vincent Nacario</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

import React, { useState } from 'react';
import { Sparkles, Trash2, CheckCircle, ArrowRight, Zap, Copy, Check, Clock, BrainCircuit } from 'lucide-react';

export default function AntiFluffDiff() {
  const [activeTab, setActiveTab] = useState('side-by-side'); // 'side-by-side' | 'before' | 'after'
  const [copied, setCopied] = useState(false);

  const beforeText = `Great question! Let me think about this. Your auth flow has a few moving pieces: the middleware, the token verification, and the cookie handling. Looking at src/auth.ts, the verifyToken function (around lines 42-58) seems to be using an older jsonwebtoken API. One approach would be to update the package and rewrite that function. After making the change, you'd want to run the auth tests to confirm nothing breaks. By the way, you might also want to look at your dependency versions overall. Hope this helps! Let me know if you want to dig deeper.`;

  const afterSteps = [
    { cmd: 'Run npm install jsonwebtoken@latest, then edit src/auth.ts:42.', type: 'action' },
    { cmd: 'Open src/auth.ts', type: 'navigate' },
    { cmd: 'Replace verifyToken (lines 42–58) with the snippet below', type: 'code' },
    { cmd: 'Run npm test -- auth.spec.ts', type: 'test' },
    { cmd: 'Next: paste the first failing line if any test fails.', type: 'debug' }
  ];

  const handleCopyAfter = () => {
    const text = afterSteps.map((s, i) => `${i + 1}. ${s.cmd}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-12 rounded-3xl p-6 sm:p-8 bg-slate-950/90 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono mb-2.5">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built for ADHD & Low Attention Spans</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Action-First Content. Minimal Tangents.
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            Standard AI outputs bury actionable insights under conversational filler. CourseIT is designed to reduce conversational filler and surface the next useful action first. Commands, code examples, and exact edits are included when relevant.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'side-by-side' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('before')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'before' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chatty LLM
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('after')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'after' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            CourseIT Distilled
          </button>
        </div>
      </div>

      {/* Main Diff Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* BEFORE BOX (Chatty LLM) */}
        {(activeTab === 'side-by-side' || activeTab === 'before') && (
          <div className="rounded-2xl bg-slate-900/60 border border-rose-500/30 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                    Before: Standard AI Fluff (92 Words)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-md">
                  ~45s reading fatigue
                </span>
              </div>

              <div className="text-xs text-slate-300 font-serif leading-relaxed italic bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2 select-all">
                <p>
                  <span className="text-rose-400 line-through mr-1 font-sans not-italic font-semibold">
                    "Great question! Let me think about this.
                  </span>
                  Your auth flow has a few moving pieces: the middleware, the token verification, and the cookie handling. Looking at{' '}
                  <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono not-italic">src/auth.ts</code>, the verifyToken function (around lines 42-58) seems to be using an older jsonwebtoken API. One approach would be to update the package and rewrite that function. After making the change, you'd want to run the auth tests to confirm nothing breaks.{' '}
                  <span className="text-rose-400 line-through mr-1 font-sans not-italic font-semibold">
                    By the way, you might also want to look at your dependency versions overall. Hope this helps! Let me know if you want to dig deeper."
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="text-rose-400 flex items-center gap-1">
                &times; 6 filler phrases identified
              </span>
              <span>Zero direct copyable commands</span>
            </div>
          </div>
        )}

        {/* AFTER BOX (CourseIT Action-First) */}
        {(activeTab === 'side-by-side' || activeTab === 'after') && (
          <div className="rounded-2xl bg-indigo-950/20 border border-emerald-500/40 p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-indigo-950/40">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    After: CourseIT Action Engine (28 Words)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAfter}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {afterSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      0{idx + 1}
                    </span>
                    <div className="flex-1">
                      <code className="text-xs text-emerald-300 font-mono font-medium block">
                        {step.cmd}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> 70% word reduction
              </span>
              <span className="text-indigo-300">Instant Execution (~3s)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

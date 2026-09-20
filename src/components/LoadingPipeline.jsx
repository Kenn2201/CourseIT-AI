import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Clock, LoaderCircle, X } from 'lucide-react';
import useModalViewport from './useModalViewport';
import TextType from './reactbits/TextType';

const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function LoadingPipeline({ isOpen, job, error, retryAt, input, onRetry, onClose }) {
  const dialogRef = useModalViewport(isOpen, onClose);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);
  if (!isOpen) return null;

  const remaining = retryAt ? Math.max(0, Math.ceil((retryAt - now) / 1000)) : 0;
  const terminalState = job?.state === 'failed' || job?.state === 'uncertain' || job?.state === 'cancelled';
  const elapsedStopAt = error && (job?.updatedAt || job?.startedAt) ? (job.updatedAt || job.startedAt) : now;
  const elapsed = Math.max(0, Math.floor((elapsedStopAt - (job?.startedAt || elapsedStopAt)) / 1000));
  const title = input?.type === 'document' ? input.title : input?.topic || 'Documentation learning module';
  let host = input?.type === 'document' ? input.title || 'Uploaded document' : '';
  try { if (input?.url) host = new URL(input.url).hostname; } catch { host = 'Documentation URL'; }
  const running = !error && !terminalState && job?.state !== 'succeeded';
  const rateLimited = error?.code === 'RATE_LIMITED';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center overflow-y-auto bg-slate-950/85 p-3 sm:p-6 backdrop-blur-md">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={rateLimited ? 'AI service temporarily busy' : 'Generating learning module'}
        className="glass-panel relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border border-indigo-500/30 bg-slate-950 p-5 sm:p-7 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:text-white" aria-label={running ? 'Hide progress; generation continues' : 'Close generation status'}>
          <X className="h-4 w-4" />
        </button>
        <div className="pr-8">
          <div className="mb-3 flex items-center gap-2 text-indigo-300">
            {running ? <LoaderCircle className="h-5 w-5 animate-spin" /> : error ? <AlertCircle className="h-5 w-5 text-amber-300" /> : <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
            <h2 className="text-lg font-bold text-white">{rateLimited ? 'AI Service Temporarily Busy' : error ? (error.code === 'GENERATION_UNKNOWN' ? 'Generation Status Unavailable' : 'Generation Failed') : job?.state === 'succeeded' ? 'Learning Module Generated' : 'Generating Learning Module'}</h2>
          </div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="mt-1 break-all text-xs text-slate-400">{host}</p>
          <div className="mt-5 flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
            <span>Process log</span><span className="flex items-center gap-1 font-mono"><Clock className="h-3.5 w-3.5" /> Elapsed {formatTime(elapsed)}</span>
          </div>
          <ol className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1" aria-live="polite">
            {(job?.events || []).map((event, index) => <li key={`${event.at}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs">
              <span className="font-mono text-indigo-300">{index === (job.events.length - 1) && running ? 'ACTION' : 'RESULT'}</span>
              <span className="text-slate-200">{event.stage}</span>
            </li>)}
            {!job?.events?.length && <li className="text-xs text-slate-400">Preparing request…</li>}
          </ol>
          {running && (
            <div className="mt-4 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
              <span className="font-mono text-indigo-400 font-semibold shrink-0">
                {job?.stage || 'Synthesizing'}
              </span>
              <TextType
                text={[
                  'Reading documentation…',
                  'Finding relevant sections…',
                  'Building action-first steps…',
                  'Preparing examples and commands…'
                ]}
                typingSpeed={35}
                deletingSpeed={20}
                pauseDuration={900}
                cursorCharacter="_"
                showCursor
                className="text-[11px] text-slate-300 truncate"
              />
            </div>
          )}
          {error && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100" role="alert">
            <p>{error.message}</p>
            {rateLimited && <p className="mt-2 font-mono">Retry available in {formatTime(remaining)}</p>}
            {error.code === 'GENERATION_UNKNOWN' && <p className="mt-2 text-xs">Check history before starting another generation. Automatic retry is disabled.</p>}
          </div>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800">{running ? 'Hide progress' : 'Close'}</button>
            {error?.retryable && error.code !== 'GENERATION_UNKNOWN' && <button type="button" onClick={onRetry} disabled={remaining > 0}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Retry</button>}
          </div>
          {running && <p className="mt-3 text-[11px] text-slate-500">Hiding this window does not cancel the server request or consume an extra credit.</p>}
        </div>
      </div>
    </div>, document.body
  );
}

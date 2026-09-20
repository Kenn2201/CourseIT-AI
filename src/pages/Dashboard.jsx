import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Sparkles, Search, Layers, AlertCircle, RefreshCw, Star, ShieldCheck, BrainCircuit, Clock, HelpCircle, Settings, User, CheckCircle2, Lock, ArrowRight, Zap, ExternalLink } from 'lucide-react';
import UrlInputForm from '../components/UrlInputForm';
import LoadingPipeline from '../components/LoadingPipeline';
import CourseCard from '../components/CourseCard';
import AdminModal from '../components/AdminModal';
import CourseSuccessModal from '../components/CourseSuccessModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Footer from '../components/Footer';
import ChangelogModal from '../components/ChangelogModal';
import DashboardSidebar from '../components/DashboardSidebar';
import GenerationHistory from '../components/GenerationHistory';
import ThemeToggle from '../components/ThemeToggle';
import { CURRENT_VERSION_LABEL } from '../constants/version';
import { listCourses, saveLocalCourse, removeLocalCourse, publishCourse } from '../lib/appwrite';
import { authenticatedFetch } from '../lib/auth';
import { readApiResponse } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isPending, quota: authQuota, credits, refreshAuth, refreshCredits } = useAuth();
  const [quota, setQuota] = useState(authQuota);
  useEffect(() => {
    setQuota(authQuota);
  }, [authQuota]);
  const authState = { user, isAuthenticated, isAdmin, isPending, quota: quota || authQuota };
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'history' | 'profile' | 'settings' | 'help'
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [lastInputPayload, setLastInputPayload] = useState(null);
  const [generationJob, setGenerationJob] = useState(null);
  const [generationFailure, setGenerationFailure] = useState(null);
  const [retryAt, setRetryAt] = useState(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const generationInFlight = useRef(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup');
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [successCourse, setSuccessCourse] = useState(null);
  const [successQuota, setSuccessQuota] = useState(null);
  const [successFallback, setSuccessFallback] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Settings State
  const [defaultModel, setDefaultModel] = useState(() => localStorage.getItem('courseit_default_model') || 'gemini-flash-lite-latest');
  const [antiFluffLevel, setAntiFluffLevel] = useState(() => localStorage.getItem('courseit_antifluff_level') || 'strict');
  const [settingsNotice, setSettingsNotice] = useState('');

  const handleModelChange = (newModel) => {
    setDefaultModel(newModel);
    try {
      localStorage.setItem('courseit_default_model', newModel);
      setSettingsNotice('Default reasoning model preference saved!');
      setTimeout(() => setSettingsNotice(''), 2500);
    } catch {}
  };

  const handleAntiFluffChange = (newLevel) => {
    setAntiFluffLevel(newLevel);
    try {
      localStorage.setItem('courseit_antifluff_level', newLevel);
      setSettingsNotice(`Anti-Fluff mode set to ${newLevel.toUpperCase()}!`);
      setTimeout(() => setSettingsNotice(''), 2500);
    } catch {}
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await listCourses(user?.id, isAdmin);
      setCourses(data);
    } catch (err) {
      setGenerateError('Could not refresh the course catalog: ' + err.message);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
    const interval = setInterval(loadCourses, 60000);
    return () => clearInterval(interval);
  }, [user?.id, isAdmin]);

  useEffect(() => {
    if (!isGenerating || !lastInputPayload?.requestId) return undefined;
    let stopped = false;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        const response = await authenticatedFetch(`/api/generation/jobs/${lastInputPayload.requestId}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (!stopped) {
            const error = Object.assign(new Error(data.error || 'This generation request no longer exists or was not created successfully.'), {
              code: data.code || 'GENERATION_UNKNOWN',
              retryable: false
            });
            setGenerationFailure(error);
            setIsGenerating(false);
            setGenerationJob((prev) => ({
              ...(prev || { startedAt: Date.now(), events: [] }),
              state: 'failed',
              updatedAt: Date.now(),
              code: error.code,
              error: error.message,
              events: [...(prev?.events || []), { stage: error.message, at: new Date().toISOString() }]
            }));
          }
          return;
        }

        const data = await response.json();
        if (!stopped) {
          setGenerationJob(data);
          if (data.state === 'failed' || data.state === 'uncertain') {
            setGenerationFailure(Object.assign(new Error(data.error || 'Generation stopped unexpectedly.'), {
              code: data.code || 'GENERATION_UNKNOWN',
              retryable: Boolean(data.retryAfterSeconds)
            }));
            setIsGenerating(false);
          }
        }
      } catch {
        /* The generation request remains authoritative; transient polling errors are not fatal. */
      } finally { polling = false; }
    };
    const timer = setInterval(poll, 1500);
    poll();
    return () => { stopped = true; clearInterval(timer); };
  }, [isGenerating, lastInputPayload?.requestId]);

  const waitForExistingJob = async requestId => {
    for (let attempt = 0; attempt < 80; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const response = await authenticatedFetch(`/api/generation/jobs/${requestId}`);
      const data = await readApiResponse(response);
      if (data.state === 'succeeded') return { success: true, ...data.result };
      if (data.state === 'failed') throw Object.assign(new Error(data.error), {
        code: data.code, retryAfterSeconds: data.retryAfterSeconds,
        retryable: ['RATE_LIMITED', 'PROVIDER_TIMEOUT', 'PROVIDER_UNAVAILABLE'].includes(data.code)
      });
    }
    throw Object.assign(new Error('Generation is still processing. Check history before trying again.'), { code: 'GENERATION_UNKNOWN' });
  };

  const handleGenerate = async (inputPayload, legacyModel) => {
    if (generationInFlight.current) return;
    generationInFlight.current = true;
    inputPayload = typeof inputPayload === 'object' ? { ...inputPayload,
      requestId: inputPayload.requestId || crypto.randomUUID() } :
      { type: 'url', url: inputPayload, model: legacyModel, requestId: crypto.randomUUID() };
    setIsGenerating(true);
    setGenerateError('');
    setGenerationFailure(null);
    setRetryAt(null);
    setGenerationJob({ startedAt: Date.now(), state: 'running', events: [] });
    setProgressOpen(true);
    setSuccessFallback(null);

    try {
      const userId = user?.id || null;
      const userEmail = user?.email || '';

      let response;
      if (inputPayload && typeof inputPayload === 'object' && inputPayload.type === 'document') {
        // Document OCR extraction flow with verified session JWT
        response = await authenticatedFetch('/api/summarize-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-mode': isAdmin ? 'true' : 'false'
          },
          body: JSON.stringify({
            title: inputPayload.title,
            text: inputPayload.text,
            model: inputPayload.model,
            userId,
            userEmail,
            isAdmin,
            visibility: inputPayload.visibility,
            requestId: inputPayload.requestId
          })
        });
      } else {
        // URL extraction flow with verified session JWT
        const targetUrl = typeof inputPayload === 'object' ? inputPayload.url : inputPayload;
        const targetModel = typeof inputPayload === 'object' ? inputPayload.model : legacyModel;

        response = await authenticatedFetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-mode': isAdmin ? 'true' : 'false'
          },
          body: JSON.stringify({
            url: targetUrl,
            inputUrl: inputPayload.inputUrl || targetUrl,
            topic: inputPayload.topic || '',
            model: targetModel,
            userId,
            userEmail,
            isAdmin,
            visibility: inputPayload.visibility,
            requestId: inputPayload.requestId
          })
        });
      }

      let data = await readApiResponse(response);

      // Only set lastInputPayload if we're actually going to poll or have succeeded
      if (response.status === 202 || (response.ok && data.success)) {
        setLastInputPayload(inputPayload);
      }

      if (response.status === 202) data = await waitForExistingJob(inputPayload.requestId);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate course.');
      }

      if (data.quota) {
        setQuota(data.quota);
        window.dispatchEvent(new CustomEvent('courseit_quota_updated', { detail: { quota: data.quota } }));
      }

      const newCourse = data.course;
      let sourceNotice = null;
      if (inputPayload.type === 'document' && inputPayload.sourceFile && isAuthenticated) {
        try {
          const sourceResponse = await authenticatedFetch(`/api/courses/${encodeURIComponent(newCourse.$id)}/source`, {
            method: 'PUT',
            headers: { 'Content-Type': inputPayload.sourceFile.type || 'application/octet-stream',
              'x-source-filename': inputPayload.sourceFile.name },
            body: inputPayload.sourceFile
          });
          await readApiResponse(sourceResponse);
        } catch (sourceError) {
          sourceNotice = `Course generated, but the original image could not be saved: ${sourceError.message}`;
        }
      }
      saveLocalCourse(newCourse);
      await loadCourses();

      setIsGenerating(false);
      setSuccessQuota(data.quota);
      setSuccessFallback([data.fallbackNotice, sourceNotice].filter(Boolean).join(' ') || null);
      setSuccessCourse(newCourse);
      setProgressOpen(false);
    } catch (err) {
      console.warn('Generation stopped:', err.code || err.status || 'unknown');
      if (err instanceof TypeError && !err.status) {
        err = Object.assign(new Error('Connection interrupted. Retry will use the same request ID, so it will not start a duplicate course.'),
          { code: 'CONNECTION_INTERRUPTED', retryable: true });
      }
      setGenerateError(err.message || 'Generation failed. Check your connection and retry.');
      setGenerationFailure(err);
      if (err.retryAfterSeconds) setRetryAt(Date.now() + err.retryAfterSeconds * 1000);
      setProgressOpen(true);
      setIsGenerating(false);
    } finally {
      generationInFlight.current = false;
    }
  };

  const handleConfirmDeleteCourse = async (course) => {
    if (!course) return;
    setIsDeletingCourse(true);
    try {
      const isLocal = Boolean(course.historical_only || course.local_only);
      if (!isLocal && authState.isAuthenticated) {
        const res = await authenticatedFetch('/api/courses/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.$id,
            userId: authState?.user?.id,
            userEmail: authState?.user?.email
          })
        });

        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.error || 'Failed to delete course');
        }
      }

      const updated = courses.filter((c) => c.$id !== course.$id);
      setCourses(updated);
      try { removeLocalCourse(course.$id); } catch {}
      setCourseToDelete(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.message || 'Failed to delete course.');
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const handlePublish = async (course) => {
    if (!window.confirm(`Make "${course.title}" public? Anyone with its link can read the course and it may appear in the anonymous showcase.`)) return;
    try {
      await publishCourse(course.$id);
      await loadCourses();
    } catch (error) { setGenerateError(error.message); }
  };

  const filteredCourses = courses.filter((c) => {
    if (c.historical_only) return false;
    const q = searchQuery.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.source_url || '').toLowerCase().includes(q)
    );
  });

  const userGenerationsCount = courses.filter(c => !c.is_curated && c.creator_id === user?.id).length;

  return (
    <div className="min-h-screen flex flex-col justify-between animate-page-load transition-colors duration-200">
      <div className="flex flex-col md:flex-row flex-1">
        {/* Application Shell Sidebar - Only rendered for authenticated users */}
        {authState.isAuthenticated && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            authState={authState}
            historyCount={userGenerationsCount}
          />
        )}

        {/* Main Content Workspace */}
        <main className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto flex-1">
            {/* TAB 1: STUDIO & COURSES GENERATOR */}
            {activeTab === 'dashboard' && (
              <div className="space-y-10">
                {/* Studio Header Banner */}
                <div className="text-center max-w-3xl mx-auto pt-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-4">
                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>SaaS {CURRENT_VERSION_LABEL} &bull; ADHD Anti-Fluff Action Engine &bull; Multi-Framework</span>
                  </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
                  Turn dense docs & scans into{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400">
                    action-first courses.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl mx-auto">
                  Paste a developer documentation URL or drop a tutorial scan. CourseIT is designed to strip conversational filler and surface the next useful action first with numbered steps, concise explanations, and runnable examples.
                </p>
              </div>

              {/* Pending Admin Approval Banner */}
              {authState.isAuthenticated && authState.quota?.status === 'pending' && (
                <div className="max-w-2xl mx-auto p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3.5 shadow-lg shadow-amber-950/20 animate-in fade-in">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-base">Account Pending Admin Approval</p>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Your account ({authState.user?.email}) is currently in the queue for approval. You will receive an email once approved with <strong>250 beta credits</strong>! In the meantime, you can explore the curated starter tutorials below.
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Generation Area (Clickable & Unobstructed) */}
              <div className="relative z-10">
                <UrlInputForm
                  onSubmit={handleGenerate}
                  isLoading={isGenerating}
                  quota={quota}
                  isAdmin={authState.isAdmin}
                  isAuthenticated={authState.isAuthenticated}
                  isPending={Boolean(authState.isAuthenticated && authState.quota?.status === 'pending')}
                  onOpenAdmin={() => setIsAuthModalOpen(true)}
                />
              </div>

              {/* In-Flight Pipeline Loading */}
              <LoadingPipeline isOpen={progressOpen} job={generationJob} error={generationFailure}
                retryAt={retryAt} input={lastInputPayload}
                onRetry={() => { if (lastInputPayload) handleGenerate(lastInputPayload); }}
                onClose={() => setProgressOpen(false)} />
              {(isGenerating || generationFailure) && !progressOpen && <button type="button" onClick={() => setProgressOpen(true)}
                className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20">
                View generation status
              </button>}

              {/* Error Message with Retry */}
              {generateError && !generationFailure && (
                <div className="mt-8 max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start justify-between gap-3 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-white">Generation Failed</p>
                      <p className="text-xs text-rose-300/90 leading-relaxed">{generateError}</p>
                    </div>
                  </div>

                  {lastInputPayload && (
                    <button
                      type="button"
                      onClick={() => handleGenerate(lastInputPayload)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try Again</span>
                    </button>
                  )}
                </div>
              )}

              <section className="rounded-2xl border border-slate-800 p-4 space-y-3" aria-label="Recent generated courses">
                <h2 className="text-sm font-semibold text-white">Recent generated courses</h2>
                <p className="text-xs text-slate-400">Open a generated course directly. Guest courses expire after 30 minutes.</p>
                <div className="flex flex-wrap gap-2">
                  {courses.filter(c => !c.is_curated && !c.historical_only).slice(0, 5).map(course => (
                    <Link key={course.$id} to={'/course/' + course.$id} className="rounded-lg bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300 hover:bg-indigo-500/20">
                      {course.title} <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                  {!courses.some(c => !c.is_curated && !c.historical_only) && <span className="text-xs text-slate-500">Your next generated course will appear here.</span>}
                </div>
              </section>

              {/* Saved Courses & Curated Catalog Section */}
              <section className="pt-8 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Interactive Course Catalog</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Curated developer starters and your generated custom courses with creator attribution
                    </p>
                  </div>

                  {/* Search Filter Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                {loadingCourses ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-xs font-mono">Syncing courses from Appwrite...</span>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">No courses found</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery
                          ? 'No courses match your search query.'
                          : 'Get started by entering a documentation URL or uploading an image above!'}
                      </p>
                    </div>
                  </div>
                ) : (() => {
                  const curatedCourses = filteredCourses.filter(c => c.is_curated || c.$id?.startsWith('starter-'));
                  const generatedCourses = filteredCourses.filter(c => !c.is_curated && !c.$id?.startsWith('starter-'));
                  const courseSections = [
                    { title: 'Public Showcase', visibility: 'public', description: 'Readable without signing in' },
                    { title: 'Community', visibility: 'community', description: 'Readable by signed-in CourseIT users' },
                    { title: 'Private Workspace', visibility: 'private', description: 'Only the owner and administrators can read these courses' }
                  ];

                  return (
                    <div className="space-y-10">
                      {/* SECTION 1: CURATED STARTERS */}
                      {curatedCourses.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                                Curated Starters
                              </span>
                              <span className="text-xs text-slate-400 hidden sm:inline">
                                Official hand-crafted blueprints
                              </span>
                            </div>
                            <span className="text-xs font-mono text-slate-500">
                              {curatedCourses.length} templates
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {curatedCourses.map((course) => (
                              <CourseCard
                                key={course.$id}
                                course={course}
                                currentUser={authState.user}
                                isAdmin={authState.isAdmin}
                                onPublish={handlePublish}
                                onDelete={(c) => setCourseToDelete(c)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedCourses.length === 0 && (
                        <div className="glass-panel p-8 rounded-2xl border border-dashed border-slate-800 text-center text-sm text-slate-400">
                          No generated courses yet. Choose a documentation page or upload a scan above.
                        </div>
                      )}
                      {courseSections.map(section => {
                        const sectionCourses = generatedCourses.filter(course => (course.visibility || 'private') === section.visibility);
                        if (!sectionCourses.length) return null;
                        return <div key={section.visibility} className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                            <div><h3 className="text-xs font-mono font-bold uppercase text-emerald-300">{section.title}</h3>
                              <p className="text-xs text-slate-500">{section.description}</p></div>
                            <span className="text-xs font-mono text-slate-500">{sectionCourses.length} courses</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {sectionCourses.map((course) => (
                              <CourseCard
                                key={course.$id}
                                course={course}
                                currentUser={authState.user}
                                isAdmin={authState.isAdmin}
                                onPublish={handlePublish}
                                onDelete={(c) => setCourseToDelete(c)}
                              />
                            ))}
                          </div>
                        </div>;
                      })}
                    </div>
                  );
                })()}
              </section>
            </div>
          )}

          {/* TAB 2: GENERATION HISTORY & OCR UPLOADS */}
          {activeTab === 'history' && (
            <GenerationHistory
              courses={courses.filter(c => c.creator_id === user?.id)}
              onDeleteCourse={(c) => setCourseToDelete(c)}
              currentUser={authState.user}
              isAdmin={authState.isAdmin}
            />
          )}

          {/* TAB 3: PROFILE & CREDITS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Account & Quota Overview</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  User Profile
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage your credentials, verify approval status, and inspect reasoning credits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20">
                      {authState.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{authState.user?.name || 'Guest User'}</h3>
                      <p className="text-xs text-slate-400">{authState.user?.email || 'Not logged in'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Status:</span>
                      <span className={`font-semibold capitalize ${authState.quota?.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {authState.quota?.status || (authState.isAuthenticated ? 'Approved' : 'Guest Trial')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Credits Remaining:</span>
                      <span className="font-mono font-bold text-white">
                        {authState.isAuthenticated
                          ? `${(authState.quota?.quota_remaining ?? 250).toFixed(1)} / 250`
                          : `${authState.quota?.remaining ?? 3} / 3 Free Trials`}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <span>Open Full Profile & Prompt Manager</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">Need Additional Quota?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verified beta testers receive 250 beta credits upon account approval. If you run out of credits while testing large documentation archives, administrators can issue instant credit top-ups.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 transition-all cursor-pointer"
                  >
                    Request Quota Top-Up
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & PREFERENCES */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Workspace Preferences</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Studio Settings
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Customize your visual theme, synthesis pacing, and default model tiers.
                </p>
              </div>

              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 max-w-3xl">
                {settingsNotice && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{settingsNotice}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Color Theme</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle between Dark Mode and Light Mode with PixelSwap animation</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">ADHD Anti-Fluff Level</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {antiFluffLevel === 'strict'
                        ? 'Strict mode: 0 conversational filler, numbered steps, executable code commands only'
                        : 'Balanced mode: Preserves brief conceptual overviews alongside numbered steps'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAntiFluffChange('strict')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        antiFluffLevel === 'strict'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      STRICT (ZERO FLUFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAntiFluffChange('balanced')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        antiFluffLevel === 'balanced'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      BALANCED
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Default Model Preference</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Automatically pre-selects this reasoning tier on the course generation form</p>
                  </div>
                  <select
                    value={defaultModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500 shrink-0"
                  >
                    <option value="gemini-flash-lite-latest">Flash Lite (0.5 cr) — Ultra Fast (~0.8s)</option>
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Lite (1.0 cr) — Balanced</option>
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash (2.0 cr) — Deep Synthesis</option>
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash (5.0 cr) — Complex Architectures</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HELP & ANTI-FLUFF DOCUMENTATION */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Comprehensive Guide & Documentation</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Mastering CourseIT
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Learn how the anti-fluff extraction works, supported formats, credit tiers, and troubleshooting.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Anti-Fluff Engine */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">1. How Anti-Fluff Extraction Works</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Most technical tutorials and API references contain 70-80% conversational filler, disclaimers, and marketing context. CourseIT applies an AST structural heuristic that strips preamble, extracts raw code blocks, and isolates imperative instructions into strictly numbered sequential steps with estimated times and pro-tips.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-indigo-300">
                    Input: 40-page API Guide &rarr; Output: 4-6 Action Steps with Code
                  </div>
                </div>

                {/* 2. Supported Inputs */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">2. Supported Input Formats</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Direct URLs:</strong> Paste documentation links from Godot, React, Next.js, Rust Book, Docker, MDN, Python docs, and GitHub Readmes.<br />
                    <strong>Client-Side OCR:</strong> Upload scanned cheat sheets, tutorial screenshots, or PDF pages (PNG, JPG, WEBP, PDF, TXT, MD). Text is extracted in-browser with Tesseract.js before LLM synthesis.
                  </p>
                </div>

                {/* 3. Model Tiers & Resilience */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">3. Credits, Model Tiers & Fallback Resilience</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    CourseIT offers 4 tiered reasoning models:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1 font-mono">
                    <li>&bull; Flash Lite (0.5 cr): Fastest (~0.8s), great for standard guides</li>
                    <li>&bull; Gemini 3.5 Lite (1.0 cr): Balanced speed and technical detail</li>
                    <li>&bull; Gemini 3.6 Flash (2.0 cr): Deep synthesis with rich code examples</li>
                    <li>&bull; Gemini 3.7 Flash (5.0 cr): High-power reasoning for complex architectures</li>
                  </ul>
                  <p className="text-[11px] text-slate-400 italic">
                    If Gemini 3.7 encounters high upstream traffic, CourseIT automatically fails over to Flash Lite and charges only 0.5 credits.
                  </p>
                </div>

                {/* 4. Course Navigation & Exports */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">4. Navigating Steps & Export Options</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click step checkboxes to track real-time progress saved to local storage. Use the copy button on code snippets to grab commands instantly. You can export complete courses to Markdown (.md) or Word (.doc), or print directly to formatted PDF.
                  </p>
                </div>

                {/* 5. Troubleshooting & FAQ */}
                <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-400" />
                    <span>Troubleshooting & FAQ</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <h4 className="font-semibold text-slate-200">Generation says "URL extraction failed"</h4>
                      <p className="text-slate-400">
                        Some SPAs render entirely via client-side JavaScript. If a URL fails to scrape, copy-paste the text or screenshot the page and upload it using the Document OCR tab.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <h4 className="font-semibold text-slate-200">How do guest course quotas work?</h4>
                      <p className="text-slate-400">
                        Guests share 3 free generations per 24-hour reset. Generated courses appear on the public board and expire after 30 minutes. Create an account to request 250 persistent cloud credits.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <h4 className="font-semibold text-slate-200">Why are custom courses private?</h4>
                      <p className="text-slate-400">
                        Your courses default to private. Community courses require sign-in; public courses can be read by anyone. Access is enforced by the server.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <h4 className="font-semibold text-slate-200">Need more credits?</h4>
                      <p className="text-slate-400">
                        Approved beta testers can request top-ups in the Profile tab or reach out directly to <code>hello@courseit.kenncode.me</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Developer Portfolio Footer inside main content column */}
          <Footer onOpenChangelog={() => setIsChangelogOpen(true)} />
        </main>
      </div>

      {/* Modals */}
      <AdminModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authState={authState}
        initialMode={authModalMode}
        onAuthChange={(newState) => {
          setAuthState(newState);
          loadQuota(newState?.user);
        }}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      <CourseSuccessModal
        isOpen={Boolean(successCourse)}
        course={successCourse}
        quotaResult={successQuota}
        fallbackNotice={successFallback}
        onClose={() => {
          setSuccessCourse(null);
          setSuccessFallback(null);
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(courseToDelete)}
        course={courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDeleteCourse}
        isDeleting={isDeletingCourse}
      />
    </div>
  );
}

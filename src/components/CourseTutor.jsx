import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Sparkles, X, Send, Code, Lightbulb, AlertTriangle,
  CheckCircle, HelpCircle, Terminal, RefreshCw, ChevronRight,
  Zap, FileText, Cpu, Clock, BookOpen, Layers, Info
} from 'lucide-react';
import FormattedChatText from './FormattedChatText';
import ImStuckModal from './ImStuckModal';
import { authenticatedFetch } from '../lib/auth';

export default function CourseTutor({
  course,
  activeStepIndex = 0,
  mode = 'course',
  floating = true,
  externalPrompt = null,
  onClearExternalPrompt = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedStep, setSelectedStep] = useState(activeStepIndex);
  const [responseMode, setResponseMode] = useState('quick'); // 'quick' | 'normal' | 'deep'
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);
  const [revealedSources, setRevealedSources] = useState(new Set());
  const chatBottomRef = useRef(null);

  const isLandingMode = mode === 'landing';
  const steps = course?.steps || [];
  const currentStep = steps[selectedStep] || steps[0] || {};
  const isGuest = course?.is_guest || course?.creator_id === 'public_guest';

  // Sync selectedStep if activeStepIndex changes from outside
  useEffect(() => {
    if (activeStepIndex !== undefined && activeStepIndex >= 0 && activeStepIndex < steps.length) {
      setSelectedStep(activeStepIndex);
    }
  }, [activeStepIndex, steps.length]);

  // Handle external prompts (e.g. when user clicks [Explain simpler] or [I'm stuck] inside StepItem)
  useEffect(() => {
    if (externalPrompt) {
      setIsOpen(true);
      if (externalPrompt.type === 'stuck') {
        setIsStuckModalOpen(true);
      } else if (externalPrompt.text) {
        handleTutorRequest(externalPrompt.text, {
          stepIndex: externalPrompt.stepNumber ? externalPrompt.stepNumber - 1 : selectedStep
        });
      }
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      if (isLandingMode) {
        setMessages([
          {
            id: 'welcome_landing',
            sender: 'tutor',
            text: `👋 **Welcome to CourseIT!** I'm your interactive demo guide.\n\nAsk me how our **ADHD-friendly anti-fluff engine** turns 5,000-word documentation pages into numbered, action-first steps, or tap one of the quick questions below!`
          }
        ]);
      } else if (course?.title) {
        setMessages([
          {
            id: 'welcome_course',
            sender: 'tutor',
            text: `👋 Hey! I'm your **Technical Companion** for *${course.title}*.\n\nI have full context on **Step ${selectedStep + 1}: ${currentStep.title || 'Introduction'}**. Ask me any question, ask for code, or let me know if you get an error!`
          }
        ]);
      }
    }
  }, [course, isLandingMode]);

  const addMessage = (sender, text, code = null, quiz = null, extra = {}) => {
    const newMsg = {
      id: Date.now() + Math.random().toString(),
      sender,
      text,
      code,
      quiz,
      ...extra,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const toggleSourceReveal = (msgId) => {
    setRevealedSources((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // Central tutor dispatch to POST /api/tutor
  const handleTutorRequest = async (userQuestion, options = {}) => {
    const q = String(userQuestion || '').trim();
    if (!q && !options.errorMessage) return;

    const targetStepIdx = options.stepIndex !== undefined ? options.stepIndex : selectedStep;
    const targetStepObj = steps[targetStepIdx] || currentStep;

    // Display user bubble
    addMessage('user', options.displayPrompt || q);
    setIsTyping(true);

    if (isLandingMode) {
      // Landing page simulated overview responses
      setTimeout(() => {
        setIsTyping(false);
        addMessage(
          'tutor',
          `CourseIT is designed for fast, practical execution. You can paste any developer documentation URL or upload an OCR scan right now on the **Launch App** page to see it convert into an action-first curriculum!`
        );
      }, 500);
      return;
    }

    try {
      // Rolling chat history (last 6 messages max)
      const recentHistory = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await authenticatedFetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: course.$id,
          stepIndex: targetStepIdx,
          question: q,
          mode: isGuest ? 'quick' : responseMode,
          recentMessages: recentHistory,
          troubleCategory: options.troubleCategory || null,
          errorMessage: options.errorMessage || null
        })
      });

      const data = await res.json();
      setIsTyping(false);

      if (!res.ok || data.success === false) {
        addMessage('tutor', `⚠️ ${data.error || 'The tutor encountered an issue answering. Please retry.'}`);
        return;
      }

      // Add tutor bubble with structured references
      addMessage('tutor', data.answer, null, null, {
        sourceRefs: data.sourceRefs || [],
        sourceExcerpt: data.sourceExcerpt || null,
        suggestedActions: data.suggestedActions || []
      });
    } catch (err) {
      setIsTyping(false);
      addMessage(
        'tutor',
        `⚠️ Network error connecting to CourseTutor. Check your connection and try again!`
      );
    }
  };

  // Quick Action Handler
  const handleQuickAction = (actionType) => {
    const stepTitle = currentStep.title || `Step ${selectedStep + 1}`;

    if (actionType === 'explain') {
      handleTutorRequest(`Explain step ${selectedStep + 1} (${stepTitle}) simpler with numbered actions.`);
    } else if (actionType === 'code') {
      handleTutorRequest(`Show runnable code snippet and syntax for step ${selectedStep + 1} (${stepTitle}).`);
    } else if (actionType === 'gotcha') {
      handleTutorRequest(`What common mistakes, bugs, or subtle gotchas should I avoid in step ${selectedStep + 1} (${stepTitle})?`);
    } else if (actionType === 'quiz') {
      // 0-cost checkpoint check first!
      if (currentStep.checkpoint?.question) {
        addMessage('user', `🎯 Quiz me on "${stepTitle}"`);
        addMessage(
          'tutor',
          `Here is the concept check for **Step ${selectedStep + 1}: ${stepTitle}**:`,
          null,
          {
            question: currentStep.checkpoint.question,
            options: currentStep.checkpoint.options,
            correct: currentStep.checkpoint.correctIndex,
            explanation: currentStep.checkpoint.explanation
          }
        );
      } else {
        // Only call AI if no pre-generated checkpoint exists
        handleTutorRequest(`Give me a quick 1-question multiple choice concept check on step ${selectedStep + 1} (${stepTitle}).`);
      }
    } else if (actionType === 'stuck') {
      setIsStuckModalOpen(true);
    }
  };

  const handleCustomQuestion = (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isTyping) return;
    const q = inputQuestion.trim();
    setInputQuestion('');
    handleTutorRequest(q);
  };

  return (
    <>
      {/* Floating or Inline Launcher Button */}
      <div className={floating ? "fixed bottom-6 left-6 z-40" : "relative z-20 inline-block"}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer border group ${isLandingMode
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400/30 shadow-emerald-900/30'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-indigo-400/30 shadow-indigo-600/30'
            }`}
          title={isLandingMode ? 'Ask CourseIT Demo Bot' : 'Open Contextual Course Tutor'}
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <span className="font-semibold text-xs tracking-wide">
            {isLandingMode ? 'CourseIT Guide (Demo)' : 'Ask Course Tutor'}
          </span>
        </button>
      </div>

      {/* Drawer / Companion Modal */}
      {isOpen && (
        <div className="fixed bottom-6 left-4 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl bg-slate-950/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 overflow-hidden font-sans">
          {/* Header */}
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isLandingMode
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300'
                }`}>
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {isLandingMode ? 'CourseIT Guide' : 'Interactive Course Tutor'}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${isLandingMode
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                    {isLandingMode ? 'Public Demo' : `Step ${selectedStep + 1} Context`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {isLandingMode ? 'Interactive Overview & FAQ' : (currentStep.title || course?.title || 'Active Course')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isLandingMode && (
            <>
              {/* Step Context Selector & Mode Bar */}
              <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                {/* Step selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-slate-500 font-mono text-[10px] shrink-0">Focus:</span>
                  {steps.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedStep(idx)}
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] shrink-0 transition-all cursor-pointer ${selectedStep === idx
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Response Length Mode Selector */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-500 px-1 text-[9px]">Length:</span>
                  {['quick', 'normal', 'deep'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={isGuest && m !== 'quick'}
                      onClick={() => setResponseMode(m)}
                      title={isGuest && m !== 'quick' ? 'Sign in for Normal and Deep modes' : `${m} mode`}
                      className={`px-1.5 py-0.5 rounded transition-all capitalize cursor-pointer ${responseMode === m
                          ? 'bg-indigo-600 text-white font-bold'
                          : isGuest && m !== 'quick'
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Action Chips */}
              <div className="p-2 bg-slate-900/30 border-b border-slate-800/60 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAction('stuck')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-medium transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>I'm Stuck</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAction('explain')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3 h-3 text-indigo-400" />
                  <span>Explain Simpler</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAction('code')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-medium transition-colors cursor-pointer"
                >
                  <Code className="w-3 h-3 text-emerald-400" />
                  <span>Show Example</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAction('gotcha')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 font-medium transition-colors cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>What Can Go Wrong?</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAction('quiz')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 font-medium transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3 text-violet-400" />
                  <span>Quiz Me</span>
                </button>
              </div>
            </>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3">
            {messages.map((m) => {
              const hasSource = m.sourceExcerpt && m.sourceRefs?.length > 0;
              const isSourceRevealed = revealedSources.has(m.id);

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                      }`}
                  >
                    <FormattedChatText text={m.text} />

                    {/* Interactive Quiz card inside message */}
                    {m.quiz && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-violet-500/30 space-y-2">
                        <p className="font-semibold text-violet-300 text-xs">{m.quiz.question}</p>
                        <div className="space-y-1.5">
                          {m.quiz.options.map((opt, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                if (i === m.quiz.correct) {
                                  addMessage('tutor', `🎉 **Correct!** That is the exact objective of this step.\n\n${m.quiz.explanation || ''}`);
                                } else {
                                  addMessage('tutor', `❌ **Not quite.** ${m.quiz.explanation || 'Review the step goal and action list to try again!'}`);
                                }
                              }}
                              className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-violet-600/20 border border-slate-800 hover:border-violet-500/40 text-slate-300 text-xs transition-colors cursor-pointer flex items-center justify-between"
                            >
                              <span>{opt}</span>
                              <ChevronRight className="w-3 h-3 text-slate-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* [Show source] Button & Accordion */}
                    {hasSource && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/70">
                        <button
                          type="button"
                          onClick={() => toggleSourceReveal(m.id)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer font-semibold"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{isSourceRevealed ? 'Hide source context' : 'Show source context'}</span>
                        </button>

                        {isSourceRevealed && (
                          <div className="mt-2 p-2.5 rounded-lg bg-slate-950/90 border border-indigo-500/20 text-[11px] text-slate-300 font-mono leading-relaxed max-h-36 overflow-y-auto">
                            {m.sourceExcerpt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Question Input Form */}
          <form onSubmit={handleCustomQuestion} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder={isLandingMode ? 'Ask about CourseIT features or ADHD synthesis...' : `Ask about Step ${selectedStep + 1} (${currentStep.title || 'actions'})...`}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isTyping}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* I'm Stuck Modal */}
      <ImStuckModal
        isOpen={isStuckModalOpen}
        onClose={() => setIsStuckModalOpen(false)}
        stepNumber={selectedStep + 1}
        stepTitle={currentStep.title}
        onSubmit={({ troubleCategory, errorMessage, question }) => {
          handleTutorRequest(question, {
            troubleCategory,
            errorMessage,
            displayPrompt: errorMessage ? `⚠️ Stuck with error:\n${errorMessage}` : question
          });
        }}
      />
    </>
  );
}

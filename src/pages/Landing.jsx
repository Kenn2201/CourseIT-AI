import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Zap,
  Cpu,
  Scan,
  Check,
  Boxes,
  Container,
  Flame,
  Radio,
  BrainCircuit
} from 'lucide-react';
import ShapeGrid from '../components/reactbits/ShapeGrid';
import RotatingText from '../components/reactbits/RotatingText';
import SplitText from '../components/reactbits/SplitText';
import FadeContent from '../components/reactbits/FadeContent';
import LogoLoop from '../components/reactbits/LogoLoop';
import CardSwap from '../components/reactbits/CardSwap';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import AntiFluffDiff from '../components/AntiFluffDiff';
import Footer from '../components/Footer';
import ChangelogModal from '../components/ChangelogModal';
import AdminModal from '../components/AdminModal';
import { getAuthState } from '../lib/auth';
import { CURRENT_VERSION_LABEL } from '../constants/version';

const CURATED_DEMOS = [
  {
    id: 'react-server-components',
    title: 'React 19 Server Components & Actions',
    category: 'React / Next.js',
    badge: 'Official Docs',
    steps: 5,
    time: '~25 min',
    summary: 'Master async server transitions, useActionState, and zero-bundle-size server execution paths.',
    url: 'https://react.dev/reference/rsc/server-components',
    icon: Boxes
  },
  {
    id: 'godot-using-signals',
    title: 'Using Signals to Decouple Game Objects',
    category: 'Godot Engine',
    badge: 'Official Docs',
    steps: 4,
    time: '~30 min',
    summary: 'Emit custom signals, connect buttons and timers, and architect clean node communication without direct references.',
    url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html',
    icon: Radio
  },
  {
    id: 'rust-ownership-borrowing',
    title: 'Rust Ownership, References & Borrow Checker',
    category: 'Rust Lang',
    badge: 'Official Book',
    steps: 5,
    time: '~35 min',
    summary: 'Conquer the borrow checker: understand stack vs heap allocation, mutable references, and lifetime scopes.',
    url: 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html',
    icon: Flame
  },
  {
    id: 'docker-multi-stage-builds',
    title: 'Docker Multi-Stage Production Builds',
    category: 'Docker / DevOps',
    badge: 'Official Docs',
    steps: 4,
    time: '~20 min',
    summary: 'Slash container sizes by 85%: separate build environments from runtime artifacts with clean Dockerfile stages.',
    url: 'https://docs.docker.com/build/building/multi-stage/',
    icon: Container
  }
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Choose What You Want to Learn',
    desc: 'Paste a documentation URL or drop a scanned tutorial image, then specify the exact concept or topic you want to master.',
    accent: 'text-indigo-400',
    badgeBg: 'bg-indigo-600/20 border-indigo-500/30'
  },
  {
    step: '02',
    title: 'CourseIT Finds the Relevant Material',
    desc: 'CourseIT inspects the source, identifies matching sections, and purifies the content—filtering out promotional filler and unrelated navigation.',
    accent: 'text-violet-400',
    badgeBg: 'bg-violet-600/20 border-violet-500/30'
  },
  {
    step: '03',
    title: 'Generates an Action-First Learning Module',
    desc: 'Multi-provider AI distills the material into sequential, numbered steps with concrete time estimates, pro tips, and runnable code snippets when relevant.',
    accent: 'text-purple-400',
    badgeBg: 'bg-purple-600/20 border-purple-500/30'
  },
  {
    step: '04',
    title: 'Practice and Track Progress',
    desc: 'Follow direct instructions, copy verified commands, track interactive checklists, and consult the Interactive Course Tutor for instant clarifications.',
    accent: 'text-emerald-400',
    badgeBg: 'bg-emerald-600/20 border-emerald-500/30'
  }
];

const TECH_ITEMS = [
  { name: 'React 19', category: 'Frontend', icon: '⚛️' },
  { name: 'Vite 6', category: 'Bundler', icon: '⚡' },
  { name: 'Netlify', category: 'Serverless & Blobs', icon: '🌐' },
  { name: 'Appwrite Cloud', category: 'Auth & DB', icon: '☁️' },
  { name: 'Google Gemini', category: 'Primary AI', icon: '✨' },
  { name: 'Groq', category: 'LPU Fallback', icon: '⚡' },
  { name: 'Mistral AI', category: 'Fallback', icon: '🌪️' },
  { name: 'OpenRouter', category: 'Free Fallback', icon: '🔀' },
  { name: 'Resend', category: 'Email', icon: '✉️' },
  { name: 'Sentry', category: 'Telemetry', icon: '🛡️' },
  { name: 'Tesseract.js', category: 'Client OCR', icon: '🔍' }
];

const MODEL_PRICING = [
  {
    tier: 'Fast Tier (Flash Lite & Fallbacks)',
    cost: '0.5 Credits',
    desc: 'High-speed synthesis for standard docs & guides with automated multi-provider resilience. Free for public sandbox.',
    badge: 'Guest 3/3 & Beta',
    trialLabel: 'Included in Guest 3/3 Trial & Beta',
    speed: 'Ultra-Fast'
  },
  {
    tier: 'Balanced Tier (3.5 Level)',
    cost: '1.0 Credit',
    desc: 'Balanced reasoning with step-by-step implementation notes and verification checks when relevant.',
    badge: 'Beta Required',
    trialLabel: 'Approved Beta Account Required',
    speed: 'Standard'
  },
  {
    tier: 'Deep Tier (3.6 Level)',
    cost: '2.0 Credits',
    desc: 'Multi-step structuring with code examples and architectural context when relevant.',
    badge: 'Beta Required',
    trialLabel: 'Approved Beta Account Required',
    speed: 'Deep'
  },
  {
    tier: 'Maximum Depth Tier (3.7 Level)',
    cost: '5.0 Credits',
    desc: 'Deep technical reasoning for intricate framework specifications and complex scans.',
    badge: 'Pro Beta',
    trialLabel: 'Approved Beta Account Required',
    speed: 'Maximum'
  }
];

const COURSE_TRANSFORMATION_CARDS = [
  {
    id: 'card-docs',
    tabLabel: '1. Raw Documentation',
    phase: 'Phase 01 • Raw Documentation',
    badge: 'Exhaustive Reference',
    title: 'React 19 Server Actions & Mutation Specs',
    description: '5,000 words of introductory scene-setting, design philosophy, and scattered edge-cases.',
    codeSnippet: '// 40+ pages of reference documentation, theory, and buried setup...'
  },
  {
    id: 'card-course',
    tabLabel: '2. Action Curriculum',
    phase: 'Phase 02 • CourseIT Synthesis',
    badge: 'Numbered Action Steps',
    title: 'Action-First Implementation Curriculum',
    description: 'Distilled into sequential steps with time estimates, imperative verbs, and runnable code.',
    codeSnippet: '1. Define "use server" action handler (~3m)\n2. Bind via useActionState hook (~4m)\n3. Handle optimistic updates (~5m)'
  },
  {
    id: 'card-practice',
    tabLabel: '3. Practice & Retention',
    phase: 'Phase 03 • Active Retention',
    badge: 'Technical Companion',
    title: 'Interactive Verification & Gotchas',
    description: 'Verify syntax with one-click copy blocks, follow checklists, and query the companion tutor.',
    codeSnippet: '✓ Handled async transition gotcha\n✓ 1-Click copy tested snippet\n✓ Interactive progress tracking'
  }
];

export default function Landing({ onLaunchApp }) {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('signup');
  const authState = getAuthState();

  const handleOpenAuth = (mode = 'signup') => {
    setAuthInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="landing-root min-h-screen bg-[#070913] text-slate-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white animate-page-load transition-colors duration-300">
      {/* ReactBits ShapeGrid Interactive Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-auto h-[720px]">
        <ShapeGrid
          direction="diagonal"
          speed={0.35}
          squareSize={48}
          shape="square"
          borderColor="#171b30"
          hoverFillColor="#272757"
          hoverTrailAmount={2}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-14 sm:pt-24 sm:pb-18 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Release & ADHD Focus Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsChangelogOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono shadow-lg shadow-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CourseIT Ai {CURRENT_VERSION_LABEL} • ADHD-Friendly Action Engine</span>
          </button>

          {/* Main Headline with RotatingText */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.14]">
            Turn dense docs & scans into{' '}
            <br className="hidden sm:inline" />
            <RotatingText
              words={[
                'action-first learning modules.',
                'concise, runnable steps.',
                'focused technical lessons.',
                'zero-fluff workflows.'
              ]}
              interval={3000}
            />
          </h1>

          {/* ADHD / Attention Span Positioning with SplitText */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg font-medium text-indigo-200">
              <SplitText
                text="⚡ ADHD-friendly technical learning from documentation."
                delay={0.03}
                duration={0.65}
                ease="power3.out"
                splitType="words"
              />
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Paste docs or scans, tell CourseIT what you want to learn, and get an action-first learning module with concise explanations, numbered steps, examples, commands, and clear next actions.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            {authState?.isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  if (onLaunchApp) onLaunchApp();
                  else navigate('/app');
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
              >
                <Terminal className="w-4 h-4" />
                <span>Go to Studio / Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('signup')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
                >
                  <span>Get Started Free (250 Credits)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onLaunchApp) onLaunchApp();
                    else navigate('/app');
                  }}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
                >
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Launch App Generator</span>
                </button>
              </>
            )}
          </div>

          {/* Guarantee / Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              250 Beta Credits on Approval
            </span>
            <span className="flex items-center gap-1.5">
              <Scan className="w-4 h-4 text-indigo-400" />
              Client-Side Document OCR
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-violet-400" />
              Multi-Provider AI Resilience
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Anti-Fluff Diff Comparison Section */}
      <FadeContent className="relative z-10 px-4 sm:px-6" duration={600}>
        <AntiFluffDiff />
      </FadeContent>

      {/* Interactive Transformation Visualizer (CardSwap) */}
      <FadeContent className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12" duration={600} delay={50}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Visual Transformation</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            How CourseIT Transforms Documentation into Action
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Click through each phase to see how dense reference manuals convert into numbered, retained skills.
          </p>
        </div>
        <CardSwap cards={COURSE_TRANSFORMATION_CARDS} interval={4500} />
      </FadeContent>

      {/* Technology Showcase Marquee (LogoLoop) */}
      <FadeContent className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8" duration={600} delay={100}>
        <div className="text-center mb-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
            Engineered with Production-Grade Infrastructure
          </span>
        </div>
        <LogoLoop items={TECH_ITEMS} speed="40s" />
      </FadeContent>

      {/* "The Problem We Solve" Section */}
      <FadeContent className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-xl" duration={600}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Problem We Solve</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why Action-First Learning?
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Traditional documentation is designed as an exhaustive reference archive, not a learning path. CourseIT Ai flips the model: learn by building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Traditional Docs Box */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-rose-500/20 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Traditional Docs & Wordy AI Chatbots</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>Endless conversational filler ("Great question!", "Let me think...") draining working memory.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>40-page API documentation with buried setup commands and scattered prerequisites.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>Passive reading leads to tutorial hell without retention.</span>
                </li>
              </ul>
            </div>

            {/* CourseIT Action-First Box */}
            <div className="p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/30 space-y-4 shadow-lg shadow-indigo-950/30">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CourseIT Ai Action-First Curriculum</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Sequential, numbered implementation steps with badges and realistic time estimates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Commands, code examples, and exact edits are included when relevant.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Embedded Technical Companion for instant explanations, gotchas & quizzes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* How It Works (4 Steps) with Spotlight Cards */}
      <FadeContent className="relative z-10 py-16 max-w-6xl mx-auto px-4 sm:px-6" duration={600}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Workflow Pipeline</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How CourseIT Ai Synthesizes Learning
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
            From dense documentation to working code in four focused, high-retention steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WORKFLOW_STEPS.map((ws) => (
            <SpotlightCard key={ws.step} className="space-y-3.5 flex flex-col justify-between">
              <div>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold font-mono text-sm mb-3 ${ws.accent} ${ws.badgeBg}`}>
                  {ws.step}
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{ws.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ws.desc}
                </p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </FadeContent>

      {/* Multi-Ecosystem Docs Showcase Section */}
      <FadeContent className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/40" duration={600}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-2">
                <Boxes className="w-3.5 h-3.5" />
                <span>Multi-Framework Documentation Showcase</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Curated Starter Courses Across Any Ecosystem
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore real action-first courses generated from official developer documentation:
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onLaunchApp) onLaunchApp();
                else navigate('/app');
              }}
              className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Explore All in Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CURATED_DEMOS.map((demo) => {
              const Icon = demo.icon;
              return (
                <div
                  key={demo.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800/90 hover:border-indigo-500/40 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{demo.category}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {demo.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {demo.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {demo.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>{demo.steps} action steps</span>
                      <span>&bull;</span>
                      <span>{demo.time}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onLaunchApp) onLaunchApp();
                        else navigate('/app');
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Try Generator</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FadeContent>

      {/* Model Pricing Tiers */}
      <FadeContent className="relative z-10 py-16 max-w-6xl mx-auto px-4 sm:px-6" duration={600}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Transparent Credit Economy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            250 Beta Credits on Admin Approval
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Pick the exact reasoning tier you need for each task. Unauthenticated guests can generate 3 free courses with the Fast Tier. Approved beta testers unlock all tiers with 250 beta credits. CourseIT credits are internal usage units and do not equal cash, USD, or provider API dollars.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODEL_PRICING.map((m) => (
            <div
              key={m.tier}
              className="glass-panel p-5 rounded-3xl border border-slate-800/90 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {m.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{m.speed}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{m.tier}</h4>
                <div className="text-lg font-mono font-extrabold text-indigo-400 my-1">
                  {m.cost}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </div>

              <div className={`pt-3 border-t border-slate-800/80 text-[11px] font-mono ${
                m.tier.includes('Fast Tier') ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {m.trialLabel}
              </div>
            </div>
          ))}
        </div>
      </FadeContent>

      {/* Footer CTA */}
      <FadeContent className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/80 text-center" duration={600}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to experience action-first documentation?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Create an account today to request 250 beta credits upon admin approval, save your generated curricula, and access client-side document OCR. Complimentary CourseIT usage credits for approved beta accounts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleOpenAuth('signup');
              }}
              className="px-6 py-3 rounded-2xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Request Beta Access (250 Credits) &rarr;
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleOpenAuth('login');
              }}
              className="px-6 py-3 rounded-2xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
            >
              Existing User Sign In
            </button>
          </div>
        </div>
      </FadeContent>

      {/* Full Developer Portfolio Footer */}
      <Footer onOpenChangelog={() => setIsChangelogOpen(true)} showPoweredBy={true} />

      {/* Modals */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      <AdminModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authState={authState}
        initialMode={authInitialMode}
        onAuthChange={() => {
          setIsAuthModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

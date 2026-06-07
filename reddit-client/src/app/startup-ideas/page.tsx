"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, MagnifyingGlass, CircleNotch, Robot, TrendUp, Fire,
  ArrowLeft, Sparkle, Gear, Eye, EyeSlash, Clock, Play, Stop,
  CheckCircle, XCircle, Plus, X, Link as LinkIcon, Bell
} from "@phosphor-icons/react";
import Link from "next/link";

type StartupIdea = {
  id: string; problem: string; solution: string; title?: string;
  upvotes: number; source: string; sentiment: "Negative" | "Frustrated" | "Neutral";
};

type UserConfig = {
  redditClientId: string; redditClientSecret: string;
  redditUsername: string; redditPassword: string;
  openaiApiKey: string; subreddits: string[];
  postToReddit: boolean; targetSubreddit: string;
  scheduleEnabled: boolean; scheduleInterval: number;
};

const DEFAULT_CONFIG: UserConfig = {
  redditClientId: "", redditClientSecret: "", redditUsername: "",
  redditPassword: "", openaiApiKey: "", subreddits: ["SaaS", "Entrepreneur", "startups"],
  postToReddit: false, targetSubreddit: "", scheduleEnabled: false, scheduleInterval: 60,
};

const STORAGE_KEY = "ai_startup_finder_config";

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      {children}
    </span>
  );
}

type InputFieldProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hint?: string;
};

function InputField({ label, type = "text", value, onChange, placeholder, hint }: InputFieldProps) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">{label}</label>
      {hint && <p className="text-xs text-zinc-500 mb-2">{hint}</p>}
      <div className="relative">
        <input
          type={isPass && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black/30 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
            {show ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StartupIdeaFinder() {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<"setup" | "running" | "results">("setup");
  const [stage, setStage] = useState<"scraping" | "analyzing">("scraping");
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newSub, setNewSub] = useState("");
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [postedLinks, setPostedLinks] = useState<string[]>([]);
  const [nextRunIn, setNextRunIn] = useState<number>(0);
  const [runCount, setRunCount] = useState(0);
  const [analysisMode, setAnalysisMode] = useState<"demo" | "openai" | null>(null);
  const [dataSource, setDataSource] = useState<"reddit" | "sample" | null>(null);
  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canRun = config.subreddits.length > 0;
  const hasOpenAI = !!config.openaiApiKey;
  const canAutoPost = !!(config.redditClientId && config.redditClientSecret && config.redditUsername && config.redditPassword);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setConfig(JSON.parse(saved));
    } catch {}
  }, []);

  const saveConfig = (updated: UserConfig) => {
    setConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const upd = (key: keyof UserConfig, val: UserConfig[keyof UserConfig]) => saveConfig({ ...config, [key]: val });

  const runAnalysis = useCallback(async () => {
    if (!canRun) { setError("Add at least one subreddit to scrape."); setView("setup"); return; }
    if (config.postToReddit && !canAutoPost) {
      setError("Auto-post requires Reddit Client ID, Secret, Username, and Password.");
      setView("setup");
      return;
    }
    setView("running"); setStage("scraping"); setError(null);
    try {
      await new Promise(r => setTimeout(r, 600));
      setStage("analyzing");
      const res = await fetch("/api/startup-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redditClientId: config.redditClientId,
          redditClientSecret: config.redditClientSecret,
          redditUsername: config.redditUsername,
          redditPassword: config.redditPassword,
          openaiApiKey: config.openaiApiKey,
          subreddits: config.subreddits.join("+"),
          postToReddit: config.postToReddit,
          targetSubreddit: config.targetSubreddit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate ideas.");
      setIdeas(data.ideas || []);
      setPostedLinks(data.postedLinks || []);
      setAnalysisMode(data.mode === "openai" ? "openai" : "demo");
      setDataSource(data.dataSource === "reddit" ? "reddit" : "sample");
      setLastRun(new Date().toLocaleTimeString());
      setRunCount(c => c + 1);
      setView("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setView("setup");
    }
  }, [config, canRun, canAutoPost]);

  const startSchedule = () => {
    upd("scheduleEnabled", true);
    runAnalysis();
    const ms = config.scheduleInterval * 60 * 1000;
    setNextRunIn(config.scheduleInterval * 60);
    scheduleRef.current = setInterval(runAnalysis, ms);
    countdownRef.current = setInterval(() => setNextRunIn(n => (n <= 1 ? config.scheduleInterval * 60 : n - 1)), 1000);
  };

  const stopSchedule = () => {
    upd("scheduleEnabled", false);
    if (scheduleRef.current) clearInterval(scheduleRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    scheduleRef.current = null; countdownRef.current = null;
    setNextRunIn(0);
  };

  useEffect(() => () => { if (scheduleRef.current) clearInterval(scheduleRef.current); if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const addSub = () => {
    const s = newSub.replace("r/", "").trim();
    if (s && !config.subreddits.includes(s)) upd("subreddits", [...config.subreddits, s]);
    setNewSub("");
  };

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-16">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-15 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#ff7a00,transparent_70%)] blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,122,0,0.35)]">
              <Lightbulb weight="fill" className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Startup Idea Finder</h1>
              <p className="text-zinc-400 text-sm mt-1">Scrape Reddit · Analyze with AI · Auto-post ideas</p>
            </div>
          </div>
          {/* Status badges */}
          <div className="flex flex-col items-end gap-2">
            {runCount > 0 && <Badge color="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle size={12} /> {runCount} run{runCount > 1 ? "s" : ""}</Badge>}
            {lastRun && <p className="text-xs text-zinc-500">Last: {lastRun}</p>}
            {config.scheduleEnabled && nextRunIn > 0 && (
              <Badge color="bg-orange-500/10 text-orange-400 border-orange-500/20"><Clock size={12} /> Next in {fmtCountdown(nextRunIn)}</Badge>
            )}
            {!hasOpenAI && <Badge color="bg-blue-500/10 text-blue-400 border-blue-500/20">Demo mode</Badge>}
            {analysisMode === "openai" && <Badge color="bg-purple-500/10 text-purple-400 border-purple-500/20">GPT powered</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Setup Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Credentials Card */}
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Gear className="text-orange-400" size={18} />
                <h2 className="font-semibold text-sm">API Credentials</h2>
                {hasOpenAI && <CheckCircle className="text-green-400 ml-auto" size={16} />}
              </div>
              <p className="text-xs text-zinc-500 mb-3">Optional — leave blank to use free demo mode with live Reddit data.</p>
              <div className="space-y-3">
                <InputField label="Reddit Client ID" value={config.redditClientId} onChange={(v: string) => upd("redditClientId", v)} placeholder="Optional — for auto-posting" hint="From reddit.com/prefs/apps" />
                <InputField label="Reddit Client Secret" type="password" value={config.redditClientSecret} onChange={(v: string) => upd("redditClientSecret", v)} placeholder="Optional" />
                <InputField label="OpenAI API Key" type="password" value={config.openaiApiKey} onChange={(v: string) => upd("openaiApiKey", v)} placeholder="Optional — enables GPT analysis" hint="From platform.openai.com" />
              </div>
            </div>

            {/* Auto-Post Card */}
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="text-orange-400" size={18} />
                <h2 className="font-semibold text-sm">Auto-Post to Reddit</h2>
                <label className="ml-auto relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.postToReddit} onChange={e => upd("postToReddit", e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-700 peer-checked:bg-orange-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <AnimatePresence>
                {config.postToReddit && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                    <InputField label="Reddit Username" value={config.redditUsername} onChange={(v: string) => upd("redditUsername", v)} placeholder="u/your_bot_account" />
                    <InputField label="Reddit Password" type="password" value={config.redditPassword} onChange={(v: string) => upd("redditPassword", v)} placeholder="Bot account password" />
                    <InputField label="Target Subreddit" value={config.targetSubreddit} onChange={(v: string) => upd("targetSubreddit", v)} placeholder="r/your_subreddit" hint="Where to post ideas" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subreddits Card */}
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MagnifyingGlass className="text-orange-400" size={18} />
                <h2 className="font-semibold text-sm">Subreddits to Scrape</h2>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {config.subreddits.map(s => (
                  <span key={s} className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">
                    r/{s}
                    <button onClick={() => upd("subreddits", config.subreddits.filter(x => x !== s))} className="hover:text-red-400 transition-colors ml-0.5"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === "Enter" && addSub()}
                  placeholder="Add subreddit..." className="flex-1 bg-black/30 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-all" />
                <button onClick={addSub} className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded-lg px-3 transition-all"><Plus size={14} /></button>
              </div>
            </div>

            {/* Scheduler Card */}
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="text-orange-400" size={18} />
                <h2 className="font-semibold text-sm">Auto-Schedule</h2>
              </div>
              <div className="mb-4">
                <label className="text-xs text-zinc-400 mb-2 block">Run every (minutes)</label>
                <div className="flex gap-2 flex-wrap">
                  {[30, 60, 120, 360, 720].map(m => (
                    <button key={m} onClick={() => upd("scheduleInterval", m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${config.scheduleInterval === m ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>
                      {m >= 60 ? `${m / 60}h` : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {!config.scheduleEnabled ? (
                  <button onClick={startSchedule} disabled={!canRun}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-medium transition-all">
                    <Play size={14} weight="fill" /> Start Automation
                  </button>
                ) : (
                  <button onClick={stopSchedule}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl py-2.5 text-sm font-medium transition-all">
                    <Stop size={14} weight="fill" /> Stop Automation
                  </button>
                )}
                <button onClick={runAnalysis} disabled={!canRun || view === "running"}
                  className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all">
                  <Sparkle size={14} weight="fill" className="text-orange-400" /> Run Once
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2 text-center">Works instantly in demo mode — no keys required</p>
            </div>
          </div>

          {/* RIGHT: Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl min-h-[600px] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Robot className="text-orange-400" size={20} />
                  <span className="font-semibold text-sm">AI Analysis Results</span>
                  {ideas.length > 0 && <Badge color="bg-zinc-800 text-zinc-300 border-zinc-700">{ideas.length} ideas</Badge>}
                </div>
                {ideas.length > 0 && (
                  <button onClick={runAnalysis} disabled={view === "running"}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-full transition-all disabled:opacity-40">
                    <MagnifyingGlass size={12} /> Re-run
                  </button>
                )}
              </div>

              <div className="flex-1 p-6">
                <AnimatePresence mode="wait">
                  {/* IDLE STATE */}
                  {view === "setup" && ideas.length === 0 && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 relative">
                        <MagnifyingGlass weight="duotone" className="text-orange-400 text-4xl" size={36} />
                        <div className="absolute inset-0 border border-orange-400/30 rounded-full animate-ping opacity-40" />
                      </div>
                      <h2 className="text-xl font-semibold mb-3">Ready to Find Ideas</h2>
                      <p className="text-zinc-400 text-sm max-w-sm leading-relaxed mb-2">
                        Click <strong className="text-white">Run Once</strong> to scrape live Reddit posts and generate startup ideas instantly.
                      </p>
                      <p className="text-zinc-600 text-xs">Add OpenAI &amp; Reddit keys for GPT analysis and auto-posting. Config is saved locally.</p>

                      {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="mt-6 w-full max-w-sm p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                          <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* RUNNING STATE */}
                  {view === "running" && (
                    <motion.div key="running" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-16">
                      {stage === "scraping" ? (
                        <>
                          <CircleNotch weight="bold" className="animate-spin text-orange-400 mb-6" size={48} />
                          <h2 className="text-xl font-semibold mb-2">Scraping Reddit...</h2>
                          <p className="text-zinc-400 text-sm">Fetching hot posts from {config.subreddits.map(s => `r/${s}`).join(", ")}</p>
                        </>
                      ) : (
                        <>
                          <Robot weight="duotone" className="animate-bounce text-orange-400 mb-6" size={48} />
                          <h2 className="text-xl font-semibold mb-2">AI Analyzing Problems...</h2>
                          <p className="text-zinc-400 text-sm">{hasOpenAI ? "Using GPT to find patterns and generate startup ideas" : "Generating ideas from top Reddit posts"}</p>
                        </>
                      )}
                      <div className="mt-8 flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="w-2 h-2 bg-orange-400 rounded-full"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* RESULTS STATE */}
                  {(view === "results" || (view === "setup" && ideas.length > 0)) && ideas.length > 0 && (
                    <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                          <XCircle size={14} /> {error}
                        </div>
                      )}
                      {analysisMode === "demo" && (
                        <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
                          Demo mode — {dataSource === "reddit" ? "ideas from live Reddit posts" : "using curated sample posts (Reddit API unavailable)"}. Add an OpenAI key for GPT analysis.
                        </div>
                      )}
                      {postedLinks.length > 0 && (
                        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                          <div className="flex items-center gap-2 mb-1 font-semibold"><CheckCircle size={14} /> Posted {postedLinks.length} idea{postedLinks.length > 1 ? "s" : ""} to Reddit!</div>
                          {postedLinks.map((l, i) => (
                            <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline mt-0.5 opacity-80">
                              <LinkIcon size={10} /> {l}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="space-y-5">
                        {ideas.map((idea, i) => (
                          <motion.div key={idea.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                            className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all group">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <Badge color="bg-orange-500/10 text-orange-400 border-orange-500/20"><TrendUp size={11} weight="bold" /> {idea.source}</Badge>
                              <Badge color="bg-red-500/10 text-red-400 border-red-500/20"><Fire size={11} weight="bold" /> {idea.upvotes?.toLocaleString()} upvotes</Badge>
                              <Badge color="bg-zinc-800 text-zinc-300 border-zinc-700">{idea.sentiment}</Badge>
                            </div>
                            {idea.title && <h3 className="text-base font-semibold text-white mb-3">{idea.title}</h3>}
                            <div className="mb-4">
                              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Identified Problem</p>
                              <p className="text-sm leading-relaxed text-zinc-300 bg-black/20 p-3 rounded-xl border border-white/5">&ldquo;{idea.problem}&rdquo;</p>
                            </div>
                            <div>
                              <p className="text-xs text-orange-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><Sparkle size={11} weight="fill" /> AI Solution</p>
                              <p className="text-sm leading-relaxed text-white">{idea.solution}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">How it works</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: "1", t: "Pick Subreddits", d: "Choose communities to monitor — demo mode works with zero setup." },
              { n: "2", t: "Run Analysis", d: "Scrape hot posts and generate ideas instantly in demo mode." },
              { n: "3", t: "Add OpenAI (Optional)", d: "GPT reads posts, finds patterns, and proposes startup solutions." },
              { n: "4", t: "Auto-Post (Optional)", d: "Bot posts ideas directly to a subreddit on your schedule." },
            ].map(s => (
              <div key={s.n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
                <div><p className="text-sm font-medium text-white">{s.t}</p><p className="text-xs text-zinc-500 mt-0.5">{s.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  RedditLogo,
  Plus,
  CheckCircle,
  CircleNotch,
  PaperPlaneRight,
  ArrowLeft,
} from "@phosphor-icons/react";

type RedditAccount = {
  id: string;
  username: string;
  avatar: string;
};

type Post = {
  id: string;
  subreddit: string;
  title: string;
  content: string;
  accountId: string;
  status: "draft" | "published";
};

type ViewState = "connect" | "accounts" | "compose" | "success";

export default function RedditWorkspace() {
  const [viewState, setViewState] = useState<ViewState>("connect");
  const [accounts, setAccounts] = useState<RedditAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<RedditAccount | null>(null);

  // Form State
  const [subreddit, setSubreddit] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    // Auto-switch to accounts if we have some and are on connect screen
    if (accounts.length > 0 && viewState === "connect") {
      setViewState("accounts");
    }
  }, [accounts, viewState]);

  const handleConnect = () => {
    setIsConnecting(true);
    // Mock OAuth delay
    setTimeout(() => {
      const newAccount: RedditAccount = {
        id: Math.random().toString(36).substring(7),
        username: `u/developer_${Math.floor(Math.random() * 1000)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      };
      setAccounts((prev) => [...prev, newAccount]);
      setIsConnecting(false);
      setViewState("accounts");
    }, 1500);
  };

  const handlePost = () => {
    if (!selectedAccount || !subreddit || !title) return;
    setIsPosting(true);
    setTimeout(() => {
      const newPost: Post = {
        id: Math.random().toString(36).substring(7),
        subreddit,
        title,
        content,
        accountId: selectedAccount.id,
        status: "published",
      };
      setPosts((prev) => [newPost, ...prev]);
      setIsPosting(false);
      setViewState("success");
    }, 1200);
  };

  const resetForm = () => {
    setSubreddit("");
    setTitle("");
    setContent("");
    setViewState("accounts");
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-white pt-24 pb-12 px-6 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff4500,transparent_70%)] blur-[80px]"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff4500] to-[#ff8700] flex items-center justify-center shadow-[0_0_30px_rgba(255,69,0,0.3)]">
            <RedditLogo weight="fill" className="text-white text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">Reddit Connect</h1>
            <p className="text-[var(--text-muted)] text-sm">Connect accounts and manage posts.</p>
          </div>
        </div>

        <div className="tech-card tech-card--lg tech-card--beam shadow-2xl">
          <div className="tech-card__inner p-8 md:p-12 min-h-[500px] flex flex-col relative">
            <div className="tech-card__grid"></div>
            
            <AnimatePresence mode="wait">
              {/* CONNECT SCREEN */}
              {viewState === "connect" && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto"
                >
                  <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6 relative">
                    <RedditLogo weight="duotone" className="text-[#ff4500] text-4xl" />
                    <div className="absolute inset-0 border border-[#ff4500] rounded-full animate-ping opacity-20"></div>
                  </div>
                  <h2 className="text-2xl font-display font-medium mb-3">Connect your account</h2>
                  <p className="text-[var(--text-muted)] mb-8">
                    Link your Reddit account to start scheduling and publishing posts directly from the workspace.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="relative group overflow-hidden rounded-full bg-white text-black px-8 py-3.5 font-medium flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff4500] to-[#ff8700] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    {isConnecting ? (
                      <CircleNotch weight="bold" className="animate-spin text-xl" />
                    ) : (
                      <RedditLogo weight="bold" className="text-xl text-[#ff4500]" />
                    )}
                    <span>{isConnecting ? "Connecting..." : "Continue with Reddit"}</span>
                  </button>
                </motion.div>
              )}

              {/* ACCOUNTS LIST SCREEN */}
              {viewState === "accounts" && (
                <motion.div
                  key="accounts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-display font-medium">Connected Accounts</h2>
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="flex items-center gap-2 text-sm font-medium text-[var(--unify-highlight)] hover:text-white transition-colors"
                    >
                      {isConnecting ? <CircleNotch className="animate-spin" /> : <Plus />}
                      Add Account
                    </button>
                  </div>

                  <div className="grid gap-4 mb-10">
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="group p-4 rounded-2xl border border-[var(--border-glass)] bg-[var(--glass-bg)] hover:bg-[rgba(255,255,255,0.08)] transition-all flex items-center justify-between backdrop-blur-md cursor-default"
                      >
                        <div className="flex items-center gap-4">
                          <img src={acc.avatar} alt={acc.username} className="w-12 h-12 rounded-full bg-[#222]" />
                          <div>
                            <p className="font-medium text-lg">{acc.username}</p>
                            <p className="text-[var(--text-muted)] text-sm flex items-center gap-1">
                              <CheckCircle weight="fill" className="text-green-500" /> Connected
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAccount(acc);
                            setViewState("compose");
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          <PaperPlaneRight weight="bold" />
                          Compose Post
                        </button>
                      </div>
                    ))}
                  </div>

                  {posts.length > 0 && (
                    <>
                      <h3 className="text-lg font-display font-medium mb-4 mt-auto">Recent Posts</h3>
                      <div className="grid gap-3">
                        {posts.map((post) => (
                          <div key={post.id} className="p-3 rounded-xl border border-[var(--border-glass)] bg-[rgba(0,0,0,0.2)] text-sm">
                            <div className="flex items-center gap-2 mb-1 text-[var(--text-muted)]">
                              <span className="text-[#ff4500] font-medium">r/{post.subreddit}</span>
                              <span>•</span>
                              <span>{accounts.find(a => a.id === post.accountId)?.username}</span>
                            </div>
                            <p className="font-medium truncate">{post.title}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* COMPOSE SCREEN */}
              {viewState === "compose" && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col w-full h-full"
                >
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setViewState("accounts")}
                      className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      <ArrowLeft /> Back
                    </button>
                    <div className="flex items-center gap-2 text-sm bg-[var(--glass-bg)] px-3 py-1.5 rounded-full border border-[var(--border-glass)]">
                      <img src={selectedAccount?.avatar} alt="Avatar" className="w-5 h-5 rounded-full" />
                      <span className="font-medium">{selectedAccount?.username}</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium">r/</span>
                      <input
                        type="text"
                        placeholder="subreddit"
                        value={subreddit}
                        onChange={(e) => setSubreddit(e.target.value)}
                        className="w-full bg-[#111] border border-[#333] focus:border-[#ff4500] rounded-xl px-10 py-3 text-white outline-none transition-colors"
                      />
                    </div>
                    
                    <input
                      type="text"
                      placeholder="An interesting title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] focus:border-[#ff4500] rounded-xl px-4 py-3 text-white outline-none transition-colors text-lg font-medium"
                    />

                    <textarea
                      placeholder="Text (optional)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] focus:border-[#ff4500] rounded-xl px-4 py-3 text-white outline-none transition-colors min-h-[200px] resize-none"
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handlePost}
                      disabled={isPosting || !title || !subreddit}
                      className="bg-[#ff4500] hover:bg-[#ff5722] text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,69,0,0.3)]"
                    >
                      {isPosting ? <CircleNotch className="animate-spin" /> : <PaperPlaneRight weight="fill" />}
                      {isPosting ? "Posting..." : "Post to Reddit"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SUCCESS SCREEN */}
              {viewState === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col items-center justify-center text-center h-full"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6 text-green-500">
                    <CheckCircle weight="fill" className="text-5xl" />
                  </div>
                  <h2 className="text-2xl font-display font-medium mb-3">Posted Successfully!</h2>
                  <p className="text-[var(--text-muted)] mb-8">
                    Your post has been securely saved to the workspace mock store.
                  </p>
                  <button
                    onClick={resetForm}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-medium transition-colors"
                  >
                    Back to Accounts
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { RedditLogo, Lightbulb, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#ff4500,transparent_70%)] blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <RedditLogo weight="fill" size={14} />
            Reddit App Suite
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Build, Post &amp; Discover on Reddit
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Connect accounts, publish posts, and find AI-generated startup ideas from real community pain points.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/reddit"
            className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-[#ff4500]/40 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff4500] to-[#ff8700] flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(255,69,0,0.25)]">
              <RedditLogo weight="fill" className="text-white text-3xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-[#ff4500] transition-colors">
              Reddit Connect
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Link Reddit accounts, compose posts, and manage your publishing workflow from one workspace.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#ff4500]">
              Open workspace <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            href="/startup-ideas"
            className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-orange-500/40 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(255,122,0,0.25)]">
              <Lightbulb weight="fill" className="text-white text-3xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-orange-400 transition-colors">
              AI Startup Idea Finder
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Scrape hot Reddit posts, analyze problems with AI, and optionally auto-post startup ideas.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-orange-400">
              Find ideas now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        <div className="mt-12 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-center">
          <p className="text-sm text-zinc-400">
            <strong className="text-white">Demo mode works out of the box</strong> — no API keys needed to scrape Reddit and generate ideas.
            Add OpenAI &amp; Reddit credentials for GPT-powered analysis and auto-posting.
          </p>
        </div>
      </main>
    </div>
  );
}

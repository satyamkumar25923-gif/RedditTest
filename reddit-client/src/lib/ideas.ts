import OpenAI from 'openai';
import type { RedditPost } from './reddit';

export type StartupIdea = {
  id: string;
  problem: string;
  solution: string;
  sentiment: 'Frustrated' | 'Negative' | 'Neutral';
  source: string;
  upvotes: number;
  title?: string;
};

function detectSentiment(text: string): StartupIdea['sentiment'] {
  const lower = text.toLowerCase();
  if (/frustrat|annoying|hate|terrible|awful|nightmare|struggling/.test(lower)) return 'Frustrated';
  if (/can't|cannot|broken|fail|problem|issue|difficult|hard to/.test(lower)) return 'Negative';
  return 'Neutral';
}

function excerpt(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}…`;
}

function buildSolution(title: string, problem: string): string {
  const topic = title.replace(/\[.*?\]/g, '').trim() || problem.slice(0, 60);
  const templates = [
    `Build an AI-powered SaaS that monitors ${topic.toLowerCase()} pain points and automates the most repetitive workflows for founders.`,
    `Create a lightweight platform that aggregates community feedback on "${topic}" and turns it into actionable product specs.`,
    `Launch a subscription tool that uses AI to validate, prototype, and pitch solutions for problems like "${topic}".`,
    `Offer a niche marketplace connecting people facing "${topic}" issues with vetted freelancers and micro-SaaS tools.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function buildTitle(problem: string): string {
  const words = problem.split(/\s+/).slice(0, 5).join(' ');
  return words.length > 40 ? `${words.slice(0, 40)}…` : words;
}

export function generateIdeasLocally(posts: RedditPost[], count = 3): StartupIdea[] {
  const sorted = [...posts].sort((a, b) => b.upvotes - a.upvotes);
  const picked = sorted.slice(0, count);

  return picked.map((post) => {
    const problem = excerpt(post.selftext || post.title);
    const sentiment = detectSentiment(`${post.title} ${post.selftext}`);
    return {
      id: Math.random().toString(36).substring(7),
      problem,
      solution: buildSolution(post.title, problem),
      sentiment,
      source: post.subreddit,
      upvotes: post.upvotes,
      title: buildTitle(post.title),
    };
  });
}

export async function generateIdeasWithOpenAI(
  posts: RedditPost[],
  apiKey: string
): Promise<StartupIdea[]> {
  const openai = new OpenAI({ apiKey });
  const sample = posts.slice(0, 12);

  const prompt = `Analyze these Reddit posts from entrepreneurship communities.
Find 3 recurring problems people complain about. For each, propose a SaaS/AI startup idea.

Return ONLY valid JSON in this exact format:
{
  "ideas": [
    {
      "problem": "Detailed description of the problem",
      "solution": "The proposed startup/SaaS solution",
      "sentiment": "Frustrated",
      "source": "r/SaaS",
      "upvotes": 450,
      "title": "Catchy idea title"
    }
  ]
}

Sentiment must be one of: Frustrated, Negative, Neutral.

Posts:
${JSON.stringify(sample)}`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
    response_format: { type: 'json_object' },
  });

  const resultText = completion.choices[0]?.message?.content;
  if (!resultText) throw new Error('OpenAI returned an empty response.');

  const parsed = JSON.parse(resultText) as {
    ideas: Omit<StartupIdea, 'id'>[];
  };

  return parsed.ideas.map((idea) => ({
    ...idea,
    id: Math.random().toString(36).substring(7),
  }));
}

export async function generateSingleIdeaWithOpenAI(
  posts: RedditPost[],
  apiKey: string
): Promise<{ problem: string; solution: string; title: string }> {
  const openai = new OpenAI({ apiKey });

  const prompt = `Analyze these Reddit posts from entrepreneurship communities.
Find 1 interesting problem and propose a SaaS or AI startup idea.

Return ONLY valid JSON:
{
  "problem": "...",
  "solution": "...",
  "title": "Catchy idea title"
}

Posts:
${JSON.stringify(posts.slice(0, 10))}`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
    response_format: { type: 'json_object' },
  });

  const resultText = completion.choices[0]?.message?.content;
  if (!resultText) throw new Error('OpenAI returned empty response.');
  return JSON.parse(resultText);
}

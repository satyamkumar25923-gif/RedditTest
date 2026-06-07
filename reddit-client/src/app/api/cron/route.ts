import { NextResponse } from 'next/server';
import { fetchRedditPosts, getRedditAccessToken, postIdeaToReddit } from '@/lib/reddit';
import { generateIdeasLocally, generateSingleIdeaWithOpenAI } from '@/lib/ideas';

export async function GET() {
  try {
    const subreddits = process.env.REDDIT_SUBREDDITS || 'SaaS+Entrepreneur+startups';
    const { posts, source: dataSource } = await fetchRedditPosts(subreddits, 25, 80);

    const openaiKey = process.env.OPENAI_API_KEY;
    const idea = openaiKey
      ? await generateSingleIdeaWithOpenAI(posts, openaiKey)
      : (() => {
          const local = generateIdeasLocally(posts, 1)[0];
          return { problem: local.problem, solution: local.solution, title: local.title || 'Startup Idea' };
        })();

    const hasPostCreds =
      process.env.REDDIT_CLIENT_ID &&
      process.env.REDDIT_CLIENT_SECRET &&
      process.env.REDDIT_USERNAME &&
      process.env.REDDIT_PASSWORD;

    if (!hasPostCreds) {
      return NextResponse.json({
        success: true,
        mode: 'demo',
        dataSource,
        message: 'Idea generated in demo mode. Set Reddit credentials in .env.local to enable auto-posting.',
        idea,
        totalScraped: posts.length,
      });
    }

    const accessToken = await getRedditAccessToken(
      process.env.REDDIT_CLIENT_ID!,
      process.env.REDDIT_CLIENT_SECRET!,
      process.env.REDDIT_USERNAME,
      process.env.REDDIT_PASSWORD
    );

    const targetSub = process.env.REDDIT_TARGET_SUBREDDIT || 'test';
    const postTitle = `[AI Idea] ${idea.title}`;
    const postBody = `**Identified Problem:**\n${idea.problem}\n\n**AI Proposed Solution:**\n${idea.solution}\n\n_Generated automatically by AI Startup Idea Finder Cron._`;

    const postUrl = await postIdeaToReddit(accessToken, targetSub, postTitle, postBody);
    if (!postUrl) throw new Error('Failed to post idea to Reddit.');

    return NextResponse.json({
      success: true,
      mode: openaiKey ? 'openai' : 'demo',
      dataSource,
      message: 'Idea generated and posted successfully',
      postUrl,
      idea,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in cron API:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

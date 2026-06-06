import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
  try {
    // 1. Authenticate with Reddit
    const basicAuth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
    
    // We need a user token to post, but for cron we might just use client_credentials 
    // Wait, client_credentials cannot submit posts. We need a password grant or refresh token.
    // Let's assume the user has REDDIT_USERNAME and REDDIT_PASSWORD in env for bot posting.
    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'StartupIdeaFinderCron/1.0'
      },
      // Using password grant for script app to be able to post
      body: `grant_type=password&username=${process.env.REDDIT_USERNAME}&password=${process.env.REDDIT_PASSWORD}`
    });

    if (!tokenRes.ok) {
      throw new Error('Failed to authenticate with Reddit for bot. Check credentials.');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
        throw new Error('No access token received.');
    }

    // 2. Fetch recent hot posts from entrepreneurship subreddits
    const subreddits = 'SaaS+Entrepreneur+startups';
    const postsRes = await fetch(`https://oauth.reddit.com/r/${subreddits}/hot?limit=25`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'StartupIdeaFinderCron/1.0'
      }
    });

    if (!postsRes.ok) {
      throw new Error('Failed to fetch posts from Reddit.');
    }

    const postsData = await postsRes.json();
    const posts = postsData.data.children.map((child: any) => ({
      title: child.data.title,
      selftext: child.data.selftext,
      subreddit: child.data.subreddit,
      upvotes: child.data.ups,
    }));

    // Filter out posts that are too short to be meaningful problems
    const meaningfulPosts = posts.filter((p: any) => p.selftext && p.selftext.length > 100).slice(0, 10);

    // 3. Analyze with OpenAI
    const prompt = `
    Analyze the following Reddit posts from entrepreneurship communities. 
    Find 1 recurring or interesting problem that people are complaining about or asking for help with.
    Propose a SaaS or AI startup idea that solves it.
    
    Return the output strictly in this JSON format:
    {
      "problem": "Detailed description of the problem",
      "solution": "The proposed startup/SaaS solution",
      "title": "Catchy title for the idea"
    }

    Here are the posts:
    ${JSON.stringify(meaningfulPosts)}
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
    });

    const resultText = completion.choices[0]?.message?.content;
    if (!resultText) {
      throw new Error('OpenAI returned empty response.');
    }

    const parsedResult = JSON.parse(resultText);

    // 4. Post the generated idea to the Devvit app subreddit (teri_ma_ka_dev)
    const postTitle = `[AI Idea] ${parsedResult.title}`;
    const postBody = `**Identified Problem:**\n${parsedResult.problem}\n\n**AI Proposed Solution:**\n${parsedResult.solution}\n\n_Generated automatically by AI Startup Idea Finder Cron._`;

    const submitRes = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'StartupIdeaFinderCron/1.0'
      },
      body: new URLSearchParams({
        api_type: 'json',
        kind: 'self',
        sr: 'teri_ma_ka_dev',
        title: postTitle,
        text: postBody
      }).toString()
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      console.error('Failed to post to Reddit:', errorText);
      throw new Error('Failed to post idea to Reddit.');
    }

    const submitData = await submitRes.json();

    return NextResponse.json({ 
        success: true, 
        message: 'Idea generated and posted successfully',
        post: submitData
    });

  } catch (error: any) {
    console.error('Error in cron API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

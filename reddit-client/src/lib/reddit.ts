const USER_AGENT = 'web:AIStartupFinder:1.0 (by /u/startup_finder)';

export type RedditPost = {
  title: string;
  selftext: string;
  subreddit: string;
  upvotes: number;
};

export const SAMPLE_POSTS: RedditPost[] = [
  {
    title: 'Spent 6 months building a SaaS nobody wanted',
    selftext: 'I launched without talking to users first. The biggest lesson: validate the problem before writing code. I wish there was a tool that scraped communities and surfaced real pain points automatically so founders could spot demand early.',
    subreddit: 'r/SaaS',
    upvotes: 842,
  },
  {
    title: 'How do you find your first 10 customers?',
    selftext: 'I have a working MVP but struggle to get anyone to try it. Cold outreach feels impossible and ads are too expensive. Looking for a systematic way to find people actively complaining about the problem I solve.',
    subreddit: 'r/Entrepreneur',
    upvotes: 531,
  },
  {
    title: 'Reddit is underrated for market research',
    selftext: 'I manually read through dozens of threads every week to find startup ideas. It works but takes hours. Would pay for something that monitors subreddits and summarizes recurring frustrations with suggested product angles.',
    subreddit: 'r/startups',
    upvotes: 1204,
  },
  {
    title: 'Anyone automating content distribution?',
    selftext: 'Posting to multiple subreddits is tedious and easy to mess up formatting. I keep copying the same post across communities and losing track of what was published where. Need a simple scheduler built for Reddit specifically.',
    subreddit: 'r/SaaS',
    upvotes: 287,
  },
  {
    title: 'Bootstrapped founder — tired of idea paralysis',
    selftext: 'There are too many ideas and not enough signal. I want a feed of validated problems ranked by how often people complain about them online, not another listicle of generic startup ideas.',
    subreddit: 'r/Entrepreneur',
    upvotes: 415,
  },
];

type RedditChild = {
  data: {
    title: string;
    selftext: string;
    subreddit: string;
    ups: number;
  };
};

export async function fetchRedditPosts(
  subreddits: string,
  limit = 30,
  minTextLength = 40
): Promise<{ posts: RedditPost[]; source: 'reddit' | 'sample' }> {
  try {
    const query = subreddits.replace(/\s/g, '').replace(/,/g, '+');
    const url = `https://www.reddit.com/r/${query}/hot.json?limit=${limit}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`Reddit returned ${res.status}`);

    const data = await res.json();
    const children = data?.data?.children as RedditChild[] | undefined;
    if (!children?.length) throw new Error('No posts returned from Reddit.');

    const posts = children.map((child) => ({
      title: child.data.title,
      selftext: child.data.selftext,
      subreddit: `r/${child.data.subreddit}`,
      upvotes: child.data.ups,
    })).filter((p) => {
      const text = p.selftext || p.title;
      return text.length >= minTextLength;
    });

    if (posts.length === 0) throw new Error('No meaningful posts found.');
    return { posts, source: 'reddit' };
  } catch {
    const subs = subreddits.split(/[+,\s]+/).filter(Boolean);
    const posts = SAMPLE_POSTS.map((p, i) => ({
      ...p,
      subreddit: subs[i % subs.length] ? `r/${subs[i % subs.length].replace(/^r\//, '')}` : p.subreddit,
    }));
    return { posts, source: 'sample' };
  }
}

export async function getRedditAccessToken(
  clientId: string,
  clientSecret: string,
  username?: string,
  password?: string
): Promise<string> {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const grantBody =
    username && password
      ? `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      : 'grant_type=client_credentials';

  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: grantBody,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Reddit auth failed: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string | undefined;
  if (!accessToken) throw new Error('No access token from Reddit.');
  return accessToken;
}

export async function postIdeaToReddit(
  accessToken: string,
  subreddit: string,
  title: string,
  body: string
): Promise<string | null> {
  const submitRes = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      api_type: 'json',
      kind: 'self',
      sr: subreddit.replace(/^r\//, ''),
      title,
      text: body,
    }).toString(),
  });

  if (!submitRes.ok) return null;

  const submitData = await submitRes.json() as { json?: { data?: { url?: string } } };
  return submitData?.json?.data?.url ?? null;
}

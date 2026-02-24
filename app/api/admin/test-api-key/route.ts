import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API key test proxy
 * Routes test requests through the server to avoid CORS issues
 * with providers like NVIDIA that don't allow browser-origin requests
 */
export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ success: false, error: 'Provider and API key are required' }, { status: 400 });
    }

    let testUrl = '';
    let testOpts: RequestInit = {};

    switch (provider) {
      case 'nvidia':
        testUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
        testOpts = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'moonshotai/kimi-k2-instruct', messages: [{ role: 'user', content: 'Test' }], max_tokens: 10 }),
        };
        break;
      case 'perplexity':
        testUrl = 'https://api.perplexity.ai/chat/completions';
        testOpts = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'Test' }], max_tokens: 5 }),
        };
        break;
      default:
        return NextResponse.json({ success: false, error: `Provider ${provider} not supported for server-side testing` }, { status: 400 });
    }

    const response = await fetch(testUrl, testOpts);

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || errorData.detail || response.statusText,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

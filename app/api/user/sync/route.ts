import { NextRequest, NextResponse } from 'next/server';

// 确保这行代码在整个文件中只出现一次
export const runtime = 'edge';

// 本机云同步存储服务地址与访问令牌（在 Cloudflare Pages 环境变量中配置）
// 示例：
//   SYNC_SERVER_URL = https://vv-c.zwzw.dpdns.org
//   SYNC_API_TOKEN  = 与你本机 sync-server 的 SYNC_API_TOKEN 保持一致
const SYNC_SERVER_URL = process.env.SYNC_SERVER_URL || '';
const SYNC_API_TOKEN = process.env.SYNC_API_TOKEN || '';

export async function GET(request: NextRequest) {
  const profileId = request.headers.get('x-profile-id');

  if (!profileId) {
    return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
  }

  if (!SYNC_SERVER_URL || !SYNC_API_TOKEN) {
    return NextResponse.json({ error: 'Sync server not configured' }, { status: 500 });
  }

  try {
    const resp = await fetch(`${SYNC_SERVER_URL}/sync?profileId=${encodeURIComponent(profileId)}`, {
      headers: {
        'x-api-token': SYNC_API_TOKEN,
      },
    });
    const result = await resp.json();

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    }
    return NextResponse.json({ error: 'Sync server error' }, { status: 500 });
  } catch (error) {
    console.error('Sync Get Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sync data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const profileId = request.headers.get('x-profile-id');

  if (!profileId) {
    return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
  }

  if (!SYNC_SERVER_URL || !SYNC_API_TOKEN) {
    return NextResponse.json({ error: 'Sync server not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { history, favorites, settings } = body;

    const resp = await fetch(`${SYNC_SERVER_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': SYNC_API_TOKEN,
      },
      body: JSON.stringify({ profileId, history, favorites, settings }),
    });
    const result = await resp.json();

    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Sync server error' }, { status: 500 });
  } catch (error) {
    console.error('Sync Set Error:', error);
    return NextResponse.json({ error: 'Failed to save sync data' }, { status: 500 });
  }
}

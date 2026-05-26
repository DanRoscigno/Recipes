import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { saveRecipeFile } from '@/lib/github';
import { buildRecipeMarkdown } from '@/lib/recipes';
import { indexRecipe } from '@/lib/algolia';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Update an existing recipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await authenticate(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { title, tags, servings, body } = await request.json();

  const content = buildRecipeMarkdown(title, tags, servings, body);
  const { prUrl } = await saveRecipeFile(slug, content, `Update: ${title}`);
  await indexRecipe(slug, title, tags, servings, body);

  return NextResponse.json({ ok: true, prUrl });
}

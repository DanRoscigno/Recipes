import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { saveRecipeFile, titleToSlug } from '@/lib/github';
import { buildRecipeMarkdown } from '@/lib/recipes';
import { revalidatePath } from 'next/cache';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Create a new recipe
export async function POST(request: NextRequest) {
  const session = await authenticate(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, tags, servings, body } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const slug = titleToSlug(title);
  const content = buildRecipeMarkdown(title, tags ?? [], servings ?? '', body ?? '');
  await saveRecipeFile(slug, content, `Add: ${title}`);

  revalidatePath('/');

  return NextResponse.json({ ok: true, slug });
}

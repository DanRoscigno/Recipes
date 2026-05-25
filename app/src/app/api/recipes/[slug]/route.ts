import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { getRecipeFile, saveRecipeFile, titleToSlug } from '@/lib/github';
import { buildRecipeMarkdown } from '@/lib/recipes';
import { revalidatePath } from 'next/cache';

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

  const existing = await getRecipeFile(slug);
  if (!existing) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });

  const content = buildRecipeMarkdown(title, tags, servings, body);
  await saveRecipeFile(slug, content, `Update: ${title}`, existing.sha);

  revalidatePath(`/recipes/${slug}`);
  revalidatePath('/');

  return NextResponse.json({ ok: true });
}

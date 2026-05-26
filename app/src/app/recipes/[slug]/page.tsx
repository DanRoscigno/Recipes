import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRecipe, getAllSlugs } from '@/lib/recipes';

export const revalidate = 60;

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  return { title: recipe?.title ?? slug };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipe(slug);

  if (!recipe) notFound();

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-amber-700 hover:underline text-sm">
            ← All recipes
          </Link>
          <Link
            href={`/recipes/${slug}/edit`}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Edit
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-1">{recipe.title}</h1>
        {recipe.servings && (
          <p className="text-sm text-gray-500 mb-3">{recipe.servings}</p>
        )}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6">
            {recipe.tags.map(tag => (
              <span
                key={tag}
                className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <article className="prose prose-amber max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.content}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}

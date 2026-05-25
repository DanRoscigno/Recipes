import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRecipe } from '@/lib/recipes';
import RecipeEditor from '@/components/RecipeEditor';

export default async function EditRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link href={`/recipes/${slug}`} className="text-amber-700 hover:underline text-sm">
            ← Cancel edit
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">Edit recipe</h1>
        <RecipeEditor
          slug={slug}
          initialTitle={recipe.title}
          initialServings={recipe.servings}
          initialTags={recipe.tags}
          initialBody={recipe.content}
        />
      </main>
    </div>
  );
}

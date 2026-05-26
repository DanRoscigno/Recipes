import { notFound } from 'next/navigation';
import { getRecipe } from '@/lib/recipes';
import RecipeEditor from '@/components/RecipeEditor';

export default async function EditRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">Edit recipe</h1>
        <RecipeEditor
          slug={slug}
          initialTitle={recipe.title}
          initialServings={recipe.servings}
          initialTags={recipe.tags}
          initialBody={recipe.content}
          cancelHref={`/recipes/${slug}`}
        />
      </main>
    </div>
  );
}

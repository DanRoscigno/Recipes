import RecipeEditor from '@/components/RecipeEditor';

export default function NewRecipePage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">New recipe</h1>
        <RecipeEditor cancelHref="/" />
      </main>
    </div>
  );
}

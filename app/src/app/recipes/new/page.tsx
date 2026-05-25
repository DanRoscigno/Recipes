import Link from 'next/link';
import RecipeEditor from '@/components/RecipeEditor';

export default function NewRecipePage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link href="/" className="text-amber-700 hover:underline text-sm">
            ← All recipes
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">New recipe</h1>
        <RecipeEditor />
      </main>
    </div>
  );
}

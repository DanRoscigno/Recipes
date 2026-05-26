import { getAllRecipeMeta } from '@/lib/recipes';
import { getSession } from '@/lib/auth';
import RecipeList from '@/components/RecipeList';
import Link from 'next/link';

export const revalidate = 60;

export default async function HomePage() {
  const [recipes, session] = await Promise.all([getAllRecipeMeta(), getSession()]);

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-amber-800">Roscigno Recipes</h1>
          <div className="flex items-center gap-4">
            {session && (
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-sm text-gray-400 hover:text-gray-600">
                  Sign out
                </button>
              </form>
            )}
            <Link href="/recipes/new" className="text-sm text-amber-700 hover:underline font-medium">
              Edit
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <RecipeList recipes={recipes} />
      </main>
    </div>
  );
}

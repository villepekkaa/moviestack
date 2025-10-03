export const metadata = {
  title: "My Collection",
  description: "Your saved movies in MovieStack",
};

export default function MyCollection() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">My Collection</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Movies and shows you saved for later.
        </p>
      </header>

      <section className="space-y-6">
        {/* Placeholder empty state */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
          <p className="text-lg mb-3">No items in your collection yet</p>
          <p className="text-sm text-muted-foreground">
            Use the Search page to find movies and add them to your collection.
          </p>
        </div>

        {/* Example list card (replace with dynamic data when available) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <article className="flex gap-4 items-start rounded-md border p-4">
            <div className="w-20 h-28 bg-gray-100 dark:bg-gray-800 rounded-md flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium">Example Movie</h3>
              <p className="text-sm text-muted-foreground">2024 · Action</p>
              <p className="mt-2 text-sm">
                Short description or notes about why this movie was saved.
              </p>
            </div>
          </article>

          <article className="flex gap-4 items-start rounded-md border p-4">
            <div className="w-20 h-28 bg-gray-100 dark:bg-gray-800 rounded-md flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium">Another Title</h3>
              <p className="text-sm text-muted-foreground">2021 · Drama</p>
              <p className="mt-2 text-sm">
                Placeholder entry. Replace these with your saved items.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

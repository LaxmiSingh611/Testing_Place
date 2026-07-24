type FlatCategory = { id: string; name: string; slug: string; parentId: string | null };

export function ProductFilters({
  categories,
  current,
}: {
  categories: FlatCategory[];
  current: { q?: string; category?: string; minPrice?: string; maxPrice?: string; sort?: string };
}) {
  return (
    <form action="/products" method="GET" className="h-fit space-y-5 rounded-lg border bg-white p-4">
      {current.q && <input type="hidden" name="q" value={current.q} />}

      <div className="space-y-1.5">
        <label htmlFor="category" className="text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={current.category ?? ""}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.parentId ? `— ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Price range</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minPrice"
            placeholder="Min"
            min={0}
            defaultValue={current.minPrice ?? ""}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max"
            min={0}
            defaultValue={current.maxPrice ?? ""}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sort" className="text-sm font-medium text-slate-700">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={current.sort ?? "newest"}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Apply filters
        </button>
        <a
          href="/products"
          className="rounded-md border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </a>
      </div>
    </form>
  );
}

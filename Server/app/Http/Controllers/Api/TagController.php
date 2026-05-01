<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TagController extends Controller
{
    /**
     * Public endpoint untuk sidebar - return simple array (no pagination)
     * Response: [{ id, name, slug, articles_count }, ...]
     */
    public function index(Request $request)
    {
        try {
            $tags = Tag::query()
                ->when($request->search, fn($q) =>
                    $q->where('name', 'like', "%{$request->search}%")
                )
                ->withCount('articles') // ✅ articles_count untuk sidebar
                ->latest('name')
                ->get(); // ✅ Return collection, bukan paginate

            return response()->json($tags);
        } catch (\Exception $e) {
            Log::error('Tags public error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch tags'], 500);
        }
    }

    /**
     * Admin endpoint - return paginated untuk management
     */
    public function adminIndex(Request $request)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $tags = Tag::query()
                ->when($request->search, fn($q) =>
                    $q->where('name', 'like', "%{$request->search}%")
                )
                ->withCount('articles')
                ->latest()
                ->paginate($request->input('per_page', 20));

            return response()->json($tags);
        } catch (\Exception $e) {
            Log::error('Tags admin error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch tags'], 500);
        }
    }

    public function store(Request $request)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tags,name',
        ]);

        try {
            $tag = Tag::create([
                'name' => $validated['name'], // slug auto dari Model
            ]);

            return response()->json([
                'message' => 'Tag created',
                'data' => $tag->loadCount('articles')
            ], 201);

        } catch (\Exception $e) {
            Log::error('Create tag error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function show($slug)
    {
        try {
            $tag = Tag::where('slug', $slug)
                ->withCount('articles')
                ->firstOrFail();

            return response()->json($tag);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Tag not found'], 404);
        }
    }

    public function update(Request $request, Tag $tag)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tags,name,' . $tag->id,
        ]);

        try {
            $tag->update([
                'name' => $validated['name'],
            ]);

            return response()->json([
                'message' => 'Tag updated',
                'data' => $tag->loadCount('articles')
            ]);
        } catch (\Exception $e) {
            Log::error('Update tag error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function destroy(Request $request, Tag $tag)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            if ($tag->articles()->exists()) {
                return response()->json([
                    'message' => 'Tag masih digunakan di artikel'
                ], 409);
            }

            $tag->delete();

            return response()->json(['message' => 'Tag deleted']);
        } catch (\Exception $e) {
            Log::error('Delete tag error: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }
}
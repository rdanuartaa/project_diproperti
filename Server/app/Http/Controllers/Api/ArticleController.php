<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    /**
     * Helper: Trigger accessor image_url (SAMA PERSIS seperti PropertyController)
     */
    private function appendImageUrls($data)
    {
        if ($data instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            $data->getCollection()->transform(function($article) {
                // Force trigger accessor dengan mengakses image_url
                $article->image_url;
                return $article;
            });
        } elseif ($data instanceof \Illuminate\Database\Eloquent\Collection) {
            $data->each(function($article) {
                $article->image_url;
            });
        } elseif ($data instanceof Article) {
            $data->image_url;
        }
        return $data;
    }

    public function index(Request $request)
    {
        try {
            $query = Article::with(['tags:id,name,slug', 'user:id,name']);

            if ($request->search) {
                $query->where('title', 'like', "%{$request->search}%");
            }

            if ($request->tag) {
                $query->whereHas('tags', fn($q) => $q->where('slug', $request->tag));
            }

            if (!$request->user()?->isAdmin()) {
                $query->where('status', 'published');
            }

            $articles = $query->latest()->paginate($request->input('per_page', 10));

            // ✅ TRIGGER ACCESSOR untuk image_url
            $this->appendImageUrls($articles);

            return response()->json($articles);
        } catch (\Exception $e) {
            Log::error('Error fetching articles: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch articles'], 500);
        }
    }

    public function adminIndex(Request $request)
    {
        try {
            if (!$request->user()?->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $query = Article::with(['tags:id,name,slug', 'user:id,name']);

            if ($request->search) {
                $query->where('title', 'like', "%{$request->search}%");
            }

            if ($request->tag) {
                $query->whereHas('tags', fn($q) => $q->where('slug', $request->tag));
            }

            $articles = $query->latest()->paginate($request->input('per_page', 10));

            // ✅ TRIGGER ACCESSOR untuk image_url
            $this->appendImageUrls($articles);

            return response()->json($articles);
        } catch (\Exception $e) {
            Log::error('Error fetching admin articles: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch articles'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== CREATE ARTICLE START === User: ' . $request->user()->id);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:500',
                'content' => 'required|string',
                'status' => 'nullable|in:draft,published',
                'tags' => 'nullable|array',
                'tags.*' => 'integer|exists:tags,id',
                'image' => 'nullable|file|image|max:5120',
            ]);

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $this->uploadImageToR2($request->file('image'));
                if (!$imagePath) {
                    return response()->json(['message' => 'Failed to upload image'], 500);
                }
            }

            $article = Article::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
                'description' => $validated['description'] ?? null,
                'content' => $validated['content'],
                'image' => $imagePath,
                'status' => $validated['status'] ?? 'draft',
            ]);

            if (!empty($validated['tags'])) {
                $article->tags()->sync($validated['tags']);
            }

            $article->load(['tags:id,name,slug', 'user:id,name']);

            // ✅ TRIGGER ACCESSOR untuk image_url sebelum return
            $this->appendImageUrls($article);

            Log::info('=== CREATE ARTICLE SUCCESS === ID: ' . $article->id);

            return response()->json([
                'message' => 'Article created successfully',
                'article' => $article
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('=== CREATE ARTICLE ERROR ===: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function show($slug)
    {
        try {
            $article = Article::with(['tags:id,name,slug', 'user:id,name'])
                ->where('slug', $slug)
                ->firstOrFail();
            $this->appendImageUrls($article);

            if (!request()->user()?->isAdmin()) {
                $article->increment('views');
            }

            return response()->json($article);
            
        } catch (\Exception $e) {
            Log::error('Error fetching article: ' . $e->getMessage());
            return response()->json(['message' => 'Article not found'], 404);
        }
    }

    public function update(Request $request, Article $article)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== UPDATE ARTICLE START === ID: ' . $article->id);

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string|max:500',
                'content' => 'sometimes|required|string',
                'status' => 'nullable|in:draft,published',
                'tags' => 'nullable|array',
                'tags.*' => 'integer|exists:tags,id',
                'image' => 'nullable|file|image|max:5120',
                'image_to_delete' => 'nullable|boolean',
            ]);

            if (!empty($validated['image_to_delete']) && $article->image) {
                $this->deleteImageFromR2($article->image);
                $validated['image'] = null;
            }

            if ($request->hasFile('image')) {
                if ($article->image) {
                    $this->deleteImageFromR2($article->image);
                }
                $validated['image'] = $this->uploadImageToR2($request->file('image'));
                if (!$validated['image']) {
                    return response()->json(['message' => 'Failed to upload image'], 500);
                }
            } else {
                unset($validated['image']);
            }

            if (isset($validated['title'])) {
                $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);
            }

            $article->update($validated);

            if (isset($validated['tags'])) {
                $article->tags()->sync($validated['tags']);
            }

            $article->load(['tags:id,name,slug', 'user:id,name']);

            // ✅ TRIGGER ACCESSOR untuk image_url sebelum return
            $this->appendImageUrls($article);

            Log::info('=== UPDATE ARTICLE SUCCESS === ID: ' . $article->id);

            return response()->json([
                'message' => 'Article updated successfully',
                'article' => $article
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('=== UPDATE ARTICLE ERROR ===: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, Article $article)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== DELETE ARTICLE START === ID: ' . $article->id);

            if ($article->image) {
                $this->deleteImageFromR2($article->image);
            }

            $article->delete();

            Log::info('=== DELETE ARTICLE SUCCESS === ID: ' . $article->id);

            return response()->json(['message' => 'Article deleted successfully']);

        } catch (\Exception $e) {
            Log::error('=== DELETE ARTICLE ERROR ===: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    private function uploadImageToR2($file): ?string
    {
        try {
            if (!$file->isValid()) {
                Log::error('Invalid file: ' . $file->getClientOriginalName());
                return null;
            }

            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            $r2Path = 'articles/' . $filename;

            $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($file->getRealPath()), 'public');

            if (!$uploaded) {
                Log::error('R2 upload failed for: ' . $filename);
                return null;
            }

            Log::info('✅ Image uploaded to R2: ' . $r2Path);
            return $r2Path;

        } catch (\Exception $e) {
            Log::error('R2 upload error: ' . $e->getMessage());
            return null;
        }
    }

    private function deleteImageFromR2($path): void
    {
        try {
            if ($path && Storage::disk('s3')->exists($path)) {
                Storage::disk('s3')->delete($path);
                Log::info('Image deleted from R2: ' . $path);
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete image from R2: ' . $e->getMessage());
        }
    }
}
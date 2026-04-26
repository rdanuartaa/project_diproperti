<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FaqController extends Controller
{
    /**
     * Display listing of FAQs (Admin Only)
     */
    public function index(Request $request)
    {
        $query = Faq::query();

        // Filter by status
        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // Filter by topic
        if ($request->filled('topic')) {
            $query->where('topic', $request->topic);
        }

        // Search by question or answer
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        $faqs = $query->select('id', 'question', 'answer', 'topic', 'status', 'created_at', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => $faqs->items(),
            'meta' => [
                'current_page' => $faqs->currentPage(),
                'last_page' => $faqs->lastPage(),
                'total' => $faqs->total(),
            ]
        ]);
    }

    /**
     * Store new FAQ (Admin Only)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'topic' => ['required', Rule::in(['properti', 'kpr', 'platform', 'umum'])],
            'status' => ['required', Rule::in(['draft', 'published'])],
        ]);

        $faq = Faq::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'FAQ created successfully',
            'data' => $faq
        ], 201);
    }

    /**
     * Update FAQ (Admin Only)
     */
    public function update(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'topic' => ['required', Rule::in(['properti', 'kpr', 'platform', 'umum'])],
            'status' => ['required', Rule::in(['draft', 'published'])],
        ]);

        $faq->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'FAQ updated successfully',
            'data' => $faq
        ]);
    }

    /**
     * Delete FAQ (Admin Only)
     */
    public function destroy(Request $request, Faq $faq)
    {
        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted successfully'
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Article;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard stats untuk counter boxes
     */
    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            
            // ✅ FIX: Buat query terpisah untuk setiap perhitungan
            $propertyCount = Property::query();
            $propertyPublished = Property::query();
            $propertyViews = Property::query();
            
            $articleCount = Article::query();
            $articlePublished = Article::query();
            $articleViews = Article::query();
            
            // Apply filter user jika bukan admin
            if ($user && !$user->isAdmin()) {
                $propertyCount->where('user_id', $user->id);
                $propertyPublished->where('user_id', $user->id);
                $propertyViews->where('user_id', $user->id);
                
                $articleCount->where('user_id', $user->id);
                $articlePublished->where('user_id', $user->id);
                $articleViews->where('user_id', $user->id);
            }

            // ✅ Hitung statistik dengan query terpisah
            $totalProperties = $propertyCount->count();
            $publishedProperties = $propertyPublished->where('status', 'published')->count();
            $totalPropertyViews = $propertyViews->sum('views');
            
            $totalArticles = $articleCount->count();
            $publishedArticles = $articlePublished->where('status', 'published')->count();
            $totalArticleViews = $articleViews->sum('views');
            
            $userCount = User::where('role', '!=', 'admin')->count();
            
            $totalViews = $totalPropertyViews + $totalArticleViews;

            return response()->json([
                'success' => true,
                'data' => [
                    'properties' => [
                        'total' => $totalProperties,
                        'published' => $publishedProperties,
                        'views' => $totalPropertyViews,
                    ],
                    'articles' => [
                        'total' => $totalArticles,
                        'published' => $publishedArticles,
                        'views' => $totalArticleViews,
                    ],
                    'users' => [
                        'total' => $userCount,
                    ],
                    'platform' => [
                        'total_views' => $totalViews,
                    ],
                ],
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Get analytics data untuk chart (Page Inside)
     */
    public function analytics(Request $request)
    {
        try {
            $period = $request->input('period', 'year'); // Default ke year agar data muncul
            $user = $request->user();

            // Format grouping berdasarkan period
            $groupByFormat = match($period) {
                'year' => '%Y',           // Group per tahun → label: 2024
                'month' => '%Y-%m',       // Group per bulan → label: 2024-01
                'week', 'day' => '%Y-%m-%d', // Group per hari → label: 2024-01-15
                default => '%Y-%m-%d',
            };

            // ✅ FIX: Gunakan string langsung, JANGAN DB::raw() untuk variabel
            $groupByExpression = "DATE_FORMAT(created_at, '$groupByFormat')";

            // Query Properties
            $propertyQuery = Property::query();
            if ($user && !$user->isAdmin()) {
                $propertyQuery->where('user_id', $user->id);
            }
            
            $propertyStats = $propertyQuery
                ->selectRaw("$groupByExpression as period, SUM(views) as total")
                ->groupByRaw($groupByExpression)
                ->orderBy('period')
                ->get()
                ->pluck('total', 'period');

            // Query Articles
            $articleQuery = Article::query();
            if ($user && !$user->isAdmin()) {
                $articleQuery->where('user_id', $user->id);
            }
            
            $articleStats = $articleQuery
                ->selectRaw("$groupByExpression as period, SUM(views) as total")
                ->groupByRaw($groupByExpression)
                ->orderBy('period')
                ->get()
                ->pluck('total', 'period');

            // Merge & build chart data
            $allPeriods = array_unique(array_merge(
                array_keys($propertyStats->toArray()),
                array_keys($articleStats->toArray())
            ));
            sort($allPeriods);

            $labels = [];
            $dataValues = [];

            foreach ($allPeriods as $periodKey) {
                // Format label untuk display
                $displayLabel = match(true) {
                    strlen($periodKey) === 4 => $periodKey, // Year: 2024
                    strlen($periodKey) === 7 => Carbon::parse($periodKey . '-01')->format('M Y'), // Month: Jan 2024
                    default => Carbon::parse($periodKey)->format('d M'), // Day: 15 Jan
                };
                
                $labels[] = $displayLabel;
                $dataValues[] = ($propertyStats->get($periodKey, 0) ?? 0) + ($articleStats->get($periodKey, 0) ?? 0);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'labels' => $labels,
                    'datasets' => [
                        [
                            'label' => 'Total Views',
                            'data' => $dataValues,
                            'borderColor' => '#F1913D',
                            'backgroundColor' => 'rgba(241, 145, 61, 0.1)',
                            'tension' => 0.4,
                            'fill' => true,
                        ]
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => ['labels' => [], 'datasets' => []] // Fallback agar chart tidak error
            ], 500);
        }
    }
}
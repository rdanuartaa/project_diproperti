<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Article;
use App\Models\User;
use App\Models\ViewEvent;
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
            $propertySubmissions = Property::query();
            
            // Apply filter user jika bukan admin
            if ($user && !$user->isAdmin()) {
                $propertyCount->where('user_id', $user->id);
                $propertyPublished->where('user_id', $user->id);
                $propertyViews->where('user_id', $user->id);
                $propertySubmissions->where('user_id', $user->id);
                
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
            $pendingSubmissions = $propertySubmissions
                ->where('is_verified', false)
                ->where('status', '!=', 'sold')
                ->count();
            
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
                    'submissions' => [
                        'pending' => $pendingSubmissions,
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
            $period = $request->input('period', 'year');
            $now = Carbon::now();
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            if ($startDate || $endDate) {
                $start = $startDate
                    ? Carbon::parse($startDate)->startOfDay()
                    : Carbon::parse($endDate)->startOfDay();
                $end = $endDate
                    ? Carbon::parse($endDate)->endOfDay()
                    : Carbon::parse($startDate)->endOfDay();

                if ($start->greaterThan($end)) {
                    [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
                }

                $days = $start->diffInDays($end) + 1;
                $unit = $days <= 31 ? 'day' : ($days > 366 ? 'year' : 'month');
                $range = [
                    'start' => $unit === 'month'
                        ? $start->copy()->startOfMonth()
                        : ($unit === 'year' ? $start->copy()->startOfYear() : $start),
                    'end' => $end,
                    'format' => $days <= 1 ? '%Y-%m-%d %H:00:00' : ($unit === 'year' ? '%Y' : ($unit === 'month' ? '%Y-%m' : '%Y-%m-%d')),
                    'unit' => $days <= 1 ? 'hour' : $unit,
                ];
            } else {
                $range = match ($period) {
                'day' => [
                    'start' => $now->copy()->startOfDay(),
                    'end' => $now->copy()->endOfDay(),
                    'format' => '%Y-%m-%d %H:00:00',
                    'unit' => 'hour',
                ],
                'week' => [
                    'start' => $now->copy()->subDays(6)->startOfDay(),
                    'end' => $now->copy()->endOfDay(),
                    'format' => '%Y-%m-%d',
                    'unit' => 'day',
                ],
                'month' => [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth(),
                    'format' => '%Y-%m-%d',
                    'unit' => 'day',
                ],
                default => [
                    'start' => $now->copy()->startOfYear(),
                    'end' => $now->copy()->endOfYear(),
                    'format' => '%Y-%m',
                    'unit' => 'month',
                ],
                };
            }

            $groupByExpression = "DATE_FORMAT(viewed_at, '{$range['format']}')";
            $viewStats = ViewEvent::query()
                ->whereIn('viewable_type', ['property', 'article'])
                ->whereBetween('viewed_at', [$range['start'], $range['end']])
                ->selectRaw("$groupByExpression as period, viewable_type, COUNT(*) as total")
                ->groupByRaw("$groupByExpression, viewable_type")
                ->orderBy('period')
                ->get();

            $propertyStats = [];
            $articleStats = [];
            foreach ($viewStats as $row) {
                if ($row->viewable_type === 'property') {
                    $propertyStats[$row->period] = (int) $row->total;
                }
                if ($row->viewable_type === 'article') {
                    $articleStats[$row->period] = (int) $row->total;
                }
            }

            $periods = [];
            $cursor = $range['start']->copy();
            while ($cursor <= $range['end']) {
                $key = match ($range['unit']) {
                    'hour' => $cursor->format('Y-m-d H:00:00'),
                    'year' => $cursor->format('Y'),
                    'month' => $cursor->format('Y-m'),
                    default => $cursor->format('Y-m-d'),
                };
                $label = match ($range['unit']) {
                    'hour' => $cursor->format('H:00'),
                    'year' => $cursor->format('Y'),
                    'month' => $cursor->format('M'),
                    default => $cursor->format('d M'),
                };
                $periods[] = ['key' => $key, 'label' => $label];
                $range['unit'] === 'hour'
                    ? $cursor->addHour()
                    : ($range['unit'] === 'year'
                        ? $cursor->addYear()
                        : ($range['unit'] === 'month' ? $cursor->addMonth() : $cursor->addDay()));
            }

            $labels = array_column($periods, 'label');
            $propertyValues = array_map(fn($item) => $propertyStats[$item['key']] ?? 0, $periods);
            $articleValues = array_map(fn($item) => $articleStats[$item['key']] ?? 0, $periods);
            $totalValues = array_map(fn($property, $article) => $property + $article, $propertyValues, $articleValues);

            return response()->json([
                'success' => true,
                'data' => [
                    'labels' => $labels,
                    'datasets' => [
                        [
                            'label' => 'Total Kunjungan',
                            'data' => $totalValues,
                            'borderColor' => '#02469B',
                            'backgroundColor' => 'rgba(2, 70, 155, 0.1)',
                            'tension' => 0.4,
                            'fill' => true,
                        ],
                        [
                            'label' => 'Kunjungan Properti',
                            'data' => $propertyValues,
                            'borderColor' => '#3B82F6',
                            'backgroundColor' => 'rgba(59, 130, 246, 0.08)',
                            'tension' => 0.4,
                            'fill' => false,
                        ],
                        [
                            'label' => 'Kunjungan Artikel',
                            'data' => $articleValues,
                            'borderColor' => '#10B981',
                            'backgroundColor' => 'rgba(16, 185, 129, 0.08)',
                            'tension' => 0.4,
                            'fill' => false,
                        ],
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

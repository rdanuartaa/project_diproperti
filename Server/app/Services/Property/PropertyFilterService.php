<?php

namespace App\Services\Property;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class PropertyFilterService
{
    public function applySortOrder(Builder $query, Request $request): Builder
    {
        $sortOrder = strtolower((string) $request->input('sort_order', 'desc'));

        return in_array($sortOrder, ['asc', 'oldest', 'terlama'], true)
            ? $query->orderBy('created_at', 'asc')
            : $query->latest();
    }

    public function applyDetailFilters(Builder $query, Request $request): Builder
    {
        $numericFilters = [
            'bedrooms',
            'bathrooms',
            'living_rooms',
            'kitchens',
            'floors',
            'total_rooms',
            'parking_capacity',
            'warehouse_area',
            'luas_tanah',
            'luas_bangunan',
            'shop_front_width',
        ];

        foreach ($numericFilters as $field) {
            if ($request->filled($field)) {
                $query->whereHas('detail', fn($q) => $q->where($field, '>=', (float) $request->input($field)));
            }
        }

        $exactFilters = [
            'water',
            'listrik_type',
            'bathroom_position',
            'gender_type',
            'road_access',
            'land_type',
        ];

        foreach ($exactFilters as $field) {
            if ($request->filled($field)) {
                $query->whereHas('detail', fn($q) => $q->where($field, $request->input($field)));
            }
        }

        return $query;
    }
}

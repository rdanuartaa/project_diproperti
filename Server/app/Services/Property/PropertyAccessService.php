<?php

namespace App\Services\Property;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class PropertyAccessService
{
    public function applyLocationAccess(Property $property, ?User $user): void
    {
        $isAdmin = $user?->isAdmin() ?? false;
        $isOwner = $user && (int) $property->user_id === (int) $user->id;
        $canView = $isAdmin || $isOwner;

        $property->setAttribute('can_view_location', $canView);
        if ($canView) {
            return;
        }

        $lat = $property->latitude;
        $lng = $property->longitude;
        if ($lat !== null && $lng !== null) {
            $property->setAttribute('location_preview', [
                'latitude' => (float) $lat,
                'longitude' => (float) $lng,
            ]);
        } else {
            $property->setAttribute('location_preview', null);
        }

        $property->setAttribute('latitude', null);
        $property->setAttribute('longitude', null);
        $property->setAttribute('address', null);
    }

    public function stripPrivateFields(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $hidden = [
            'certificate_file',
            'electric_bill_file',
            'water_bill_file',
            'is_verified',
            'latitude',
            'longitude',
            'address',
        ];
        $apply = fn(Property $property) => $property->makeHidden($hidden);

        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->each($apply);
        } elseif ($data instanceof Collection) {
            $data->each($apply);
        } elseif ($data instanceof Property) {
            $apply($data);
        }

        return $data;
    }
}

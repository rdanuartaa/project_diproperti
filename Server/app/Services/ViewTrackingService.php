<?php

namespace App\Services;

use App\Models\ViewEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ViewTrackingService
{
    private const DEDUPE_MINUTES = 30;

    public function track(Request $request, string $type, ?int $id = null, ?Model $model = null): bool
    {
        $user = $request->user();
        if ($user?->isAdmin()) {
            return false;
        }

        $visitorHash = $this->visitorHash($request);
        $viewedAfter = Carbon::now()->subMinutes(self::DEDUPE_MINUTES);

        $alreadyTracked = ViewEvent::query()
            ->where('visitor_hash', $visitorHash)
            ->where('viewable_type', $type)
            ->where('viewable_id', $id)
            ->where('viewed_at', '>=', $viewedAfter)
            ->exists();

        if ($alreadyTracked) {
            return false;
        }

        DB::transaction(function () use ($request, $user, $type, $id, $visitorHash, $model) {
            ViewEvent::create([
                'viewable_type' => $type,
                'viewable_id' => $id,
                'user_id' => $user?->id,
                'visitor_hash' => $visitorHash,
                'ip_hash' => $this->hashNullable($request->ip()),
                'user_agent_hash' => $this->hashNullable((string) $request->userAgent()),
                'url' => $request->fullUrl(),
                'viewed_at' => now(),
            ]);

            if ($model && $model->getKey()) {
                DB::table($model->getTable())
                    ->where($model->getKeyName(), $model->getKey())
                    ->increment('views');
                $model->setAttribute('views', ((int) $model->getAttribute('views')) + 1);
            }
        });

        return true;
    }

    private function visitorHash(Request $request): string
    {
        $user = $request->user();
        if ($user) {
            return hash('sha256', 'user:' . $user->id);
        }

        return hash('sha256', implode('|', [
            'guest',
            $request->ip() ?? '',
            (string) $request->userAgent(),
        ]));
    }

    private function hashNullable(?string $value): ?string
    {
        return $value ? hash('sha256', $value) : null;
    }
}

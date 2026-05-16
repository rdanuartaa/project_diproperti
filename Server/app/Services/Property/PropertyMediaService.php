<?php

namespace App\Services\Property;

use App\Models\Property;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PropertyMediaService
{
    public function appendImageUrls(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $callback = function ($property) {
            if ($property->relationLoaded('images')) {
                $property->images->each(fn($image) => $image->full_url);
            }

            return $property;
        };

        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->transform($callback);
        } elseif ($data instanceof Collection) {
            $data->each($callback);
        } elseif ($data instanceof Property) {
            $callback($data);
        }

        return $data;
    }

    public function appendDocumentUrls(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $apply = function (Property $property) {
            $property->setAttribute('certificate_file_url', $this->buildR2Url($property->certificate_file));
            $property->setAttribute('electric_bill_file_url', $this->buildR2Url($property->electric_bill_file));
            $property->setAttribute('water_bill_file_url', $this->buildR2Url($property->water_bill_file));
        };

        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->each($apply);
        } elseif ($data instanceof Collection) {
            $data->each($apply);
        } elseif ($data instanceof Property) {
            $apply($data);
        }

        return $data;
    }

    public function appendRentPriceInfo(
        Property|Collection|LengthAwarePaginator $data,
        Request $request
    ): Property|Collection|LengthAwarePaginator {
        $periodKey = $this->normalizeRentPeriod((string) $request->input('rent_period', 'bulan'));
        $labels = ['bulan' => 'bulan', '3bulan' => '3 bulan', '6bulan' => '6 bulan', 'tahun' => 'tahun'];
        $label = $labels[$periodKey] ?? 'bulan';

        $apply = function (Property $property) use ($periodKey, $label) {
            if ($property->listing_type !== 'sewa') {
                $property->setAttribute('price_period', null);
                $property->setAttribute('price_display', null);
                return;
            }

            $property->setAttribute('price_period', $periodKey);
            $property->setAttribute('price_display', ($property->price ?? 0) . '/' . $label);
        };

        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->each($apply);
        } elseif ($data instanceof Collection) {
            $data->each($apply);
        } elseif ($data instanceof Property) {
            $apply($data);
        }

        return $data;
    }

    public function handleImageUpload(
        Property $property,
        Request $request,
        int $startIndex = 0,
        ?int $primaryNewIndex = null,
        bool $forcePrimary = false
    ): int {
        if (!$request->hasFile('images')) {
            return 0;
        }

        $images = $request->file('images');
        if (!is_array($images)) {
            $images = [$images];
        }

        $images = array_filter($images, fn($img) => $img !== null && $img instanceof \Illuminate\Http\UploadedFile);
        if (count($images) === 0) {
            return 0;
        }

        Log::info('Uploading ' . count($images) . ' images to R2 for property #' . $property->id);

        $successCount = 0;
        $hasPrimary = $property->images()->where('is_primary', true)->exists();
        if ($forcePrimary) {
            $hasPrimary = false;
        }

        foreach ($images as $index => $image) {
            try {
                if (!$image->isValid()) {
                    Log::error('Invalid file: ' . $image->getClientOriginalName());
                    continue;
                }

                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $r2Path = 'properties/' . $filename;
                $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($image->getRealPath()), 'public');

                if (!$uploaded) {
                    Log::error('R2 upload failed for: ' . $filename);
                    continue;
                }

                $isPrimary = $primaryNewIndex !== null
                    ? $index === (int) $primaryNewIndex
                    : (!$hasPrimary && $index === 0);
                $imageRecord = $property->images()->create(['image_url' => $r2Path, 'is_primary' => $isPrimary]);

                if ($isPrimary) {
                    $hasPrimary = true;
                }

                Log::info('Image record created! ID: ' . $imageRecord->id . ' | R2 Path: ' . $r2Path);
                $successCount++;
                $hasPrimary = true;
            } catch (\Illuminate\Database\QueryException $qe) {
                Log::error('DATABASE QUERY ERROR: ' . $qe->getMessage());
                Log::error('SQL: ' . $qe->getSql());
                Log::error('Bindings: ' . json_encode($qe->getBindings()));
                if (app()->environment('local')) {
                    throw $qe;
                }
            } catch (\Exception $e) {
                Log::error('GENERAL ERROR: ' . $e->getMessage());
                Log::error('Trace: ' . $e->getTraceAsString());
                if (app()->environment('local')) {
                    throw $e;
                }
            }
        }

        Log::info('R2 Upload completed: ' . $successCount . '/' . count($images) . ' images saved');

        return $successCount;
    }

    public function handleDocumentUpload(Request $request, Property $property, string $field): void
    {
        if (!$request->hasFile($field)) {
            return;
        }

        $file = $request->file($field);
        if (!$file || !$file->isValid()) {
            return;
        }

        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        $r2Path = 'property-docs/' . $filename;
        $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($file->getRealPath()), 'private');

        if (!$uploaded) {
            Log::error('R2 upload failed for doc: ' . $filename);
            return;
        }

        if ($property->{$field} && Storage::disk('s3')->exists($property->{$field})) {
            Storage::disk('s3')->delete($property->{$field});
        }

        $property->{$field} = $r2Path;
        $property->save();
    }

    public function makeDownloadFilename(string $label, ?string $path): string
    {
        $extension = pathinfo(parse_url((string) $path, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION);
        $filename = Str::slug($label);

        return $extension ? "{$filename}.{$extension}" : $filename;
    }

    public function downloadFileResponse(?string $path, string $filename): Response
    {
        abort_if(!$path, 404, 'File tidak ditemukan.');

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $response = Http::timeout(30)->get($path);
            abort_unless($response->successful(), 404, 'File tidak dapat diunduh.');

            return response()->make($response->body(), 200, [
                'Content-Type' => $response->header('Content-Type') ?: 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        }

        abort_unless(Storage::disk('s3')->exists($path), 404, 'File tidak ditemukan.');

        return response()->streamDownload(function () use ($path) {
            $stream = Storage::disk('s3')->readStream($path);
            if (is_resource($stream)) {
                fpassthru($stream);
                fclose($stream);
            }
        }, $filename, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    private function buildR2Url(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $accountId = 'a0eea8f875e1416b9ea4a5c4a1cea45e';

        return "https://pub-{$accountId}.r2.dev/{$path}";
    }

    private function normalizeRentPeriod(string $period): string
    {
        $normalized = strtolower(str_replace(' ', '', $period));

        return match ($normalized) {
            '3bulan' => '3bulan',
            '6bulan' => '6bulan',
            '12bulan', '1tahun', 'tahun' => 'tahun',
            default => 'bulan',
        };
    }
}

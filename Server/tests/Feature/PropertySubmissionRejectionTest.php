<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use App\Services\Property\PropertyMediaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PropertySubmissionRejectionTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_reject_a_draft_submission_and_delete_its_stored_files(): void
    {
        $this->app->useStoragePath(sys_get_temp_dir() . '/diproperti-tests-' . uniqid());
        Storage::fake('s3');
        $admin = $this->createUser('admin');
        $owner = $this->createUser('user');
        $property = $this->createProperty($owner, status: 'draft', isVerified: false);

        $property->images()->create(['image_url' => 'properties/draft.jpg', 'is_primary' => true]);
        $property->update([
            'certificate_file' => 'property-docs/certificate.pdf',
            'electric_bill_file' => 'property-docs/electricity.pdf',
            'water_bill_file' => 'property-docs/water.pdf',
        ]);

        foreach ([
            'properties/draft.jpg',
            'property-docs/certificate.pdf',
            'property-docs/electricity.pdf',
            'property-docs/water.pdf',
        ] as $path) {
            Storage::disk('s3')->put($path, 'test');
        }

        $this->assertSame([
            'properties/draft.jpg',
            'property-docs/certificate.pdf',
            'property-docs/electricity.pdf',
            'property-docs/water.pdf',
        ], app(PropertyMediaService::class)->collectStoredPaths($property->fresh()));

        $this->actingAs($admin)
            ->deleteJson("/api/admin/property-submissions/{$property->id}/reject")
            ->assertOk()
            ->assertJsonPath('message', 'Pengajuan properti berhasil ditolak dan dihapus');

        $this->assertDatabaseMissing('properties', ['id' => $property->id]);
        Storage::disk('s3')->assertMissing('properties/draft.jpg');
        Storage::disk('s3')->assertMissing('property-docs/certificate.pdf');
        Storage::disk('s3')->assertMissing('property-docs/electricity.pdf');
        Storage::disk('s3')->assertMissing('property-docs/water.pdf');
    }

    #[Test]
    public function admin_cannot_reject_an_already_published_property(): void
    {
        $admin = $this->createUser('admin');
        $owner = $this->createUser('user');
        $property = $this->createProperty($owner, status: 'published', isVerified: true);

        $this->actingAs($admin)
            ->deleteJson("/api/admin/property-submissions/{$property->id}/reject")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('property');

        $this->assertDatabaseHas('properties', ['id' => $property->id]);
    }

    private function createUser(string $role): User
    {
        return User::query()->create([
            'name' => ucfirst($role) . ' Test',
            'email' => $role . '-' . uniqid() . '@example.test',
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }

    private function createProperty(User $owner, string $status, bool $isVerified): Property
    {
        return Property::query()->create([
            'title' => 'Rumah Pengajuan Test',
            'type' => 'rumah',
            'listing_type' => 'jual',
            'kecamatan' => 'Patrang',
            'city' => 'Jember',
            'price' => 500000000,
            'status' => $status,
            'is_verified' => $isVerified,
            'user_id' => $owner->id,
        ]);
    }
}

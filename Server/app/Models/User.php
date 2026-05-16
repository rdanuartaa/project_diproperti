<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'full_name',
        'phone',
        'email',
        'password',
        'google_id',
        'avatar',
        'id_card_file',
        'role',
        'email_verified_at',
    ];

    protected $appends = [
        'id_card_file_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            return $this->avatar;
        }
        $emailHash = md5(strtolower(trim($this->email)));
        return "https://www.gravatar.com/avatar/{$emailHash}?d=mp";
    }

    public function getIdCardFileUrlAttribute(): ?string
    {
        if (!$this->id_card_file) {
            return null;
        }
        if (str_starts_with($this->id_card_file, 'http://') || str_starts_with($this->id_card_file, 'https://')) {
            return $this->id_card_file;
        }
        $accountId = 'a0eea8f875e1416b9ea4a5c4a1cea45e';
        return "https://pub-{$accountId}.r2.dev/{$this->id_card_file}";
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

}

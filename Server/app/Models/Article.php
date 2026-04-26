<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'image',
        'title',
        'slug',
        'description',
        'content',
        'status',
        'views',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'views' => 'integer',
    ];

    // ✅ TAMBAHKAN INI: Agar image_url otomatis muncul di JSON
    protected $appends = ['image_url'];

    // ✅ Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ✅ Relasi ke Tags
    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'article_tag');
    }

    // ✅ Accessor untuk image_url (SAMA PERSIS seperti PropertyImage)
    public function getImageUrlAttribute($value)
    {
        // Jika sudah full URL, return langsung
        if (str_starts_with($this->image, 'http://') || str_starts_with($this->image, 'https://')) {
            return $this->image;
        }
        $accountId = 'a0eea8f875e1416b9ea4a5c4a1cea45e';
        $path = ltrim($this->image, '/');
        
        return "https://pub-{$accountId}.r2.dev/{$path}";
    }

    // ✅ Auto-generate slug
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title) . '-' . Str::random(5);
            }
        });

        static::updating(function ($article) {
            if ($article->isDirty('title') && empty($article->slug)) {
                $article->slug = Str::slug($article->title) . '-' . Str::random(5);
            }
        });
    }
}
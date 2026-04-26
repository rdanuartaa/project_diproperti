<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'answer',
        'topic',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Scopes untuk filter
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeByTopic($query, $topic)
    {
        return $query->where('topic', $topic);
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('question', 'like', "%{$keyword}%")
              ->orWhere('answer', 'like', "%{$keyword}%");
        });
    }
}

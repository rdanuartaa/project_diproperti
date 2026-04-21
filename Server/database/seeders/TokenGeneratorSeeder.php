<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TokenGeneratorSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::find(1);

        if ($user) {
            $user->tokens()->delete();
            $token = $user->createToken('dev-token')->plainTextToken;

            echo "\n========================================\n";
            echo "TOKEN UNTUK POSTMAN:\n";
            echo $token . "\n";
            echo "========================================\n";
        }
    }
}

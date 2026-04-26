<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin Propty',
                'email' => 'admin@propty.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Rizal Danuarta',
                'email' => 'rizal@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Nanda Pratama',
                'email' => 'nanda@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'email_verified_at' => null,
            ],
            [
                'name' => 'Sarah Amelia',
                'email' => 'sarah@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'email_verified_at' => null,
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }

        $this->command->info('✅ 5 user dummy berhasil dibuat!');
        $this->command->warn("\n📋 Login Credentials:");
        $this->command->warn("Email: admin@propty.com | Password: password123 | Role: admin");
        $this->command->warn("Email: rizal@example.com | Password: password123 | Role: user");
        $this->command->warn("Email: nanda@example.com | Password: password123 | Role: user");
        $this->command->warn("Email: sarah@example.com | Password: password123 | Role: user");
        $this->command->warn("Email: budi@example.com | Password: password123 | Role: user");
    }
}

<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'Bagaimana cara memasang iklan properti di platform ini?',
                'answer' => 'Anda dapat memasang properti melalui dashboard akun dengan mengisi detail properti, mengunggah foto, dan melengkapi dokumen pendukung.',
                'topic' => 'properti',
                'status' => 'published',
            ],
            [
                'question' => 'Apakah properti yang dipublikasikan akan langsung tampil?',
                'answer' => 'Tidak. Semua properti akan melalui proses verifikasi admin terlebih dahulu untuk memastikan data valid dan aman bagi pengguna.',
                'topic' => 'properti',
                'status' => 'published',
            ],
            [
                'question' => 'Dokumen apa saja yang diperlukan saat menjual properti?',
                'answer' => 'Dokumen yang biasanya diperlukan meliputi sertifikat properti, tagihan listrik, dan tagihan air untuk proses verifikasi.',
                'topic' => 'properti',
                'status' => 'published',
            ],
            [
                'question' => 'Apa itu KPR?',
                'answer' => 'KPR atau Kredit Pemilikan Rumah adalah fasilitas pembiayaan dari bank untuk membantu pembelian rumah dengan sistem cicilan.',
                'topic' => 'kpr',
                'status' => 'published',
            ],
            [
                'question' => 'Bagaimana cara menghitung simulasi cicilan KPR?',
                'answer' => 'Anda dapat menggunakan fitur simulasi KPR di platform dengan memasukkan harga properti, DP, tenor, dan bunga pinjaman.',
                'topic' => 'kpr',
                'status' => 'published',
            ],
            [
                'question' => 'Berapa minimal uang muka untuk pengajuan KPR?',
                'answer' => 'Minimal uang muka tergantung kebijakan bank, namun umumnya dimulai dari 10% hingga 20% dari harga properti.',
                'topic' => 'kpr',
                'status' => 'published',
            ],
            [
                'question' => 'Apakah saya harus membuat akun untuk menggunakan platform?',
                'answer' => 'Ya. Anda perlu membuat akun untuk memasang properti, menyimpan favorit, dan menghubungi penjual.',
                'topic' => 'platform',
                'status' => 'published',
            ],
            [
                'question' => 'Apakah platform ini gratis digunakan?',
                'answer' => 'Sebagian besar fitur dapat digunakan secara gratis, namun beberapa layanan premium mungkin dikenakan biaya tambahan.',
                'topic' => 'platform',
                'status' => 'published',
            ],
            [
                'question' => 'Bagaimana cara menghubungi penjual properti?',
                'answer' => 'Anda dapat menggunakan tombol kontak atau WhatsApp yang tersedia pada halaman detail properti.',
                'topic' => 'platform',
                'status' => 'published',
            ],
            [
                'question' => 'Apakah data pengguna aman di platform ini?',
                'answer' => 'Kami menjaga keamanan data pengguna menggunakan sistem keamanan dan enkripsi untuk melindungi informasi pribadi.',
                'topic' => 'umum',
                'status' => 'published',
            ],
            [
                'question' => 'Bagaimana jika saya menemukan informasi properti yang tidak sesuai?',
                'answer' => 'Anda dapat melaporkan properti tersebut melalui fitur laporan agar admin dapat melakukan pengecekan lebih lanjut.',
                'topic' => 'umum',
                'status' => 'published',
            ],
            [
                'question' => 'Apakah platform ini tersedia versi mobile?',
                'answer' => 'Saat ini platform dapat diakses melalui browser mobile dan akan terus dikembangkan untuk pengalaman yang lebih optimal.',
                'topic' => 'umum',
                'status' => 'published',
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question']],
                $faq
            );
        }

        $this->command->info('✅ 12 FAQ dummy berhasil dibuat!');
        $this->command->warn("\n📋 FAQ Topics:");
        $this->command->warn("Properti : 3 FAQ");
        $this->command->warn("KPR      : 3 FAQ");
        $this->command->warn("Platform : 3 FAQ");
        $this->command->warn("Umum     : 3 FAQ");
    }
}

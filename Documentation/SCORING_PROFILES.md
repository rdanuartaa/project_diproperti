# Profil Referensi Skoring Properti

Rekomendasi dan komparasi menggunakan mesin SAW yang sama. Normalisasi harga dan
luas membaca profil referensi aktif dari tabel `property_scoring_profiles`.

## Dasar Perhitungan

Profil historis dibentuk dari properti terverifikasi dengan status `published`
atau `sold`, lalu dikelompokkan berdasarkan tipe properti dan jenis penawaran.
Properti berstatus `sold` tetap digunakan karena relevan sebagai data historis.

- Harga sewa dikonversi menjadi ekuivalen bulanan.
- Luas dihitung sebagai luas komposit sesuai tipe properti.
- Batas bawah memakai persentil ke-5 (`P5`).
- Batas atas memakai persentil ke-95 (`P95`).
- Sampel minimum default adalah `30` properti per kategori.
- Jika sampel belum cukup, sistem memakai fallback terdokumentasi.

Profil disimpan dan diberi versi. Skor tidak dihitung ulang berdasarkan kandidat
pada halaman saat itu, sehingga penambahan satu properti ekstrem tidak langsung
mengubah skor properti lama.

## Perintah Operasional

Setelah migration dijalankan:

```bash
php artisan properties:refresh-scoring-profiles --min-samples=30
```

Untuk melihat hasil tanpa menyimpannya:

```bash
php artisan properties:refresh-scoring-profiles --min-samples=30 --dry-run
```

Scheduler Laravel menjalankan refresh otomatis setiap 1 Januari dan 1 Juli pukul
02.00. Pastikan cron scheduler Laravel aktif pada server produksi:

```cron
* * * * * cd /path/to/Server && php artisan schedule:run >> /dev/null 2>&1
```

## Urutan Deploy Produksi

```bash
php artisan migrate --force
php artisan properties:refresh-scoring-profiles --min-samples=30
php artisan optimize:clear
```

Simpan output command sebagai catatan baseline versi awal untuk dokumentasi
akademik dan audit perubahan skor.

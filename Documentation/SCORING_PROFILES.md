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

## Baseline Fallback Luas

Fallback luas dipakai selama data historis kategori belum mencapai 30 sampel.
Nilainya dibuat lebih representatif untuk fase awal aplikasi:

| Tipe | Penawaran | Min luas | Max luas |
| --- | --- | ---: | ---: |
| Rumah | Jual | 20 | 500 |
| Rumah | Sewa | 20 | 500 |
| Villa | Jual | 30 | 1.000 |
| Villa | Sewa | 30 | 1.000 |
| Ruko | Jual | 10 | 750 |
| Ruko | Sewa | 10 | 750 |
| Kos | Sewa | 1 | 30 |
| Tanah | Jual | 20 | 10.000 |
| Tanah | Sewa | 20 | 10.000 |

Nilai tersebut adalah baseline fallback terkurasi, bukan hasil P5-P95. Setelah
jumlah sampel mencukupi, sistem dapat beralih ke profil historis P5-P95.

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

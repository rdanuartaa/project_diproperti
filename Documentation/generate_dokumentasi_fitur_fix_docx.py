from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT = Path(__file__).with_name("Dokumentasi_FIX_Rekomendasi_Komparasi_dan_Simulasi_KPR.docx")


def txt(value):
    return escape(str(value))


def run(text, bold=False, italic=False, size=None, color=None):
    props = []
    if bold:
        props.append("<w:b/>")
    if italic:
        props.append("<w:i/>")
    if size:
        props.append(f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>')
    if color:
        props.append(f'<w:color w:val="{color}"/>')
    prop_xml = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    return f'<w:r>{prop_xml}<w:t xml:space="preserve">{txt(text)}</w:t></w:r>'


def paragraph(text="", style=None, bold=False, italic=False, align=None, size=None, color=None):
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        props.append(f'<w:jc w:val="{align}"/>')
    prop_xml = f"<w:pPr>{''.join(props)}</w:pPr>" if props else ""
    return f"<w:p>{prop_xml}{run(text, bold, italic, size, color)}</w:p>"


def bullet(text):
    return paragraph(f"- {text}", style="ListParagraph")


def numbered(number, text):
    return paragraph(f"{number}. {text}", style="ListParagraph")


def cell(value, header=False):
    shade = '<w:shd w:fill="D9EAF7"/>' if header else ""
    return f"<w:tc><w:tcPr>{shade}</w:tcPr>{paragraph(value, bold=header)}</w:tc>"


def table(headers, rows, widths=None):
    widths = widths or [2400] * len(headers)
    grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    props = (
        '<w:tblPr><w:tblStyle w:val="TableGrid"/>'
        '<w:tblW w:w="0" w:type="auto"/>'
        '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" '
        'w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'
        "</w:tblPr>"
    )
    header = "<w:tr>" + "".join(cell(item, True) for item in headers) + "</w:tr>"
    body = "".join("<w:tr>" + "".join(cell(item) for item in row) + "</w:tr>" for row in rows)
    return f"<w:tbl>{props}<w:tblGrid>{grid}</w:tblGrid>{header}{body}</w:tbl>"


def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


body = []
add = body.append

# Cover
add(paragraph("DOKUMENTASI FIX FITUR DIPROPERTI", bold=True, align="center", size=36, color="0B4F9C"))
add(paragraph("Rekomendasi Properti, Komparasi Properti, dan Simulasi KPR", bold=True, align="center", size=26))
add(paragraph(""))
add(paragraph("Dokumen Pendukung Presentasi dan Penjelasan Implementasi", align="center", size=23))
add(paragraph("Versi implementasi lokal: 2 Juni 2026", italic=True, align="center"))
add(paragraph(""))
add(paragraph(""))
add(paragraph("Cakupan dokumen:", bold=True, align="center"))
add(paragraph("1. Konsep dan alur fitur", align="center"))
add(paragraph("2. Rumus yang digunakan sistem", align="center"))
add(paragraph("3. Contoh perhitungan manual", align="center"))
add(paragraph("4. Pemetaan file dan nomor baris kode", align="center"))
add(page_break())

# Executive summary
add(paragraph("1. Ringkasan Sistem", style="Heading1"))
add(paragraph(
    "Aplikasi Diproperti memiliki tiga fitur pendukung keputusan. Rekomendasi properti bersifat personal "
    "karena bobot kriteria berasal dari preferensi pengguna melalui AHP. Komparasi properti bersifat "
    "terstruktur karena bobot kriteria ditetapkan oleh sistem berdasarkan tipe properti. Kedua fitur memakai "
    "mesin SAW yang sama. Simulasi KPR berdiri terpisah dan menghitung estimasi cicilan menggunakan bunga flat."
))
add(table(
    ["Fitur", "Tujuan", "Metode", "Sumber bobot atau input"],
    [
        ["Rekomendasi", "Mengurutkan properti sesuai kebutuhan pengguna", "AHP + SAW", "Bobot AHP dari pengguna"],
        ["Komparasi", "Membandingkan 2-3 properti sejenis", "SAW", "Profil bobot baku sistem per tipe"],
        ["Simulasi KPR", "Mengestimasi cicilan bulanan", "Bunga flat", "Harga, DP, bunga tahunan, dan tenor"],
    ],
    [1700, 2900, 1500, 2800],
))
add(paragraph(""))
add(paragraph("Kesimpulan singkat untuk presentasi:", bold=True))
add(paragraph(
    "Rekomendasi menjawab properti mana yang paling cocok untuk pengguna. Komparasi menjawab properti mana "
    "yang lebih unggul menurut baseline sistem. Simulasi KPR menjawab berapa estimasi cicilan pembelian."
))

# Shared scoring
add(paragraph("2. Mesin Skoring SAW Bersama", style="Heading1"))
add(paragraph(
    "Rekomendasi dan komparasi menggunakan PropertyScoringService yang sama. Perbedaannya bukan pada rumus "
    "normalisasi, melainkan pada sumber bobot kriteria."
))
add(paragraph("2.1 Kriteria", style="Heading2"))
add(table(
    ["Kriteria", "Jenis", "Makna skor tinggi"],
    [
        ["Harga", "Cost", "Harga lebih terjangkau terhadap profil referensi"],
        ["Lokasi", "Benefit", "Jarak lebih dekat ke pusat Jember"],
        ["Luas", "Benefit", "Luas komposit lebih besar terhadap profil referensi"],
        ["Fasilitas", "Benefit", "Kelengkapan fasilitas lebih baik sesuai tipe properti"],
    ],
    [1700, 1300, 5600],
))
add(paragraph(""))
add(paragraph("2.2 Rumus Normalisasi", style="Heading2"))
add(paragraph("Normalisasi benefit = clamp((nilai - minimum) / (maksimum - minimum), 0, 1)"))
add(paragraph("Skor harga = 1 - normalisasi harga"))
add(paragraph("Skor lokasi = 1 - clamp(jarak dari pusat Jember / 30 km, 0, 1)"))
add(paragraph("Skor luas = normalisasi luas komposit"))
add(paragraph("Skor fasilitas = nilai fasilitas pada skala 0 sampai 1"))
add(paragraph(""))
add(paragraph("Rumus skor akhir SAW:", bold=True))
add(paragraph(
    "Skor mentah = (skor harga x bobot harga) + (skor lokasi x bobot lokasi) + "
    "(skor luas x bobot luas) + (skor fasilitas x bobot fasilitas)"
))
add(paragraph("Skor akhir = maks(0, skor mentah - penalti data belum lengkap)"))
add(paragraph("Penalti = 5% per field penting kosong, maksimal 30%."))

add(paragraph("2.3 Luas Komposit", style="Heading2"))
add(table(
    ["Tipe", "Rumus luas komposit"],
    [
        ["Rumah dan Villa", "(60% x luas bangunan) + (40% x luas tanah)"],
        ["Ruko", "(50% x luas bangunan) + (30% x luas tanah) + (20% x (lebar depan + luas gudang))"],
        ["Kos", "(70% x luas kamar) + (30% x total kamar)"],
        ["Tanah", "100% x luas tanah"],
    ],
    [1900, 6500],
))

add(paragraph("2.4 Profil Referensi Skoring", style="Heading2"))
add(paragraph(
    "Profil referensi skoring berbeda dari bobot komparasi. Profil referensi menentukan cara mengubah data "
    "mentah menjadi skor 0-100%. Karena data properti aplikasi masih sedikit, sistem saat ini memakai baseline "
    "fallback terkurasi dan stabil."
))
add(table(
    ["Tipe", "Penawaran", "Rentang harga", "Rentang luas fallback"],
    [
        ["Rumah", "Jual", "Rp100 juta - Rp5 miliar", "20 - 500"],
        ["Rumah", "Sewa", "Rp500 ribu - Rp20 juta/bulan", "20 - 500"],
        ["Villa", "Jual", "Rp250 juta - Rp10 miliar", "30 - 1.000"],
        ["Villa", "Sewa", "Rp1 juta - Rp50 juta/bulan", "30 - 1.000"],
        ["Ruko", "Jual", "Rp100 juta - Rp5 miliar", "10 - 750"],
        ["Ruko", "Sewa", "Rp1 juta - Rp50 juta/bulan", "10 - 750"],
        ["Kos", "Sewa", "Rp250 ribu - Rp5 juta/bulan", "1 - 30"],
        ["Tanah", "Jual", "Rp50 juta - Rp5 miliar", "20 - 10.000"],
        ["Tanah", "Sewa", "Rp500 ribu - Rp30 juta/bulan", "20 - 10.000"],
    ],
    [1400, 1300, 3200, 2300],
))
add(paragraph(""))
add(paragraph(
    "Ketika tersedia minimal 30 sampel historis terverifikasi pada kategori yang sama, sistem dapat memakai "
    "P5-P95 historis. Profil disimpan dan diberi versi agar skor tidak berubah setiap kali halaman dibuka."
))

add(paragraph("2.5 Konversi Harga Sewa", style="Heading2"))
add(table(
    ["Periode input", "Harga ekuivalen bulanan"],
    [
        ["Hari", "harga x 30"],
        ["Minggu", "harga x 4,345"],
        ["Bulan", "harga"],
        ["3 bulan", "harga / 3"],
        ["6 bulan", "harga / 6"],
        ["Tahun", "harga / 12"],
    ],
    [2200, 5600],
))

# Recommendation
add(paragraph("3. Fitur Rekomendasi Properti", style="Heading1"))
add(paragraph("3.1 Tujuan dan Alur", style="Heading2"))
add(paragraph(
    "Rekomendasi bersifat personal. Pengguna lebih dahulu memilih tipe dan jenis penawaran agar properti yang "
    "dibandingkan sepadan. Setelah itu pengguna mengisi enam perbandingan kriteria AHP."
))
add(numbered(1, "Pilih tipe properti dan penawaran. Default aplikasi adalah rumah dijual."))
add(numbered(2, "Bandingkan Harga, Lokasi, Luas, dan Fasilitas melalui enam pertanyaan AHP."))
add(numbered(3, "Hitung bobot prioritas dan rasio konsistensi AHP."))
add(numbered(4, "Jika CR > 10%, tombol Terapkan Preferensi dinonaktifkan."))
add(numbered(5, "Kirim bobot personal ke backend."))
add(numbered(6, "Hitung skor SAW seluruh kandidat, kurangi penalti data kosong, urutkan ranking, lalu tampilkan 10 properti per halaman."))

add(paragraph("3.2 Contoh Manual AHP", style="Heading2"))
add(paragraph("Contoh preferensi pengguna:"))
add(table(
    ["Perbandingan", "Nilai"],
    [
        ["Harga : Lokasi", "2"],
        ["Harga : Luas", "4"],
        ["Harga : Fasilitas", "4"],
        ["Lokasi : Luas", "2"],
        ["Lokasi : Fasilitas", "2"],
        ["Luas : Fasilitas", "1"],
    ],
    [4200, 1600],
))
add(paragraph(""))
add(paragraph("Matriks perbandingan:"))
add(table(
    ["Kriteria", "Harga", "Lokasi", "Luas", "Fasilitas"],
    [
        ["Harga", "1", "2", "4", "4"],
        ["Lokasi", "1/2", "1", "2", "2"],
        ["Luas", "1/4", "1/2", "1", "1"],
        ["Fasilitas", "1/4", "1/2", "1", "1"],
        ["Jumlah kolom", "2", "4", "8", "8"],
    ],
    [1900, 1400, 1400, 1400, 1500],
))
add(paragraph(""))
add(paragraph("Normalisasi menghasilkan rata-rata baris:"))
add(table(
    ["Kriteria", "Bobot teoritis", "Bobot request setelah pembulatan"],
    [
        ["Harga", "50%", "50%"],
        ["Lokasi", "25%", "25%"],
        ["Luas", "12,5%", "13%"],
        ["Fasilitas", "12,5%", "12%"],
    ],
    [2300, 2300, 3100],
))
add(paragraph(""))
add(paragraph("Uji konsistensi:"))
add(paragraph("lambda maks = 4; n = 4; RI = 0,90"))
add(paragraph("CI = (4 - 4) / (4 - 1) = 0"))
add(paragraph("CR = 0 / 0,90 = 0%"))
add(paragraph("Karena CR <= 10%, preferensi boleh diterapkan.", bold=True))

add(paragraph("3.3 Contoh Manual SAW Rekomendasi", style="Heading2"))
add(paragraph(
    "Simulasi Rumah A dijual: harga Rp650.000.000, jarak 5,7 km, luas bangunan 200 m2, luas tanah 200 m2, "
    "skor fasilitas 0,46, dan tidak ada data wajib kosong. Gunakan bobot AHP personal: Harga 50%, Lokasi 25%, "
    "Luas 13%, Fasilitas 12%."
))
add(paragraph("Skor harga = 1 - ((650.000.000 - 100.000.000) / (5.000.000.000 - 100.000.000)) = 0,887755"))
add(paragraph("Skor lokasi = 1 - (5,7 / 30) = 0,810000"))
add(paragraph("Luas komposit = (60% x 200) + (40% x 200) = 200"))
add(paragraph("Skor luas = (200 - 20) / (500 - 20) = 0,375000"))
add(paragraph("Skor fasilitas = 0,460000"))
add(paragraph(
    "Skor akhir = (0,887755 x 0,50) + (0,810000 x 0,25) + "
    "(0,375000 x 0,13) + (0,460000 x 0,12)"
))
add(paragraph("Skor akhir = 0,750327 atau Kecocokan 75%", bold=True, color="0B4F9C"))
add(paragraph(
    "Angka kecocokan adalah skor SAW yang dikalikan 100 dan dibulatkan. Angka tersebut bukan probabilitas "
    "bahwa pengguna pasti membeli properti."
))

# Comparison
add(paragraph("4. Fitur Komparasi Properti", style="Heading1"))
add(paragraph("4.1 Tujuan dan Aturan", style="Heading2"))
add(paragraph(
    "Komparasi memakai SAW tanpa pertanyaan AHP. Tujuannya memberi baseline sistem yang konsisten ketika "
    "pengguna membandingkan dua sampai tiga properti."
))
add(bullet("Properti yang dibandingkan harus berjumlah 2-3."))
add(bullet("Tipe properti dan jenis penawaran harus sama."))
add(bullet("Properti harus berstatus published dan terverifikasi."))
add(bullet("Kos hanya dapat dibandingkan sebagai properti sewa."))

add(paragraph("4.2 Profil Bobot Komparasi Sistem", style="Heading2"))
add(table(
    ["Tipe", "Harga", "Lokasi", "Luas", "Fasilitas"],
    [
        ["Rumah", "30%", "25%", "25%", "20%"],
        ["Villa", "25%", "25%", "20%", "30%"],
        ["Kos", "30%", "30%", "15%", "25%"],
        ["Ruko", "30%", "30%", "25%", "15%"],
        ["Tanah", "30%", "30%", "30%", "10%"],
    ],
    [1900, 1400, 1400, 1400, 1600],
))
add(paragraph(""))
add(paragraph("Perbedaan istilah penting:", bold=True))
add(table(
    ["Istilah", "Fungsi", "Contoh"],
    [
        ["Profil referensi skoring", "Mengubah data mentah menjadi skor kriteria 0-100%", "Luas rumah fallback 20-500"],
        ["Profil bobot komparasi", "Menentukan kontribusi skor kriteria terhadap skor akhir", "Bobot luas rumah 25%"],
    ],
    [2400, 3900, 2100],
))

add(paragraph("4.3 Contoh Manual SAW Komparasi", style="Heading2"))
add(paragraph(
    "Gunakan Rumah A yang sama. Nilai kriterianya sama, tetapi bobot berasal dari profil sistem rumah: "
    "Harga 30%, Lokasi 25%, Luas 25%, dan Fasilitas 20%."
))
add(paragraph(
    "Skor akhir = (0,887755 x 0,30) + (0,810000 x 0,25) + "
    "(0,375000 x 0,25) + (0,460000 x 0,20)"
))
add(paragraph("Skor akhir = 0,654577 atau 65 / 100", bold=True, color="0B4F9C"))
add(paragraph(""))
add(paragraph("Contoh membaca tampilan komparasi:", bold=True))
add(paragraph(
    "Jika tabel menampilkan Harga 96%, Lokasi 92%, Luas 8%, dan Fasilitas 51% untuk rumah, maka skor akhir "
    "dihitung sebagai (96% x 30%) + (92% x 25%) + (8% x 25%) + (51% x 20%) = 64%."
))

# KPR
add(paragraph("5. Fitur Simulasi KPR", style="Heading1"))
add(paragraph("5.1 Tujuan dan Batasan", style="Heading2"))
add(paragraph(
    "Simulasi KPR menghitung estimasi cicilan menggunakan bunga flat. Kalkulator ini membantu perencanaan awal, "
    "bukan penawaran resmi bank. Bank dapat memakai metode anuitas, bunga efektif, biaya administrasi, asuransi, "
    "provisi, appraisal, dan aturan lain yang tidak dihitung oleh fitur ini."
))
add(paragraph("5.2 Input", style="Heading2"))
add(table(
    ["Input", "Keterangan"],
    [
        ["Harga properti", "Harga jual properti"],
        ["Uang muka (DP)", "Pembayaran awal pengguna"],
        ["Bunga flat", "Persentase bunga per tahun"],
        ["Tenor", "Lama pinjaman dalam bulan: 12 sampai 240 bulan"],
    ],
    [2500, 5600],
))

add(paragraph("5.3 Rumus Bunga Flat", style="Heading2"))
add(paragraph("Pokok pinjaman = harga properti - uang muka"))
add(paragraph("Persentase DP = (uang muka / harga properti) x 100%"))
add(paragraph("Bunga per bulan = (pokok pinjaman x (bunga tahunan / 100)) / 12"))
add(paragraph("Pokok per bulan = pokok pinjaman / tenor bulan"))
add(paragraph("Angsuran per bulan = pokok per bulan + bunga per bulan"))
add(paragraph("Total bayar = angsuran per bulan x tenor bulan"))
add(paragraph("Total bunga = total bayar - pokok pinjaman"))

add(paragraph("5.4 Contoh Hitung Manual KPR", style="Heading2"))
add(table(
    ["Data simulasi", "Nilai"],
    [
        ["Harga properti", "Rp500.000.000"],
        ["Uang muka", "Rp100.000.000"],
        ["Bunga flat per tahun", "6%"],
        ["Tenor", "120 bulan atau 10 tahun"],
    ],
    [3000, 4200],
))
add(paragraph(""))
add(paragraph("Pokok pinjaman = Rp500.000.000 - Rp100.000.000 = Rp400.000.000"))
add(paragraph("Persentase DP = (Rp100.000.000 / Rp500.000.000) x 100% = 20%"))
add(paragraph("Bunga per bulan = (Rp400.000.000 x 6%) / 12 = Rp2.000.000"))
add(paragraph("Pokok per bulan = Rp400.000.000 / 120 = Rp3.333.333,33"))
add(paragraph("Angsuran per bulan = Rp3.333.333,33 + Rp2.000.000 = Rp5.333.333,33"))
add(paragraph("Total bayar = Rp5.333.333,33 x 120 = Rp640.000.000"))
add(paragraph("Total bunga = Rp640.000.000 - Rp400.000.000 = Rp240.000.000"))
add(paragraph("Estimasi cicilan bulanan = sekitar Rp5.333.333", bold=True, color="0B4F9C"))

# Code mapping
add(paragraph("6. Pemetaan File dan Baris Kode", style="Heading1"))
add(paragraph(
    "Nomor baris berikut mengacu pada source code lokal tanggal 2 Juni 2026. Nomor dapat bergeser jika file "
    "diedit kembali, tetapi nama file dan tanggung jawab modul tetap sama."
))
add(paragraph("6.1 Rekomendasi dan AHP", style="Heading2"))
add(table(
    ["File", "Baris", "Fungsi"],
    [
        ["Client/components/otherPages/rekomendasi/RekomendasiProperti.jsx", "118-158", "Membentuk matriks AHP, priority vector, CI, dan CR."],
        ["Client/components/otherPages/rekomendasi/RekomendasiProperti.jsx", "211-222", "Mengirim filter dan bobot AHP ke endpoint rekomendasi."],
        ["Client/components/otherPages/rekomendasi/RekomendasiProperti.jsx", "261-270", "Membatasi penerapan bobot ketika CR lebih dari 10%."],
        ["Server/app/Services/Property/PropertyRecommendationService.php", "101-119", "Menerima bobot personal, memanggil SAW, mengurutkan ranking."],
        ["Client/components/properties/PropertyListItems.jsx", "171-191", "Menampilkan Kecocokan pada kartu list."],
        ["Client/components/properties/PropertyGridItems.jsx", "170-190", "Menampilkan Kecocokan pada kartu grid."],
    ],
    [4300, 1100, 3100],
))

add(paragraph("6.2 Mesin SAW dan Profil Referensi", style="Heading2"))
add(table(
    ["File", "Baris", "Fungsi"],
    [
        ["Server/app/Services/Property/PropertyScoringService.php", "19-39", "Baseline fallback harga dan luas per kategori."],
        ["Server/app/Services/Property/PropertyScoringService.php", "59-78", "Memilih profil aktif atau fallback."],
        ["Server/app/Services/Property/PropertyScoringService.php", "93-140", "Normalisasi kriteria, agregasi SAW, penalti, dan metadata audit."],
        ["Server/app/Services/Property/PropertyScoringService.php", "143-157", "Konversi harga sewa menjadi ekuivalen bulanan."],
        ["Server/app/Services/Property/PropertyScoringService.php", "204 dan seterusnya", "Perhitungan luas komposit dan fasilitas sesuai tipe."],
        ["Server/app/Services/Property/PropertyScoringProfileService.php", "51-90", "Membentuk versi profil aktif dari fallback atau historis."],
        ["Server/app/Services/Property/PropertyScoringProfileService.php", "98-125", "Mengambil properti historis dan menghitung P5-P95."],
        ["Server/routes/console.php", "13-46", "Command refresh profil dan jadwal pembaruan berkala."],
    ],
    [4300, 1100, 3100],
))

add(paragraph("6.3 Komparasi", style="Heading2"))
add(table(
    ["File", "Baris", "Fungsi"],
    [
        ["Server/app/Services/Property/PropertyComparisonService.php", "13-19", "Profil bobot komparasi baku berdasarkan tipe properti."],
        ["Server/app/Services/Property/PropertyComparisonService.php", "75-89", "Menghitung skor SAW dan ranking komparasi."],
        ["Client/components/compare/Compare.jsx", "395-399", "Membaca bobot komparasi dan membulatkan skor untuk UI."],
    ],
    [4300, 1100, 3100],
))

add(paragraph("6.4 Simulasi KPR", style="Heading2"))
add(table(
    ["File", "Baris", "Fungsi"],
    [
        ["Client/app/(main)/(otherPages)/simulasi-kpr/page.jsx", "17-29", "Menyusun halaman simulasi KPR."],
        ["Client/components/otherPages/BungaFlat/LoanCalculator.jsx", "27-38", "Daftar tenor pembayaran."],
        ["Client/components/otherPages/BungaFlat/LoanCalculator.jsx", "97-117", "Validasi input kalkulator."],
        ["Client/components/otherPages/BungaFlat/LoanCalculator.jsx", "119-145", "Perhitungan bunga flat, cicilan, total bayar, dan total bunga."],
    ],
    [4300, 1100, 3100],
))

# Database and ops
add(paragraph("7. Fungsi Tabel property_scoring_profiles", style="Heading1"))
add(paragraph(
    "Tabel property_scoring_profiles menyimpan profil referensi skoring, bukan bobot komparasi. Tujuannya agar "
    "normalisasi harga dan luas dapat diaudit serta tidak berubah hanya karena kandidat pada satu halaman berubah."
))
add(table(
    ["Kolom", "Fungsi"],
    [
        ["type dan listing_type", "Kategori properti dan penawaran."],
        ["version", "Versi baseline referensi."],
        ["min_price dan max_price", "Rentang harga untuk normalisasi."],
        ["min_area dan max_area", "Rentang luas komposit untuk normalisasi."],
        ["sample_count", "Jumlah data historis valid pada kategori."],
        ["minimum_sample_size", "Ambang minimal agar profil historis boleh dipakai."],
        ["source_type", "fallback atau historical."],
        ["is_active", "Menandai versi yang sedang dipakai."],
        ["generated_at", "Waktu profil dibuat."],
    ],
    [2600, 5700],
))
add(paragraph(""))
add(paragraph("Command pembentukan profil:", bold=True))
add(paragraph("php artisan properties:refresh-scoring-profiles --min-samples=30"))
add(paragraph(
    "Selama sampel belum mencapai 30 per kategori, gunakan source_type fallback dan jelaskan bahwa baseline "
    "tersebut merupakan fallback terkurasi untuk fase awal aplikasi."
))

# Presentation
add(paragraph("8. Narasi Presentasi Singkat", style="Heading1"))
add(numbered(1, "Rekomendasi dan komparasi menggunakan mesin SAW yang sama agar rumus penilaiannya konsisten."))
add(numbered(2, "Pada rekomendasi, AHP menangkap prioritas pengguna dan mengubahnya menjadi bobot SAW personal."))
add(numbered(3, "Pada komparasi, sistem memakai profil bobot baku per tipe agar hasilnya stabil dan mudah dibandingkan."))
add(numbered(4, "Profil referensi skoring berbeda dari profil bobot. Profil referensi mengubah data mentah menjadi skor kriteria."))
add(numbered(5, "Karena data historis masih sedikit, sistem memakai baseline fallback terkurasi. Setelah data cukup, tersedia mekanisme P5-P95 historis."))
add(numbered(6, "Simulasi KPR berdiri terpisah dan memberi estimasi cicilan menggunakan metode bunga flat."))

add(paragraph("9. Kesimpulan", style="Heading1"))
add(paragraph(
    "Struktur fitur telah dipisahkan secara jelas. Rekomendasi bersifat personal melalui AHP dan SAW. Komparasi "
    "bersifat terstruktur melalui bobot baku sistem dan SAW. Profil referensi menjaga normalisasi tetap stabil. "
    "Simulasi KPR membantu pengguna memperkirakan kemampuan pembayaran melalui perhitungan bunga flat yang "
    "transparan dan mudah diverifikasi secara manual."
))
add(paragraph(""))
add(paragraph("Dokumen selesai.", italic=True, align="center", color="666666"))


document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {''.join(body)}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId2"/>
      <w:footerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1000" w:bottom="1134" w:left="1000" w:header="708" w:footer="708"/>
    </w:sectPr>
  </w:body>
</w:document>'''

styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr>
    <w:pPr><w:spacing w:after="100" w:line="260" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:pPr><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="0B4F9C"/><w:sz w:val="29"/><w:szCs w:val="29"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:pPr><w:spacing w:before="190" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="360"/><w:spacing w:after="70"/></w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="B7C9D6"/>
      <w:left w:val="single" w:sz="4" w:color="B7C9D6"/>
      <w:bottom w:val="single" w:sz="4" w:color="B7C9D6"/>
      <w:right w:val="single" w:sz="4" w:color="B7C9D6"/>
      <w:insideH w:val="single" w:sz="4" w:color="B7C9D6"/>
      <w:insideV w:val="single" w:sz="4" w:color="B7C9D6"/>
    </w:tblBorders><w:tblCellMar>
      <w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>
      <w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/>
    </w:tblCellMar></w:tblPr>
  </w:style>
</w:styles>'''

content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>'''

root_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''

document_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>'''

header = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr>
  <w:t>Diproperti | Dokumentasi Fitur</w:t></w:r></w:p>
</w:hdr>'''

footer = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>Halaman </w:t></w:r>
    <w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
  </w:p>
</w:ftr>'''

core = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Dokumentasi FIX Rekomendasi, Komparasi, dan Simulasi KPR</dc:title>
  <dc:creator>Diproperti</dc:creator>
  <dc:subject>Dokumentasi fitur pendukung keputusan</dc:subject>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-02T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-02T00:00:00Z</dcterms:modified>
</cp:coreProperties>'''

app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Microsoft Office Word</Application>
  <AppVersion>16.0000</AppVersion>
</Properties>'''

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as docx:
    docx.writestr("[Content_Types].xml", content_types)
    docx.writestr("_rels/.rels", root_rels)
    docx.writestr("word/document.xml", document_xml)
    docx.writestr("word/styles.xml", styles_xml)
    docx.writestr("word/_rels/document.xml.rels", document_rels)
    docx.writestr("word/header1.xml", header)
    docx.writestr("word/footer1.xml", footer)
    docx.writestr("docProps/core.xml", core)
    docx.writestr("docProps/app.xml", app)

print(f"Created: {OUTPUT}")

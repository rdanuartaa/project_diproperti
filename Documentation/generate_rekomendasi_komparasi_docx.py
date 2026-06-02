from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT = Path(__file__).with_name("Penjelasan_Rekomendasi_dan_Komparasi_Properti.docx")


def xml_text(value):
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
    return f'<w:r>{prop_xml}<w:t xml:space="preserve">{xml_text(text)}</w:t></w:r>'


def paragraph(text="", style=None, bold=False, italic=False, align=None, size=None, color=None):
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        props.append(f'<w:jc w:val="{align}"/>')
    prop_xml = f"<w:pPr>{''.join(props)}</w:pPr>" if props else ""
    return f"<w:p>{prop_xml}{run(text, bold=bold, italic=italic, size=size, color=color)}</w:p>"


def rich_paragraph(parts, style=None, align=None):
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        props.append(f'<w:jc w:val="{align}"/>')
    prop_xml = f"<w:pPr>{''.join(props)}</w:pPr>" if props else ""
    runs = "".join(run(**part) for part in parts)
    return f"<w:p>{prop_xml}{runs}</w:p>"


def bullet(text):
    return paragraph(f"- {text}", style="ListParagraph")


def numbered(number, text):
    return paragraph(f"{number}. {text}", style="ListParagraph")


def cell(value, header=False):
    shade = '<w:shd w:fill="D9EAF7"/>' if header else ""
    content = paragraph(str(value), bold=header)
    return f"<w:tc><w:tcPr>{shade}</w:tcPr>{content}</w:tc>"


def table(headers, rows, widths=None):
    if widths is None:
        widths = [2400] * len(headers)
    grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    table_props = (
        '<w:tblPr><w:tblStyle w:val="TableGrid"/>'
        '<w:tblW w:w="0" w:type="auto"/>'
        '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" '
        'w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'
        "</w:tblPr>"
    )
    header_row = "<w:tr>" + "".join(cell(value, header=True) for value in headers) + "</w:tr>"
    body_rows = "".join(
        "<w:tr>" + "".join(cell(value) for value in row) + "</w:tr>" for row in rows
    )
    return f"<w:tbl>{table_props}<w:tblGrid>{grid}</w:tblGrid>{header_row}{body_rows}</w:tbl>"


def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


body = []
add = body.append

# Cover
add(paragraph("PENJELASAN SISTEM REKOMENDASI DAN KOMPARASI PROPERTI", bold=True, align="center", size=34, color="0B4F9C"))
add(paragraph("Penerapan AHP dan SAW pada Aplikasi Diproperti", bold=True, align="center", size=26))
add(paragraph(""))
add(paragraph(""))
add(paragraph("Dokumen Pendukung Presentasi", align="center", size=24))
add(paragraph("Disusun berdasarkan implementasi aplikasi lokal per 2 Juni 2026", align="center", italic=True))
add(paragraph(""))
add(paragraph(""))
add(paragraph("Fokus pembahasan:", bold=True, align="center"))
add(paragraph("1. Rekomendasi personal menggunakan AHP dan SAW", align="center"))
add(paragraph("2. Komparasi objektif menggunakan profil bobot dan SAW", align="center"))
add(paragraph("3. Simulasi perhitungan manual dari awal sampai hasil akhir", align="center"))
add(page_break())

# Overview
add(paragraph("1. Gambaran Umum", style="Heading1"))
add(paragraph(
    "Aplikasi menyediakan dua fitur yang sama-sama menilai properti, tetapi tujuan keduanya berbeda. "
    "Menu rekomendasi mencari properti yang paling sesuai dengan preferensi pengguna. "
    "Menu komparasi membantu pengguna membandingkan dua sampai tiga properti sejenis menggunakan "
    "profil penilaian yang tetap dan mudah dijelaskan."
))
add(table(
    ["Fitur", "Tujuan", "Sumber bobot", "Metode akhir"],
    [
        ["Rekomendasi", "Mengurutkan properti sesuai prioritas pengguna", "Hasil pertanyaan AHP pengguna", "SAW"],
        ["Komparasi", "Membandingkan properti sejenis secara terstruktur", "Profil bobot baku per tipe", "SAW"],
    ],
    [1700, 3000, 2600, 1200],
))
add(paragraph(""))
add(paragraph("Poin utama untuk disampaikan:", style="Heading2"))
add(bullet("AHP tidak menghitung skor properti. AHP hanya menentukan bobot kepentingan kriteria pada menu rekomendasi."))
add(bullet("SAW menghitung skor akhir properti setelah bobot tersedia."))
add(bullet("Mesin SAW dipakai bersama oleh rekomendasi dan komparasi agar rumus penilaiannya konsisten."))
add(bullet("Angka kecocokan, misalnya 62%, adalah skor SAW yang dikalikan 100 dan dibulatkan. Nilai ini bukan probabilitas statistik."))

# Architecture
add(paragraph("2. Struktur Logika Aplikasi", style="Heading1"))
add(paragraph("Logika telah dipisahkan menjadi tiga service agar tanggung jawab setiap bagian jelas:"))
add(table(
    ["Service", "Peran"],
    [
        ["PropertyScoringService", "Mesin perhitungan SAW bersama: normalisasi, harga sewa bulanan, luas, lokasi, fasilitas, dan penalti data."],
        ["PropertyRecommendationService", "Memfilter kandidat, menerima bobot hasil AHP pengguna, menghitung skor rekomendasi, mengurutkan hasil, dan membuat pagination."],
        ["PropertyComparisonService", "Memvalidasi properti yang dibandingkan, memilih profil bobot baku per tipe, dan menghitung skor komparasi."],
    ],
    [2500, 6000],
))
add(paragraph(""))
add(paragraph("Alur ringkas:", style="Heading2"))
add(paragraph("Rekomendasi: Filter tipe dan penawaran -> Pertanyaan AHP -> Uji konsistensi -> Bobot personal -> SAW -> Ranking -> Pagination 10 properti."))
add(paragraph("Komparasi: Pilih 2-3 properti sejenis -> Validasi tipe dan penawaran -> Bobot baku per tipe -> SAW -> Ranking komparasi."))

# Recommendation flow
add(paragraph("3. Menu Rekomendasi Properti", style="Heading1"))
add(paragraph("3.1 Tujuan", style="Heading2"))
add(paragraph(
    "Menu rekomendasi menghasilkan ranking personal. Properti yang dianggap paling sesuai untuk satu pengguna "
    "belum tentu menjadi pilihan pertama bagi pengguna lain karena bobot kriterianya dapat berbeda."
))
add(paragraph("3.2 Filter sebelum perhitungan", style="Heading2"))
add(bullet("Default pilihan adalah tipe rumah dengan penawaran dijual."))
add(bullet("Pengguna harus memilih satu tipe properti: rumah, villa, ruko, kos, atau tanah."))
add(bullet("Pengguna harus memilih satu jenis penawaran: jual atau sewa."))
add(bullet("Kos hanya dapat dinilai sebagai properti sewa."))
add(bullet("Hanya properti published dan terverifikasi yang masuk sebagai kandidat."))
add(bullet("Filter ini mencegah perbandingan tidak sepadan, misalnya harga kos bulanan dibandingkan langsung dengan harga rumah dijual."))

add(paragraph("3.3 Kriteria penilaian", style="Heading2"))
add(table(
    ["Kriteria", "Sifat", "Interpretasi skor tinggi"],
    [
        ["Harga", "Cost", "Harga lebih terjangkau pada rentang acuan tipe tersebut"],
        ["Lokasi", "Benefit", "Jarak lebih dekat ke pusat Jember"],
        ["Luas", "Benefit", "Nilai luas komposit lebih besar sesuai tipe properti"],
        ["Fasilitas", "Benefit", "Fasilitas lebih lengkap sesuai karakter tipe properti"],
    ],
    [1800, 1300, 5400],
))

# AHP
add(paragraph("4. AHP untuk Bobot Preferensi Rekomendasi", style="Heading1"))
add(paragraph("4.1 Fungsi AHP", style="Heading2"))
add(paragraph(
    "Analytical Hierarchy Process (AHP) digunakan untuk mengubah jawaban perbandingan berpasangan "
    "menjadi bobot prioritas. Empat kriteria menghasilkan enam pertanyaan."
))
add(table(
    ["No.", "Perbandingan"],
    [
        ["1", "Harga dibandingkan Lokasi"],
        ["2", "Harga dibandingkan Luas"],
        ["3", "Harga dibandingkan Fasilitas"],
        ["4", "Lokasi dibandingkan Luas"],
        ["5", "Lokasi dibandingkan Fasilitas"],
        ["6", "Luas dibandingkan Fasilitas"],
    ],
    [900, 7200],
))
add(paragraph(""))
add(paragraph("Skala input:", style="Heading2"))
add(table(
    ["Nilai", "Makna"],
    [
        ["1", "Kedua kriteria sama penting"],
        ["2 sampai 9", "Kriteria pada sisi yang dipilih semakin lebih penting"],
        ["1/2 sampai 1/9", "Kriteria lawan lebih penting"],
    ],
    [1700, 6400],
))

add(paragraph("4.2 Contoh hitung manual AHP", style="Heading2"))
add(paragraph(
    "Simulasi: pengguna sangat memprioritaskan harga, kemudian lokasi. Luas dan fasilitas dianggap sama penting. "
    "Nilai perbandingan sengaja dibuat konsisten agar proses manual mudah diverifikasi."
))
add(table(
    ["Pasangan", "Nilai", "Penjelasan"],
    [
        ["Harga : Lokasi", "2", "Harga 2x lebih penting daripada lokasi"],
        ["Harga : Luas", "4", "Harga 4x lebih penting daripada luas"],
        ["Harga : Fasilitas", "4", "Harga 4x lebih penting daripada fasilitas"],
        ["Lokasi : Luas", "2", "Lokasi 2x lebih penting daripada luas"],
        ["Lokasi : Fasilitas", "2", "Lokasi 2x lebih penting daripada fasilitas"],
        ["Luas : Fasilitas", "1", "Keduanya sama penting"],
    ],
    [2100, 900, 5100],
))
add(paragraph(""))
add(paragraph("Matriks perbandingan berpasangan:", bold=True))
add(table(
    ["Kriteria", "Harga", "Lokasi", "Luas", "Fasilitas"],
    [
        ["Harga", "1", "2", "4", "4"],
        ["Lokasi", "1/2", "1", "2", "2"],
        ["Luas", "1/4", "1/2", "1", "1"],
        ["Fasilitas", "1/4", "1/2", "1", "1"],
        ["Jumlah kolom", "2", "4", "8", "8"],
    ],
    [1800, 1500, 1500, 1500, 1500],
))
add(paragraph(""))
add(paragraph("Normalisasi matriks dilakukan dengan membagi setiap nilai dengan jumlah kolomnya:", bold=True))
add(table(
    ["Kriteria", "Harga", "Lokasi", "Luas", "Fasilitas", "Rata-rata baris"],
    [
        ["Harga", "1 / 2 = 0,500", "2 / 4 = 0,500", "4 / 8 = 0,500", "4 / 8 = 0,500", "0,500"],
        ["Lokasi", "0,5 / 2 = 0,250", "1 / 4 = 0,250", "2 / 8 = 0,250", "2 / 8 = 0,250", "0,250"],
        ["Luas", "0,25 / 2 = 0,125", "0,5 / 4 = 0,125", "1 / 8 = 0,125", "1 / 8 = 0,125", "0,125"],
        ["Fasilitas", "0,25 / 2 = 0,125", "0,5 / 4 = 0,125", "1 / 8 = 0,125", "1 / 8 = 0,125", "0,125"],
    ],
    [1300, 1600, 1600, 1500, 1500, 1300],
))
add(paragraph(""))
add(paragraph("Bobot AHP teoritis:", bold=True))
add(paragraph("Harga = 50%; Lokasi = 25%; Luas = 12,5%; Fasilitas = 12,5%."))
add(paragraph(
    "Pada frontend, bobot dibulatkan agar total tepat 100%. Untuk contoh ini bobot request menjadi: "
    "Harga 50%, Lokasi 25%, Luas 13%, dan Fasilitas 12%."
))

add(paragraph("4.3 Uji konsistensi AHP", style="Heading2"))
add(paragraph("Rumus yang digunakan:"))
add(paragraph("CI = (lambda maks - n) / (n - 1)"))
add(paragraph("CR = CI / RI"))
add(paragraph("Untuk empat kriteria: n = 4 dan RI = 0,90."))
add(paragraph("Pada contoh konsisten di atas: lambda maks = 4."))
add(paragraph("CI = (4 - 4) / (4 - 1) = 0"))
add(paragraph("CR = 0 / 0,90 = 0%"))
add(paragraph(
    "Karena CR <= 10%, preferensi boleh diterapkan. Jika CR > 10%, aplikasi memberi peringatan "
    "dan tombol Terapkan Preferensi dinonaktifkan."
))

# SAW shared
add(paragraph("5. Mesin SAW Bersama", style="Heading1"))
add(paragraph("5.1 Normalisasi nilai", style="Heading2"))
add(paragraph(
    "Simple Additive Weighting (SAW) mengubah setiap kriteria menjadi skala 0 sampai 1. "
    "Nilai yang mendekati 1 lebih baik. Rentang acuan dibuat tetap agar penambahan satu properti ekstrem "
    "tidak mengubah skor properti lain."
))
add(paragraph("Normalisasi umum = clamp((nilai - minimum) / (maksimum - minimum), 0, 1)"))
add(paragraph("Skor harga = 1 - normalisasi harga, karena harga adalah kriteria cost."))
add(paragraph("Skor lokasi = 1 - clamp(jarak dari pusat Jember / 30 km, 0, 1)."))
add(paragraph("Skor luas = normalisasi nilai luas komposit."))
add(paragraph("Skor fasilitas = nilai fasilitas pada skala 0 sampai 1."))
add(paragraph(""))
add(paragraph("Rumus agregasi:", bold=True))
add(paragraph("Skor mentah = (harga x bobot harga) + (lokasi x bobot lokasi) + (luas x bobot luas) + (fasilitas x bobot fasilitas)"))
add(paragraph("Skor akhir = maks(0, skor mentah - penalti kelengkapan data)"))

add(paragraph("5.2 Rentang acuan tetap", style="Heading2"))
add(table(
    ["Tipe", "Penawaran", "Rentang harga", "Rentang luas komposit"],
    [
        ["Rumah", "Jual", "Rp100 juta - Rp5 miliar", "20 - 1.000"],
        ["Rumah", "Sewa", "Rp500 ribu - Rp20 juta/bulan", "20 - 1.000"],
        ["Villa", "Jual", "Rp250 juta - Rp10 miliar", "20 - 1.500"],
        ["Villa", "Sewa", "Rp1 juta - Rp50 juta/bulan", "20 - 1.500"],
        ["Ruko", "Jual", "Rp100 juta - Rp5 miliar", "10 - 1.500"],
        ["Ruko", "Sewa", "Rp1 juta - Rp50 juta/bulan", "10 - 1.500"],
        ["Kos", "Sewa", "Rp250 ribu - Rp5 juta/bulan", "1 - 30"],
        ["Tanah", "Jual", "Rp50 juta - Rp5 miliar", "20 - 50.000"],
        ["Tanah", "Sewa", "Rp500 ribu - Rp30 juta/bulan", "20 - 50.000"],
    ],
    [1400, 1300, 3100, 2200],
))

add(paragraph("5.3 Konversi harga sewa", style="Heading2"))
add(paragraph("Seluruh harga sewa diubah menjadi ekuivalen bulanan sebelum dibandingkan:"))
add(table(
    ["Periode input", "Konversi ke harga bulanan"],
    [
        ["Hari", "Harga x 30"],
        ["Minggu", "Harga x 4,345"],
        ["Bulan", "Harga"],
        ["3 bulan", "Harga / 3"],
        ["6 bulan", "Harga / 6"],
        ["Tahun", "Harga / 12"],
    ],
    [2300, 5000],
))

add(paragraph("5.4 Perhitungan luas komposit", style="Heading2"))
add(table(
    ["Tipe", "Rumus luas komposit"],
    [
        ["Rumah", "(60% x luas bangunan) + (40% x luas tanah)"],
        ["Villa", "(60% x luas bangunan) + (40% x luas tanah)"],
        ["Ruko", "(50% x luas bangunan) + (30% x luas tanah) + (20% x (lebar depan + luas gudang))"],
        ["Kos", "(70% x luas kamar) + (30% x total kamar)"],
        ["Tanah", "100% x luas tanah"],
    ],
    [1600, 6500],
))

add(paragraph("5.5 Ringkasan fasilitas per tipe", style="Heading2"))
add(table(
    ["Tipe", "Komponen fasilitas"],
    [
        ["Rumah", "45% kelengkapan ruang + 55% fasilitas tambahan, listrik, dan air"],
        ["Villa", "40% kelengkapan ruang + 60% fasilitas villa seperti kolam, furnished, wisata, view, dan taman"],
        ["Kos", "40% kelengkapan kamar + 60% WiFi, listrik, air, dapur, parkir, dan CCTV"],
        ["Ruko", "40% kebutuhan bisnis + 60% utilitas listrik dan air"],
        ["Tanah", "Akses jalan, zoning, jenis tanah, dan kontur"],
    ],
    [1600, 6500],
))

add(paragraph("5.6 Penalti data belum lengkap", style="Heading2"))
add(paragraph(
    "Properti tidak langsung dikeluarkan ketika sebagian datanya belum lengkap. Sistem mengurangi skor sebesar "
    "5% untuk setiap field penting yang kosong, dengan batas maksimum pengurangan 30%."
))
add(paragraph("Contoh: skor mentah 0,70 dan terdapat dua field wajib kosong. Penalti = 2 x 0,05 = 0,10. Skor akhir = 0,70 - 0,10 = 0,60 atau 60%."))

# Manual recommendation
add(paragraph("6. Contoh Manual SAW pada Rekomendasi", style="Heading1"))
add(paragraph(
    "Simulasi berikut menggunakan Rumah A dengan penawaran dijual. Bobot berasal dari contoh AHP sebelumnya: "
    "Harga 50%, Lokasi 25%, Luas 13%, dan Fasilitas 12%."
))
add(table(
    ["Data Rumah A", "Nilai"],
    [
        ["Harga", "Rp1.500.000.000"],
        ["Jarak dari pusat Jember", "5 km"],
        ["Luas bangunan", "100 m2"],
        ["Luas tanah", "171 m2"],
        ["Skor fasilitas hasil evaluasi atribut rumah", "0,45655"],
        ["Data wajib kosong", "Tidak ada"],
    ],
    [3500, 4300],
))
add(paragraph(""))
add(paragraph("Langkah 1 - Skor harga", bold=True))
add(paragraph("Skor harga = 1 - ((1.500.000.000 - 100.000.000) / (5.000.000.000 - 100.000.000))"))
add(paragraph("Skor harga = 1 - (1.400.000.000 / 4.900.000.000) = 0,714286"))
add(paragraph("Langkah 2 - Skor lokasi", bold=True))
add(paragraph("Skor lokasi = 1 - (5 / 30) = 0,833333"))
add(paragraph("Langkah 3 - Nilai dan skor luas", bold=True))
add(paragraph("Luas komposit rumah = (60% x 100) + (40% x 171) = 60 + 68,4 = 128,4"))
add(paragraph("Skor luas = (128,4 - 20) / (1.000 - 20) = 108,4 / 980 = 0,110612"))
add(paragraph("Langkah 4 - Skor fasilitas", bold=True))
add(paragraph("Skor fasilitas = 0,45655"))
add(paragraph("Langkah 5 - Agregasi SAW rekomendasi", bold=True))
add(paragraph(
    "Skor mentah = (0,714286 x 0,50) + (0,833333 x 0,25) + "
    "(0,110612 x 0,13) + (0,45655 x 0,12)"
))
add(paragraph("Skor mentah = 0,357143 + 0,208333 + 0,014380 + 0,054786 = 0,634642"))
add(paragraph("Karena tidak ada data wajib kosong, penalti = 0."))
add(paragraph("Skor akhir = 0,634642 - 0 = 0,634642"))
add(paragraph("Tampilan pada kartu = pembulatan(0,634642 x 100) = Kecocokan 63%", bold=True, color="0B4F9C"))
add(paragraph(""))
add(paragraph(
    "Jika bobot AHP pengguna berubah, skor dan ranking Rumah A juga dapat berubah. Inilah alasan menu rekomendasi "
    "bersifat personal."
))

# Comparison
add(paragraph("7. Menu Komparasi Properti", style="Heading1"))
add(paragraph("7.1 Tujuan dan aturan", style="Heading2"))
add(paragraph(
    "Komparasi digunakan ketika pengguna ingin melihat penilaian terstruktur terhadap dua sampai tiga properti. "
    "Tidak ada pertanyaan AHP pada menu ini karena hasil komparasi dirancang sebagai baseline objektif aplikasi."
))
add(bullet("Jumlah properti yang dibandingkan harus dua sampai tiga."))
add(bullet("Seluruh properti harus memiliki tipe yang sama."))
add(bullet("Seluruh properti harus memiliki jenis penawaran yang sama."))
add(bullet("Properti harus published dan terverifikasi."))
add(bullet("Kos hanya dapat dibandingkan dalam penawaran sewa."))

add(paragraph("7.2 Profil bobot baku komparasi", style="Heading2"))
add(table(
    ["Tipe", "Harga", "Lokasi", "Luas", "Fasilitas"],
    [
        ["Rumah", "30%", "25%", "25%", "20%"],
        ["Villa", "25%", "25%", "20%", "30%"],
        ["Kos", "30%", "30%", "15%", "25%"],
        ["Ruko", "30%", "30%", "25%", "15%"],
        ["Tanah", "30%", "30%", "30%", "10%"],
    ],
    [1700, 1400, 1400, 1400, 1600],
))
add(paragraph(
    "Profil tidak dibuat sama rata 25% untuk seluruh tipe karena karakteristik kebutuhan rumah, villa, kos, "
    "ruko, dan tanah berbeda. Contohnya, fasilitas villa diberi bobot lebih tinggi, sedangkan luas tanah diberi "
    "bobot lebih tinggi pada komparasi tanah."
))

add(paragraph("7.3 Contoh manual SAW pada komparasi", style="Heading2"))
add(paragraph(
    "Gunakan Rumah A yang sama. Mesin normalisasi tetap sama, tetapi bobot berasal dari profil komparasi rumah: "
    "Harga 30%, Lokasi 25%, Luas 25%, dan Fasilitas 20%."
))
add(paragraph(
    "Skor komparasi = (0,714286 x 0,30) + (0,833333 x 0,25) + "
    "(0,110612 x 0,25) + (0,45655 x 0,20)"
))
add(paragraph("Skor komparasi = 0,214286 + 0,208333 + 0,027653 + 0,091310 = 0,541582"))
add(paragraph("Tidak ada penalti data. Skor akhir = 0,541582 atau 54%.", bold=True, color="0B4F9C"))
add(paragraph(""))
add(paragraph(
    "Nilai komparasi Rumah A berbeda dari nilai rekomendasi walaupun properti dan mesin SAW sama. "
    "Perbedaannya berasal dari sumber bobot: rekomendasi memakai preferensi personal, sedangkan komparasi "
    "memakai profil baku rumah."
))

# Comparative example two alternatives
add(paragraph("8. Contoh Ranking Dua Properti", style="Heading1"))
add(paragraph(
    "Bagian ini memperlihatkan bagaimana skor dipakai untuk menentukan urutan. Nilai pada tabel adalah simulasi "
    "setelah normalisasi masing-masing kriteria."
))
add(table(
    ["Properti", "Harga", "Lokasi", "Luas", "Fasilitas"],
    [
        ["Rumah A", "0,714286", "0,833333", "0,110612", "0,456550"],
        ["Rumah B", "0,775510", "0,666667", "0,083673", "0,650000"],
    ],
    [1800, 1600, 1600, 1600, 1700],
))
add(paragraph(""))
add(paragraph("Ranking rekomendasi dengan bobot personal 50%, 25%, 13%, 12%:", bold=True))
add(table(
    ["Properti", "Perhitungan ringkas", "Skor akhir", "Ranking"],
    [
        ["Rumah A", "(0,714286x0,50)+(0,833333x0,25)+(0,110612x0,13)+(0,456550x0,12)", "0,634642 = 63%", "2"],
        ["Rumah B", "(0,775510x0,50)+(0,666667x0,25)+(0,083673x0,13)+(0,650000x0,12)", "0,643299 = 64%", "1"],
    ],
    [1400, 5200, 1700, 900],
))
add(paragraph(""))
add(paragraph("Ranking komparasi rumah dengan bobot baku 30%, 25%, 25%, 20%:", bold=True))
add(table(
    ["Properti", "Perhitungan ringkas", "Skor akhir", "Ranking"],
    [
        ["Rumah A", "(0,714286x0,30)+(0,833333x0,25)+(0,110612x0,25)+(0,456550x0,20)", "0,541582 = 54%", "2"],
        ["Rumah B", "(0,775510x0,30)+(0,666667x0,25)+(0,083673x0,25)+(0,650000x0,20)", "0,550238 = 55%", "1"],
    ],
    [1400, 5200, 1700, 900],
))
add(paragraph(
    "Pada dataset nyata, seluruh kandidat dihitung dengan pola yang sama kemudian diurutkan dari skor tertinggi "
    "ke terendah. Menu rekomendasi menampilkan maksimal 10 properti per halaman."
))

# Interpretation
add(paragraph("9. Cara Membaca Hasil", style="Heading1"))
add(table(
    ["Tampilan", "Arti yang tepat"],
    [
        ["Kecocokan 62%", "Skor SAW rekomendasi sekitar 0,62 setelah bobot preferensi dan penalti diterapkan."],
        ["Ranking #1", "Properti memiliki skor tertinggi di antara kandidat yang lolos filter pada perhitungan tersebut."],
        ["Data belum lengkap: -10%", "Ada dua field penting kosong sehingga skor dikurangi 2 x 5%."],
        ["Skor komparasi 54%", "Skor SAW dengan profil bobot baku tipe properti, bukan bobot personal pengguna."],
    ],
    [2400, 6000],
))
add(paragraph(""))
add(paragraph("Catatan penting:", style="Heading2"))
add(bullet("Persentase kecocokan bukan klaim probabilitas bahwa pengguna pasti membeli properti tersebut."))
add(bullet("SAW membantu pengambilan keputusan secara terukur dan konsisten berdasarkan data yang tersedia."))
add(bullet("Kualitas hasil tetap dipengaruhi oleh kelengkapan dan kebenaran data properti."))
add(bullet("Rentang acuan tetap membuat skor lebih stabil ketika ada properti baru dengan nilai ekstrem."))

# Presentation outline
add(paragraph("10. Narasi Singkat untuk Presentasi", style="Heading1"))
add(paragraph("Urutan penjelasan yang disarankan:", style="Heading2"))
add(numbered(1, "Aplikasi memiliki dua fitur: rekomendasi personal dan komparasi objektif terstruktur."))
add(numbered(2, "Pada rekomendasi, pengguna memilih tipe dan penawaran terlebih dahulu agar kandidat yang dibandingkan sepadan."))
add(numbered(3, "Pengguna menjawab enam pertanyaan AHP untuk menentukan prioritas harga, lokasi, luas, dan fasilitas."))
add(numbered(4, "Sistem menguji konsistensi jawaban. Jika rasio konsistensi lebih dari 10%, preferensi belum boleh diterapkan."))
add(numbered(5, "Bobot yang lolos digunakan oleh SAW untuk menghitung skor seluruh kandidat."))
add(numbered(6, "Skor SAW dikurangi penalti jika data penting belum lengkap, kemudian dipakai untuk menentukan ranking."))
add(numbered(7, "Pada komparasi, proses AHP tidak digunakan. Sistem memakai profil bobot baku sesuai tipe properti agar hasil mudah dipahami sebagai baseline objektif aplikasi."))
add(numbered(8, "Kedua menu menggunakan mesin SAW yang sama sehingga normalisasi harga, lokasi, luas, fasilitas, sewa, dan penalti tetap konsisten."))

add(paragraph("11. Pemetaan File Implementasi", style="Heading1"))
add(table(
    ["File", "Fungsi"],
    [
        ["Client/components/otherPages/rekomendasi/RekomendasiProperti.jsx", "Form AHP, matriks perbandingan, uji konsistensi, pengiriman bobot, dan pagination rekomendasi."],
        ["Client/components/properties/PropertyListItems.jsx", "Menampilkan persentase kecocokan rekomendasi pada kartu list."],
        ["Client/components/properties/PropertyGridItems.jsx", "Menampilkan persentase kecocokan rekomendasi pada kartu grid."],
        ["Client/components/compare/Compare.jsx", "Menampilkan hasil komparasi dari backend."],
        ["Server/app/Services/Property/PropertyScoringService.php", "Mesin SAW bersama."],
        ["Server/app/Services/Property/PropertyRecommendationService.php", "Alur rekomendasi personal."],
        ["Server/app/Services/Property/PropertyComparisonService.php", "Alur komparasi dengan bobot baku per tipe."],
        ["Server/app/Http/Controllers/Api/PropertyController.php", "Endpoint API rekomendasi dan komparasi."],
    ],
    [4100, 4300],
))

add(paragraph("12. Kesimpulan", style="Heading1"))
add(paragraph(
    "Desain sistem memisahkan proses penentuan bobot dan proses perhitungan skor. AHP dipakai hanya pada "
    "rekomendasi karena fitur tersebut perlu menangkap preferensi personal pengguna. SAW dipakai sebagai mesin "
    "skoring bersama agar evaluasi properti terukur dan konsisten. Komparasi memakai profil bobot baku per tipe "
    "agar hasilnya memiliki dasar yang stabil dan mudah dijelaskan."
))
add(paragraph(""))
add(paragraph("Dokumen selesai.", italic=True, align="center", color="666666"))


document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {''.join(body)}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
      <w:headerReference w:type="default" r:id="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
      <w:footerReference w:type="default" r:id="rId3" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
    </w:sectPr>
  </w:body>
</w:document>
'''

styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
    <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:pPr><w:spacing w:before="300" w:after="140"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="0B4F9C"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:pPr><w:spacing w:before="220" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="25"/><w:szCs w:val="25"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="360"/><w:spacing w:after="80"/></w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>
    </w:tblBorders><w:tblCellMar>
      <w:top w:w="80" w:type="dxa"/><w:left w:w="100" w:type="dxa"/>
      <w:bottom w:w="80" w:type="dxa"/><w:right w:w="100" w:type="dxa"/>
    </w:tblCellMar></w:tblPr>
  </w:style>
</w:styles>
'''

content_types_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
'''

package_rels_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
'''

document_rels_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>
'''

header_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>Diproperti | Rekomendasi dan Komparasi</w:t></w:r></w:p>
</w:hdr>
'''

footer_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>Halaman </w:t></w:r>
    <w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
  </w:p>
</w:ftr>
'''

core_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Penjelasan Sistem Rekomendasi dan Komparasi Properti</dc:title>
  <dc:subject>AHP dan SAW pada aplikasi Diproperti</dc:subject>
  <dc:creator>Diproperti</dc:creator>
  <cp:keywords>AHP; SAW; rekomendasi; komparasi; properti</cp:keywords>
  <dc:description>Dokumen pendukung presentasi perhitungan rekomendasi dan komparasi properti.</dc:description>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-02T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-02T00:00:00Z</dcterms:modified>
</cp:coreProperties>
'''

app_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
  <AppVersion>16.0000</AppVersion>
</Properties>
'''

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as docx:
    docx.writestr("[Content_Types].xml", content_types_xml)
    docx.writestr("_rels/.rels", package_rels_xml)
    docx.writestr("word/document.xml", document_xml)
    docx.writestr("word/styles.xml", styles_xml)
    docx.writestr("word/_rels/document.xml.rels", document_rels_xml)
    docx.writestr("word/header1.xml", header_xml)
    docx.writestr("word/footer1.xml", footer_xml)
    docx.writestr("docProps/core.xml", core_xml)
    docx.writestr("docProps/app.xml", app_xml)

print(f"Created: {OUTPUT}")

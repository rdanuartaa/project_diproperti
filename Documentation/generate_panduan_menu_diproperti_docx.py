from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT = Path(__file__).with_name("Panduan_Lengkap_Menu_Aplikasi_Diproperti.docx")


def tx(value):
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
    rp = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    return f'<w:r>{rp}<w:t xml:space="preserve">{tx(text)}</w:t></w:r>'


def p(text="", style=None, bold=False, italic=False, align=None, size=None, color=None):
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        props.append(f'<w:jc w:val="{align}"/>')
    pp = f"<w:pPr>{''.join(props)}</w:pPr>" if props else ""
    return f"<w:p>{pp}{run(text, bold, italic, size, color)}</w:p>"


def bullet(text):
    return p(f"- {text}", style="ListParagraph")


def numbered(number, text):
    return p(f"{number}. {text}", style="ListParagraph")


def cell(value, header=False):
    shade = '<w:shd w:fill="D9EAF7"/>' if header else ""
    return f"<w:tc><w:tcPr>{shade}</w:tcPr>{p(value, bold=header)}</w:tc>"


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
    head = "<w:tr>" + "".join(cell(item, True) for item in headers) + "</w:tr>"
    rows_xml = "".join("<w:tr>" + "".join(cell(item) for item in row) + "</w:tr>" for row in rows)
    return f"<w:tbl>{props}<w:tblGrid>{grid}</w:tblGrid>{head}{rows_xml}</w:tbl>"


def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


body = []
add = body.append

add(p("PANDUAN LENGKAP MENU APLIKASI DIPROPERTI", bold=True, align="center", size=36, color="0B4F9C"))
add(p("Tampilan Utama, Pengguna Login, dan Dashboard Admin", bold=True, align="center", size=27))
add(p(""))
add(p("Dokumen Penjelasan Fitur dan Alur Penggunaan", align="center", size=23))
add(p("Disusun berdasarkan implementasi aplikasi lokal per 2 Juni 2026", italic=True, align="center"))
add(p(""))
add(p(""))
add(p("Cakupan:", bold=True, align="center"))
add(p("1. Navigasi dan hak akses aplikasi", align="center"))
add(p("2. Seluruh menu tampilan utama", align="center"))
add(p("3. Menu khusus pengguna login", align="center"))
add(p("4. Seluruh menu dashboard admin", align="center"))
add(p("5. Route halaman dan endpoint API utama", align="center"))
add(page_break())

add(p("1. Gambaran Umum Aplikasi", style="Heading1"))
add(p(
    "Diproperti adalah aplikasi properti yang membantu pengguna mencari, membandingkan, memperoleh rekomendasi, "
    "mengestimasi cicilan KPR, membaca artikel, serta mengajukan properti untuk dipasarkan. Admin memiliki area "
    "dashboard tersendiri untuk memantau statistik dan mengelola data platform."
))
add(table(
    ["Kelompok tampilan", "Pengguna", "Tujuan"],
    [
        ["Halaman utama atau publik", "Pengunjung tanpa login dan pengguna login", "Menjelajahi informasi, properti, artikel, dan fitur pendukung keputusan."],
        ["Area pengguna login", "Pengguna yang masuk melalui Google", "Mengajukan properti dan memantau status pengajuan."],
        ["Dashboard admin", "Pengguna dengan role admin", "Mengelola seluruh data dan memverifikasi pengajuan properti."],
    ],
    [2100, 2600, 4100],
))

add(p("2. Navigasi Global", style="Heading1"))
add(p(
    "Navigasi utama muncul pada header aplikasi. Header menyesuaikan kondisi autentikasi pengguna. Footer menyediakan "
    "tautan tambahan untuk fitur, bantuan, dan kanal komunikasi."
))
add(p("2.1 Header Utama", style="Heading2"))
add(table(
    ["Menu", "Route", "Fungsi"],
    [
        ["Beranda", "/", "Kembali ke halaman utama aplikasi."],
        ["Properti", "/list-properti", "Membuka katalog properti."],
        ["Fitur > Rekomendasi", "/rekomendasi-properti", "Membuka rekomendasi personal berbasis AHP dan SAW."],
        ["Fitur > Komparasi", "/komparasi", "Membandingkan dua sampai tiga properti sejenis."],
        ["Fitur > Simulasi KPR", "/simulasi-kpr", "Menghitung estimasi cicilan dengan bunga flat."],
        ["Artikel", "/list-artikel", "Membaca artikel informasi properti."],
        ["Jual Properti", "/jual-properti", "Mengajukan properti untuk diverifikasi admin."],
    ],
    [2200, 2300, 4300],
))
add(p(""))
add(p("Perubahan tombol kanan header berdasarkan status pengguna:", bold=True))
add(table(
    ["Kondisi", "Tombol atau menu", "Perilaku"],
    [
        ["Belum login", "Masuk", "Mengarah ke autentikasi Google."],
        ["Belum login", "Hubungi Admin", "Membuka WhatsApp admin."],
        ["Pengguna login", "Avatar pengguna", "Menampilkan nama, email, dan tombol logout."],
        ["Pengguna login", "Jual Properti", "Membuka form pengajuan properti."],
        ["Admin login", "Kelola Properti", "Membuka dashboard kelola properti."],
    ],
    [1900, 2300, 4400],
))
add(p(""))
add(p(
    "Jika pengunjung belum login menekan menu Jual Properti, aplikasi menampilkan peringatan lalu mengarahkan proses "
    "login Google. Setelah logout, pengguna diarahkan kembali ke halaman beranda."
))
add(p("2.2 Footer", style="Heading2"))
add(p("Footer menyediakan tautan pintas:"))
add(bullet("Menu utama: Beranda, Properti, Artikel, dan Jual Properti."))
add(bullet("Fitur: Properti Terpopuler, Rekomendasi, Komparasi, Hitung KPR, dan Jual Properti."))
add(bullet("Bantuan: FAQ, Kontak, dan Artikel."))
add(bullet("Kanal komunikasi: WhatsApp, Instagram, dan TikTok."))

add(p("3. Menu Beranda", style="Heading1"))
add(p("Route: /", bold=True))
add(p(
    "Beranda merupakan halaman awal yang memperkenalkan layanan Diproperti dan memberi jalur cepat menuju fitur utama."
))
add(table(
    ["Bagian", "Isi dan fungsi"],
    [
        ["Hero dan pencarian", "Menampilkan pesan utama serta pencarian berdasarkan kata kunci dan jenis penawaran jual atau sewa. Hasil diarahkan ke daftar properti."],
        ["Tipe Properti", "Memperkenalkan kategori properti yang tersedia seperti rumah, villa, ruko, kos, dan tanah."],
        ["Fitur Unggulan", "Memberi pintasan ke daftar properti, komparasi, simulasi KPR, dan rekomendasi pintar."],
        ["Properti Terpopuler", "Menampilkan properti populer yang dapat dibuka detailnya atau dimasukkan ke komparasi."],
        ["Solusi Jual dan Beli", "Menjelaskan manfaat layanan properti secara ringkas."],
        ["Artikel Terbaru", "Menampilkan tiga artikel terbaru dan tautan menuju detail artikel."],
        ["Banner Jual Properti", "Mengajak pemilik properti mengirim pengajuan pemasaran."],
    ],
    [2400, 6200],
))
add(p(""))
add(p("Alur penggunaan umum dari beranda:", bold=True))
add(numbered(1, "Pengunjung memasukkan kata kunci atau memilih penawaran."))
add(numbered(2, "Aplikasi membuka daftar properti dengan filter terkait."))
add(numbered(3, "Pengunjung dapat melihat detail, menambahkan komparasi, atau memakai rekomendasi pintar."))

add(p("4. Menu Properti", style="Heading1"))
add(p("Route daftar: /list-properti", bold=True))
add(p(
    "Halaman daftar properti adalah katalog utama. Sistem hanya mengambil properti yang relevan dengan filter aktif "
    "dan menampilkan pagination agar daftar tetap mudah dibaca."
))
add(p("4.1 Daftar Properti", style="Heading2"))
add(bullet("Menyediakan tampilan daftar atau grid properti."))
add(bullet("Memuat data properti published dari endpoint GET /properties."))
add(bullet("Mendukung pencarian, tipe, penawaran, lokasi, harga, spesifikasi, fasilitas, sertifikat, serta pengurutan."))
add(bullet("Menampilkan properti unggulan atau populer pada panel pendukung."))
add(bullet("Menampilkan jumlah hasil serta pagination."))
add(bullet("Menyediakan tombol Detail dan Komparasi pada kartu properti."))
add(p(""))
add(p(
    "Ketika proses komparasi sudah dimulai, tipe dan penawaran properti dapat dikunci mengikuti properti pertama. "
    "Tujuannya mencegah rumah dijual dibandingkan dengan tanah atau properti sewa."
))

add(p("4.2 Detail Properti", style="Heading2"))
add(p("Route: /properti/{slug}", bold=True))
add(p("Halaman detail menyajikan informasi lengkap satu properti:"))
add(table(
    ["Bagian", "Informasi atau aksi"],
    [
        ["Galeri gambar", "Menampilkan foto properti."],
        ["Ringkasan properti", "Judul, harga, status penawaran, lokasi, spesifikasi utama, dan tombol komparasi."],
        ["Bagikan WhatsApp", "Membagikan tautan properti melalui WhatsApp."],
        ["Detail properti", "Menampilkan atribut sesuai tipe, termasuk sertifikat jika tersedia."],
        ["Fasilitas tambahan", "Menampilkan fasilitas yang relevan apabila tersedia."],
        ["Lokasi properti", "Menampilkan peta serta tombol Tanya Lokasi."],
        ["Kontak admin", "Mengirim pesan WhatsApp dengan detail properti otomatis terlampir."],
        ["Properti serupa", "Menampilkan rekomendasi properti lain yang relevan."],
    ],
    [2400, 6100],
))

add(p("5. Menu Rekomendasi Properti", style="Heading1"))
add(p("Route: /rekomendasi-properti", bold=True))
add(p(
    "Menu rekomendasi membantu pengguna memperoleh ranking properti yang bersifat personal. Pengguna memilih tipe "
    "dan penawaran, lalu menentukan prioritas Harga, Lokasi, Luas, dan Fasilitas melalui perbandingan AHP."
))
add(table(
    ["Bagian tampilan", "Fungsi"],
    [
        ["Filter tipe dan penawaran", "Membatasi kandidat agar properti yang dinilai sepadan. Default: rumah dijual."],
        ["Preferensi Pintar", "Menampilkan enam slider perbandingan AHP."],
        ["Rasio konsistensi", "Menilai konsistensi jawaban. Jika lebih dari 10%, tombol terapkan dinonaktifkan."],
        ["Skor Kecocokan", "Menampilkan bobot personal hasil AHP untuk Harga, Lokasi, Luas, dan Fasilitas."],
        ["Daftar ranking", "Menampilkan kartu properti berdasarkan skor SAW tertinggi."],
        ["Pagination", "Menampilkan maksimal 10 properti per halaman."],
    ],
    [2600, 5900],
))
add(p(""))
add(p("Alur proses:", bold=True))
add(numbered(1, "Pengguna memilih satu tipe dan satu jenis penawaran."))
add(numbered(2, "Pengguna mengatur enam pasangan kriteria AHP."))
add(numbered(3, "Sistem menghitung bobot dan rasio konsistensi."))
add(numbered(4, "Jika valid, backend menghitung SAW dan mengurutkan kandidat."))
add(numbered(5, "UI menampilkan persentase Kecocokan dan ranking."))
add(p(""))
add(p(
    "Catatan: Kecocokan adalah skor SAW yang dikalikan 100 dan dibulatkan. Nilai tersebut bukan probabilitas "
    "bahwa pengguna pasti membeli properti."
))

add(p("6. Menu Komparasi Properti", style="Heading1"))
add(p("Route: /komparasi", bold=True))
add(p(
    "Menu komparasi membandingkan dua sampai tiga properti sejenis secara terstruktur. Berbeda dari rekomendasi, "
    "bobot kriterianya berasal dari profil baku sistem sesuai tipe properti."
))
add(bullet("Properti harus memiliki tipe dan jenis penawaran yang sama."))
add(bullet("Pengguna dapat menambahkan properti dari kartu daftar, beranda, properti serupa, atau halaman detail."))
add(bullet("Halaman menampilkan profil bobot komparasi aktif. Contoh rumah: Harga 30%, Lokasi 25%, Luas 25%, Fasilitas 20%."))
add(bullet("Tabel membandingkan skor, tipe, penawaran, harga, lokasi, luas, kamar, fasilitas, dan detail relevan lainnya."))
add(bullet("Nilai terbaik diberi penanda agar pengguna lebih mudah membaca perbedaan."))
add(bullet("Bagian penjelasan menampilkan ringkasan kelebihan dan kekurangan setiap alternatif."))
add(bullet("Tombol reset menghapus seluruh pilihan komparasi."))
add(p(""))
add(p("Perbedaan rekomendasi dan komparasi:", bold=True))
add(table(
    ["Aspek", "Rekomendasi", "Komparasi"],
    [
        ["Tujuan", "Ranking personal", "Perbandingan alternatif sejenis"],
        ["Sumber bobot", "Preferensi pengguna melalui AHP", "Profil baku sistem per tipe"],
        ["Mesin skor", "SAW", "SAW"],
        ["Jumlah properti", "Seluruh kandidat lolos filter", "Dua sampai tiga properti pilihan"],
    ],
    [1900, 3400, 3400],
))

add(p("7. Menu Simulasi KPR", style="Heading1"))
add(p("Route: /simulasi-kpr", bold=True))
add(p(
    "Simulasi KPR membantu pengguna memperkirakan cicilan pembelian properti dengan metode bunga flat. Halaman "
    "menampilkan penjelasan singkat, tahapan perhitungan, kalkulator, serta hasil estimasi."
))
add(table(
    ["Input", "Fungsi"],
    [
        ["Harga Properti", "Nilai jual properti yang akan dibiayai."],
        ["Uang Muka", "Pembayaran awal atau DP."],
        ["Bunga Flat", "Persentase bunga tahunan."],
        ["Tenor", "Durasi cicilan dari 12 sampai 240 bulan."],
    ],
    [2400, 5900],
))
add(p(""))
add(p("Hasil kalkulator:", bold=True))
add(bullet("Pokok pinjaman setelah dikurangi uang muka."))
add(bullet("Persentase uang muka."))
add(bullet("Bunga per bulan."))
add(bullet("Estimasi angsuran per bulan."))
add(bullet("Total pembayaran dan total bunga."))
add(p(""))
add(p(
    "Batasan: hasil merupakan estimasi bunga flat. Perhitungan resmi bank dapat memakai metode anuitas atau efektif "
    "serta memasukkan provisi, asuransi, biaya administrasi, dan biaya lainnya."
))

add(p("8. Menu Artikel", style="Heading1"))
add(p("Route daftar: /list-artikel", bold=True))
add(p(
    "Menu artikel menyediakan informasi properti, panduan jual beli, rekomendasi, KPR, dan topik terkait lainnya."
))
add(p("8.1 Daftar Artikel", style="Heading2"))
add(bullet("Memuat artikel melalui endpoint GET /articles."))
add(bullet("Menyediakan pencarian berdasarkan kata kunci."))
add(bullet("Menyediakan tag artikel yang digunakan serta artikel populer."))
add(bullet("Mendukung pagination daftar artikel."))
add(p("8.2 Detail Artikel", style="Heading2"))
add(p("Route: /artikel/{slug}", bold=True))
add(bullet("Menampilkan judul, metadata, gambar, dan isi artikel."))
add(bullet("Menyediakan tombol berbagi ke WhatsApp, Twitter, Facebook, dan TikTok."))
add(bullet("Menampilkan maksimal tiga artikel terpopuler berdasarkan kunjungan tertinggi."))
add(bullet("Menampilkan tag yang benar-benar digunakan oleh artikel."))
add(bullet("Menampilkan artikel serupa pada bagian bawah halaman."))

add(p("9. Menu Jual Properti", style="Heading1"))
add(p("Route: /jual-properti", bold=True))
add(p(
    "Menu jual properti ditujukan untuk pengguna login yang ingin mengajukan iklan properti. Properti belum langsung "
    "tayang karena admin harus memverifikasi pengajuan terlebih dahulu."
))
add(p("9.1 Informasi Awal", style="Heading2"))
add(bullet("Iklan properti dinyatakan gratis."))
add(bullet("Komisi 2,5% dikenakan jika properti berhasil terjual atau disewa."))
add(bullet("Pengguna dapat membuka Tracking Pengajuan Saya."))
add(p("9.2 Data yang Dilengkapi", style="Heading2"))
add(table(
    ["Bagian form", "Isi"],
    [
        ["Profil penjual", "Nama lengkap, nomor WhatsApp, dan foto KTP."],
        ["Informasi dasar", "Judul, harga, tipe, penawaran, periode sewa, kecamatan, kota, sertifikat, dan deskripsi."],
        ["Lokasi detail", "Titik lokasi pada peta dan alamat."],
        ["Detail properti", "Spesifikasi teknis berbeda sesuai rumah, villa, ruko, kos, atau tanah."],
        ["Gambar", "Minimal satu foto, maksimal sepuluh foto, serta pilihan foto utama."],
        ["Dokumen pendukung", "Sertifikat, tagihan listrik, dan tagihan air secara opsional."],
        ["Syarat dan ketentuan", "Persetujuan sebelum pengajuan dikirim."],
    ],
    [2400, 6100],
))
add(p("9.3 Tracking Pengajuan", style="Heading2"))
add(p(
    "Pengguna dapat melihat judul properti, tipe, harga, status, tanggal pengajuan, serta keterangan apakah masih "
    "ditinjau atau sudah disetujui. Admin dapat membuka halaman ini, tetapi form pengajuan dikunci pada mode admin."
))

add(p("10. Menu FAQ dan Kontak", style="Heading1"))
add(p("10.1 FAQ", style="Heading2"))
add(p("Route: /faq", bold=True))
add(p(
    "FAQ menampilkan pertanyaan dan jawaban berstatus published. Pertanyaan dikelompokkan berdasarkan topik seperti "
    "Umum, Seputar Properti, KPR dan Pembiayaan, serta Platform Diproperti."
))
add(p("10.2 Kontak Admin", style="Heading2"))
add(p("Route: /contact", bold=True))
add(p(
    "Halaman kontak memberi informasi kanal komunikasi dan form pesan. Pengunjung mengisi nama, kebutuhan seperti "
    "beli atau jual properti, serta pesan. Sistem membentuk pesan yang siap diteruskan kepada admin."
))

add(p("11. Autentikasi dan Hak Akses", style="Heading1"))
add(p(
    "Aplikasi memakai login Google. Token disimpan pada browser dan dipakai untuk meminta data pengguna melalui "
    "endpoint /me. Logout membersihkan token lokal, memanggil endpoint /logout, lalu kembali ke beranda."
))
add(table(
    ["Fitur", "Publik", "Pengguna login", "Admin"],
    [
        ["Beranda, katalog, detail, artikel", "Ya", "Ya", "Ya"],
        ["Rekomendasi, komparasi, simulasi KPR", "Ya", "Ya", "Ya"],
        ["FAQ dan kontak", "Ya", "Ya", "Ya"],
        ["Kirim pengajuan jual properti", "Tidak", "Ya", "Form dikunci"],
        ["Tracking pengajuan pribadi", "Tidak", "Ya", "Tidak diperlukan"],
        ["Dashboard admin", "Tidak", "Tidak", "Ya"],
    ],
    [2800, 1300, 1900, 1800],
))

add(p("12. Dashboard Admin", style="Heading1"))
add(p(
    "Dashboard admin berada pada area /admin dan menggunakan layout dengan header serta sidebar. Seluruh endpoint "
    "admin dilindungi autentikasi dan pemeriksaan role admin."
))

add(p("12.1 Dashboard Ringkasan", style="Heading2"))
add(p("Route: /admin/dashboard", bold=True))
add(table(
    ["Bagian", "Fungsi"],
    [
        ["Jumlah Properti", "Menampilkan total properti dan jumlah published."],
        ["Jumlah User", "Menampilkan total pengguna terdaftar."],
        ["Jumlah Artikel", "Menampilkan jumlah artikel."],
        ["Pengajuan Properti", "Menampilkan jumlah pengajuan yang perlu disetujui."],
        ["Analisis Kunjungan", "Grafik kunjungan dengan filter hari, minggu, bulan, tahun, atau rentang tanggal."],
        ["Bantuan", "Tautan menuju FAQ dan kontak."],
    ],
    [2500, 5900],
))

add(p("12.2 Kelola User", style="Heading2"))
add(p("Route: /admin/add-user", bold=True))
add(bullet("Menampilkan daftar pengguna dengan pencarian nama atau email."))
add(bullet("Menyediakan pagination berdasarkan jumlah data pengguna."))
add(bullet("Admin dapat mengubah data pengguna melalui modal edit."))
add(bullet("Admin dapat menghapus pengguna setelah konfirmasi."))

add(p("12.3 Kelola Properti", style="Heading2"))
add(p("Route: /admin/add-properti", bold=True))
add(bullet("Menampilkan properti dengan pencarian judul dan pagination."))
add(bullet("Menampilkan status properti seperti draft, published, atau sold serta jumlah kunjungan."))
add(bullet("Admin dapat menambahkan properti langsung tanpa alur pengajuan pengguna."))
add(bullet("Admin dapat mengubah informasi dasar, lokasi, spesifikasi per tipe, gambar utama, dan dokumen terkait."))
add(bullet("Admin dapat menghapus properti setelah konfirmasi."))
add(p(
    "Route /admin/my-property juga menggunakan komponen kelola properti yang sama, tetapi menu aktif utama pada "
    "sidebar adalah /admin/add-properti."
))

add(p("12.4 Pengajuan Properti", style="Heading2"))
add(p("Route: /admin/pengajuan-properti", bold=True))
add(bullet("Menampilkan pengajuan properti dari pengguna dengan pencarian dan pagination khusus pengajuan."))
add(bullet("Admin dapat membuka detail lengkap penjual, nomor WhatsApp, KTP, spesifikasi, peta, gambar, dan dokumen pendukung."))
add(bullet("Admin dapat mengunduh dokumen dan kartu identitas penjual melalui endpoint terlindungi."))
add(bullet("Admin dapat menyetujui pengajuan agar properti diverifikasi dan dipublikasikan."))
add(bullet("Admin dapat menolak atau menghapus pengajuan dengan konfirmasi."))

add(p("12.5 Kelola Artikel", style="Heading2"))
add(p("Route: /admin/add-artikel", bold=True))
add(bullet("Menampilkan daftar artikel dengan filter status dan pencarian judul."))
add(bullet("Menampilkan status draft atau published serta jumlah kunjungan."))
add(bullet("Admin dapat menambahkan judul, ringkasan, isi artikel, status, gambar, dan tag."))
add(bullet("Admin dapat mengubah atau menghapus artikel."))

add(p("12.6 Kelola Tag", style="Heading2"))
add(p("Route: /admin/add-tagartikel", bold=True))
add(bullet("Menampilkan daftar tag artikel dengan pencarian dan filter status."))
add(bullet("Admin dapat menambah dan mengubah nama tag."))
add(bullet("Admin dapat menghapus tag jika tidak sedang digunakan."))
add(bullet("Jika tag masih terhubung ke artikel, backend dapat menolak penghapusan untuk menjaga konsistensi data."))

add(p("12.7 Kelola FAQ", style="Heading2"))
add(p("Route: /admin/add-faq", bold=True))
add(bullet("Menampilkan daftar FAQ dengan pencarian pertanyaan dan filter status."))
add(bullet("Admin dapat menambahkan pertanyaan, jawaban, topik, dan status."))
add(bullet("FAQ berstatus published akan tampil pada halaman publik."))
add(bullet("Admin dapat mengubah atau menghapus FAQ."))

add(p("12.8 Logout Admin", style="Heading2"))
add(p(
    "Sidebar menyediakan tombol Logout. Setelah tombol dipilih, aplikasi menampilkan modal konfirmasi. Jika admin "
    "menyetujui logout, token dihapus dan admin diarahkan ke halaman beranda utama."
))

add(p("13. Ringkasan Route Halaman", style="Heading1"))
add(table(
    ["Kelompok", "Route", "Halaman"],
    [
        ["Publik", "/", "Beranda"],
        ["Publik", "/list-properti", "Daftar properti"],
        ["Publik", "/properti/{slug}", "Detail properti"],
        ["Publik", "/rekomendasi-properti", "Rekomendasi personal"],
        ["Publik", "/komparasi", "Komparasi properti"],
        ["Publik", "/simulasi-kpr", "Kalkulator KPR"],
        ["Publik", "/list-artikel", "Daftar artikel"],
        ["Publik", "/artikel/{slug}", "Detail artikel"],
        ["Publik", "/faq", "FAQ"],
        ["Publik", "/contact", "Kontak admin"],
        ["Login user", "/jual-properti", "Form pengajuan dan tracking"],
        ["Admin", "/admin/dashboard", "Dashboard ringkasan"],
        ["Admin", "/admin/add-user", "Kelola user"],
        ["Admin", "/admin/add-properti", "Kelola properti"],
        ["Admin", "/admin/pengajuan-properti", "Verifikasi pengajuan"],
        ["Admin", "/admin/add-artikel", "Kelola artikel"],
        ["Admin", "/admin/add-tagartikel", "Kelola tag"],
        ["Admin", "/admin/add-faq", "Kelola FAQ"],
    ],
    [1400, 2800, 4100],
))

add(p("14. Endpoint API Utama", style="Heading1"))
add(table(
    ["Kelompok", "Endpoint", "Fungsi"],
    [
        ["Publik", "GET /properties", "Daftar properti."],
        ["Publik", "GET /properties/{slug}", "Detail properti."],
        ["Publik", "GET /properties/recommendations", "Ranking rekomendasi."],
        ["Publik", "GET /properties/comparisons", "Skor komparasi."],
        ["Publik", "GET /articles dan /articles/{slug}", "Daftar dan detail artikel."],
        ["Publik", "GET /articles/popular", "Artikel populer."],
        ["Publik", "GET /tags dan /faqs", "Tag dan FAQ."],
        ["Login", "POST /properties/submit", "Mengirim pengajuan properti."],
        ["Login", "GET /properties/my-submissions", "Tracking pengajuan pribadi."],
        ["Admin", "GET /admin/dashboard/stats", "Statistik dashboard."],
        ["Admin", "GET /admin/dashboard/analytics", "Data grafik kunjungan."],
        ["Admin", "/admin/users", "CRUD user."],
        ["Admin", "/admin/properties", "CRUD properti."],
        ["Admin", "/admin/property-submissions", "Verifikasi pengajuan."],
        ["Admin", "/admin/articles", "CRUD artikel."],
        ["Admin", "/admin/tags", "CRUD tag."],
        ["Admin", "/admin/faqs", "CRUD FAQ."],
    ],
    [1400, 3300, 3600],
))

add(p("15. Pemetaan File Utama", style="Heading1"))
add(table(
    ["Area", "File utama"],
    [
        ["Navigasi publik", "Client/components/headers/Nav.jsx dan Header1.jsx atau Header2.jsx"],
        ["Beranda", "Client/app/HomeClient.jsx dan Client/components/homes/home-2/*"],
        ["Daftar properti", "Client/components/properties/Properties3.jsx"],
        ["Detail properti", "Client/components/propertyDetails/Details1.jsx dan turunannya"],
        ["Rekomendasi", "Client/components/otherPages/rekomendasi/RekomendasiProperti.jsx"],
        ["Komparasi", "Client/components/compare/Compare.jsx"],
        ["Simulasi KPR", "Client/components/otherPages/BungaFlat/LoanCalculator.jsx"],
        ["Artikel", "Client/components/artikel/ArtikelList.jsx dan DetailArtikel.jsx"],
        ["Jual Properti", "Client/components/otherPages/JualProperti/SubmitPropertyForm.jsx"],
        ["FAQ", "Client/components/otherPages/faq/Faqs.jsx"],
        ["Kontak", "Client/components/contact/Contact.jsx"],
        ["Sidebar admin", "Client/components/dashboard/Sidebar.jsx"],
        ["Dashboard admin", "Client/components/dashboard/Dashboard.jsx"],
        ["CRUD admin", "Client/components/dashboard/User.jsx, Properti.jsx, PropertySubmissions.jsx, Artikel.jsx, TagArtikel.jsx, dan Faq.jsx"],
        ["Route API", "Server/routes/api.php"],
    ],
    [2200, 6100],
))

add(p("16. Kesimpulan", style="Heading1"))
add(p(
    "Aplikasi Diproperti memisahkan pengalaman publik, pengguna login, dan admin. Pengunjung dapat mencari informasi "
    "dan memakai fitur pendukung keputusan tanpa masuk. Pengguna login memperoleh alur pengajuan properti beserta "
    "tracking. Admin mengelola data dan memverifikasi pengajuan melalui dashboard internal. Pembagian ini membuat "
    "alur penggunaan jelas dan tanggung jawab setiap menu mudah dijelaskan saat presentasi."
))
add(p(""))
add(p("Dokumen selesai.", italic=True, align="center", color="666666"))


document = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>{''.join(body)}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId2"/>
      <w:footerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1000" w:right="950" w:bottom="1000" w:left="950" w:header="650" w:footer="650"/>
    </w:sectPr>
  </w:body>
</w:document>'''

styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/></w:rPr>
    <w:pPr><w:spacing w:after="90" w:line="250" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="270" w:after="110"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="0B4F9C"/><w:sz w:val="29"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="180" w:after="70"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/></w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/><w:tblPr><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="B7C9D6"/><w:left w:val="single" w:sz="4" w:color="B7C9D6"/>
      <w:bottom w:val="single" w:sz="4" w:color="B7C9D6"/><w:right w:val="single" w:sz="4" w:color="B7C9D6"/>
      <w:insideH w:val="single" w:sz="4" w:color="B7C9D6"/><w:insideV w:val="single" w:sz="4" w:color="B7C9D6"/>
    </w:tblBorders><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="80" w:type="dxa"/>
    <w:bottom w:w="60" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>
  </w:style>
</w:styles>'''

types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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

doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>'''

header = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr>
<w:t>Diproperti | Panduan Menu Aplikasi</w:t></w:r></w:p></w:hdr>'''

footer = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>
<w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>Halaman </w:t></w:r>
<w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
</w:p></w:ftr>'''

core = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Panduan Lengkap Menu Aplikasi Diproperti</dc:title><dc:creator>Diproperti</dc:creator>
<dc:subject>Penjelasan halaman publik dan dashboard admin</dc:subject>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-06-02T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-02T00:00:00Z</dcterms:modified>
</cp:coreProperties>'''

app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
<Application>Microsoft Office Word</Application><AppVersion>16.0000</AppVersion></Properties>'''

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", types)
    z.writestr("_rels/.rels", root_rels)
    z.writestr("word/document.xml", document)
    z.writestr("word/styles.xml", styles)
    z.writestr("word/_rels/document.xml.rels", doc_rels)
    z.writestr("word/header1.xml", header)
    z.writestr("word/footer1.xml", footer)
    z.writestr("docProps/core.xml", core)
    z.writestr("docProps/app.xml", app)

print(f"Created: {OUTPUT}")

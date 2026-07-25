# Kasir - Point of Sale (POS) Coffee Shop

Aplikasi Web Kasir (Point of Sale) modern dan responsive untuk Coffee Shop. Dibuat menggunakan **Next.js 15+**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, dan **MySQL**.

## ☕ Fitur Utama

1. **Transaksi Kasir (POS)**
   - Katalong menu dalam tampilan grid card interaktif
   - Filter menu berdasarkan kategori & pencarian kata kunci
   - Keranjang belanja real-time (tambah/kurang Qty & hapus item)
   - Toggle Service Charge / Pajak Resto (10%)
   - Hitung otomatis subtotal, total harga, & kembalian uang tunai
   - Tombol nominal cepat (Uang Pas, 20k, 50k, 100k)
   - Modal Struk Penjualan thermal siap cetak (`window.print()`)

2. **Manajemen Menu & Kategori**
   - CRUD Menu (Tambah, Edit, Hapus, Lihat Menu)
   - Atur status ketersediaan menu (*Tersedia* vs *Habis*)
   - Input harga, kategori, & foto menu (URL)
   - Kelola & tambah Kategori baru

3. **Riwayat Transaksi**
   - Daftar lengkap riwayat transaksi terurut dari terbaru
   - Filter transaksi berdasarkan tanggal (Hari ini & Custom date)
   - Summary total omset & total item terjual
   - Rincian item pesanan & opsi cetak ulang struk

4. **Dashboard Ringkasan**
   - Statistik omset penjualan hari ini & jumlah transaksi
   - Daftar **Top 5 Menu Terlaris** berdasarkan kuantitas penjualan
   - Grafik penjualan visual 7 hari terakhir

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL
- **ORM**: Prisma ORM
- **Icons**: Lucide React

---

## 🚀 Panduan Installasi & Persiapan Database

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Konfigurasi Database (.env)

Buat file `.env` di root project (atau salin dari `.env.example`):

```env
DATABASE_URL="mysql://root:password@localhost:3306/kasir_db"
```
> Adjust `root`, `password`, `localhost`, and `kasir_db` according to your local MySQL environment.

### 3. Migrasi Schema Database (Prisma)

Jalankan perintah migrasi Prisma untuk membuat tabel database MySQL:

```bash
npx prisma migrate dev --name init
```

Atau untuk meng-generate Prisma Client:

```bash
npx prisma generate
```

### 4. Seed Data Awal (Kategori & Menu Sample)

Untuk mengisi database awal dengan sampel menu Kopi, Non-Kopi, Makanan, & Snack:

```bash
npm run db:seed
```

### 5. Jalankan Aplikasi Web

```bash
npm run dev
```

Buka browser di `http://localhost:3000`.

---

## 📄 Struktur Schema Database

- `Kategori`: id, nama, createdAt, updatedAt
- `Menu`: id, nama, harga, kategoriId, gambar, tersedia, createdAt, updatedAt
- `Transaksi`: id, nomorStruk, tanggal, subtotal, pajak, totalHarga, dibayar, kembalian
- `DetailTransaksi`: id, transaksiId, menuId, namaMenu, hargaSatuan, jumlah, subtotal

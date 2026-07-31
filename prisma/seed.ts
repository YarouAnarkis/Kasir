import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with updated users, system settings, and menu items...");

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.detailTransaksi.deleteMany({});
  await prisma.transaksi.deleteMany({});
  await prisma.promoMenu.deleteMany({});
  await prisma.promo.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.kategori.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.systemSetting.deleteMany({});

  // Seed Default System Setting
  await prisma.systemSetting.create({
    data: {
      id: 1,
      namaToko: "Kasir Coffee Shop",
      alamatToko: "Jl. Kopi No. 123, Jakarta",
      teleponToko: "0812-3456-7890",
      persenPajak: 10,
    },
  });

  // Seed Users with hashed passwords
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordKasir = await bcrypt.hash("kasir123", 10);

  const superAdminUser = await prisma.user.create({
    data: {
      nama: "Super Admin",
      username: "superadmin",
      password: passwordAdmin,
      role: "super_admin",
      aktif: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      nama: "Manajer Store",
      username: "admin",
      password: passwordAdmin,
      role: "admin",
      aktif: true,
    },
  });

  const kasirUser1 = await prisma.user.create({
    data: {
      nama: "Budi Santoso",
      username: "budi",
      password: passwordKasir,
      role: "karyawan",
      aktif: true,
    },
  });

  const kasirUser2 = await prisma.user.create({
    data: {
      nama: "Siti Rahma",
      username: "siti",
      password: passwordKasir,
      role: "karyawan",
      aktif: true,
    },
  });

  // Seed Categories
  const espressoCat = await prisma.kategori.create({
    data: { nama: "Kopi Espresso" },
  });

  const signatureCat = await prisma.kategori.create({
    data: { nama: "Kopi Signature" },
  });

  const nonKopiCat = await prisma.kategori.create({
    data: { nama: "Non-Kopi & Teh" },
  });

  const makananCat = await prisma.kategori.create({
    data: { nama: "Makanan Utama" },
  });

  const snackCat = await prisma.kategori.create({
    data: { nama: "Snack & Pastry" },
  });

  const dessertCat = await prisma.kategori.create({
    data: { nama: "Dessert & Cake" },
  });

  // Seed Menus with reliable high-quality Unsplash URLs
  const menus = [
    // Kopi Espresso
    {
      nama: "Espresso Single Shot",
      harga: 18000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Americano Hot / Iced",
      harga: 22000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Caffe Latte Creamy",
      harga: 28000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Cappuccino Foam Art",
      harga: 28000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Flat White Smooth",
      harga: 29000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Mocha Choco Espresso",
      harga: 32000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    // Kopi Signature
    {
      nama: "Kopi Susu Gula Aren Classic",
      harga: 23000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Avocado Coffee Float",
      harga: 32000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Salted Caramel Macchiato",
      harga: 34000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Hazelnut Latte Delight",
      harga: 33000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Pandan Coconut Latte",
      harga: 31000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Affogato Vanilla Ice",
      harga: 26000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    // Non-Kopi & Teh
    {
      nama: "Matcha Latte Uji Premium",
      harga: 30000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Dark Chocolate Artisan",
      harga: 29000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Red Velvet Creamy Shake",
      harga: 29000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Earl Grey Milk Tea",
      harga: 25000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Lychee Tea Fresh",
      harga: 24000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Lemon Mojito Sparkling",
      harga: 25000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    // Makanan Utama
    {
      nama: "Nasi Goreng Special Spesial Cafe",
      harga: 38000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Spaghetti Bolognese Beef",
      harga: 42000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Spaghetti Carbonara Creamy",
      harga: 45000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Chicken Katsu Donburi",
      harga: 40000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Beef Blackpepper Rice",
      harga: 48000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Club Sandwich Double Layer",
      harga: 35000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    // Snack & Pastry
    {
      nama: "French Fries Crispy Salted",
      harga: 22000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Croissant Butter Golden",
      harga: 25000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Pain Au Chocolat",
      harga: 27000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Chicken Wings BBQ Honey",
      harga: 32000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Platter Mix Snack",
      harga: 38000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    // Dessert & Cake
    {
      nama: "Cheesecake New York Slice",
      harga: 32000,
      kategoriId: dessertCat.id,
      gambar: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Fudgy Chocolate Brownie",
      harga: 25000,
      kategoriId: dessertCat.id,
      gambar: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Waffle Vanilla Ice Cream",
      harga: 30000,
      kategoriId: dessertCat.id,
      gambar: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
  ];

  for (const item of menus) {
    await prisma.menu.create({ data: item });
  }

  // Seed sample Happy Hour promo
  const samplePromo = await prisma.promo.create({
    data: {
      nama: "Happy Hour Kopi 20%",
      tipeDiskon: "persentase",
      nilai: 20,
      jamMulai: "21:00",
      jamSelesai: "00:00",
      berlakuUntuk: "kategori",
      kategoriId: espressoCat.id,
      aktif: true,
      createdBy: superAdminUser.id,
    },
  });

  console.log(`Seeding finished successfully! Created default accounts:`);
  console.log(`- Super Admin: username 'superadmin', password 'admin123'`);
  console.log(`- Admin:       username 'admin',      password 'admin123'`);
  console.log(`- Karyawan 1:  username 'budi',       password 'kasir123'`);
  console.log(`- Karyawan 2:  username 'siti',       password 'kasir123'`);
  console.log(`Inserted ${menus.length} menu items and 1 Happy Hour promo.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with updated reliable photo URLs...");

  // Clean existing data
  await prisma.detailTransaksi.deleteMany({});
  await prisma.transaksi.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.kategori.deleteMany({});

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
    // --- 1. KOPI ESPRESSO ---
    {
      nama: "Espresso Single",
      harga: 18000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Espresso Double",
      harga: 22000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Iced Americano",
      harga: 22000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Hot Long Black",
      harga: 24000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Cafe Latte",
      harga: 28000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Cappuccino Hot",
      harga: 28000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1572442388796-11668ba69e54?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Flat White",
      harga: 29000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Mochaccino Cream",
      harga: 30000,
      kategoriId: espressoCat.id,
      gambar: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },

    // --- 2. KOPI SIGNATURE ---
    {
      nama: "Kopi Susu Gula Aren",
      harga: 25000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Caramel Macchiato Ice",
      harga: 32000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Sea Salt Caramel Latte",
      harga: 33000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Avocado Coffee Float",
      harga: 34000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Pandan Coconut Latte",
      harga: 32000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Hazelnut Cold Brew",
      harga: 30000,
      kategoriId: signatureCat.id,
      gambar: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },

    // --- 3. NON-KOPI & TEH ---
    {
      nama: "Matcha Ice Latte",
      harga: 30000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Signature Belgian Chocolate",
      harga: 28000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Taro Ice Milk",
      harga: 27000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Red Velvet Velvet Cream",
      harga: 29000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Iced Lemon Tea Fresh",
      harga: 22000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Peach Mint Iced Tea",
      harga: 24000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Earl Grey Milk Tea",
      harga: 26000,
      kategoriId: nonKopiCat.id,
      gambar: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },

    // --- 4. MAKANAN UTAMA ---
    {
      nama: "Nasi Goreng Kasir Spesial",
      harga: 35000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Spaghetti Carbonara Creamy",
      harga: 40000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Spaghetti Bolognese Beef",
      harga: 38000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Classic Beef Burger & Fries",
      harga: 45000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Chicken Katsu Donburi",
      harga: 42000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Fish & Chips Tartar Sauce",
      harga: 42000,
      kategoriId: makananCat.id,
      gambar: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },

    // --- 5. SNACK & PASTRY ---
    {
      nama: "Butter Croissant French",
      harga: 24000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Almond Flakes Croissant",
      harga: 28000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Pain Au Chocolat",
      harga: 27000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1623334044303-241021148842?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "French Fries Crispy",
      harga: 20000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Truffle Parmesan Fries",
      harga: 28000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Cinnamon Roll Glazed",
      harga: 22000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "Garlic Butter Bread Stick",
      harga: 18000,
      kategoriId: snackCat.id,
      gambar: "https://images.unsplash.com/photo-1573140247614-601fa6770984?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },

    // --- 6. DESSERT & CAKE ---
    {
      nama: "Signature Tiramisu Cake",
      harga: 32000,
      kategoriId: dessertCat.id,
      gambar: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60",
      tersedia: true,
    },
    {
      nama: "New York Cheese Cake",
      harga: 35000,
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

  console.log(`Seeding finished successfully! Inserted ${menus.length} menu items.`);
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

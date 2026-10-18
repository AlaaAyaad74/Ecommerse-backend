import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const PASSWORD = "password123";

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10);

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const [sara, omar, lina, karim] = await Promise.all([
    prisma.user.create({
      data: { name: "Sara Ahmed", email: "sara@example.com", password },
    }),
    prisma.user.create({
      data: { name: "Omar Hassan", email: "omar@example.com", password },
    }),
    prisma.user.create({
      data: { name: "Lina Farouk", email: "lina@example.com", password },
    }),
    prisma.user.create({
      data: { name: "Karim Nasser", email: "karim@example.com", password },
    }),
  ]);

  const [headphones, keyboard, shoes, tshirt, mug, lamp] = await Promise.all([
    prisma.product.create({
      data: {
        name: "Wireless Headphones",
        description: "Over-ear headphones with noise cancellation and a 30-hour battery.",
        price: "89.99",
        stock: 24,
        sellerId: sara.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mechanical Keyboard",
        description: "Compact keyboard with tactile switches and a USB-C cable.",
        price: "129.50",
        stock: 14,
        sellerId: sara.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Running Shoes",
        description: "Lightweight trainers with a cushioned sole for daily runs.",
        price: "74.00",
        stock: 40,
        sellerId: omar.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Cotton T-Shirt",
        description: "Soft everyday tee in navy, available in unisex sizing.",
        price: "19.99",
        stock: 58,
        sellerId: omar.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Ceramic Mug",
        description: "12 oz stoneware mug, dishwasher safe.",
        price: "12.50",
        stock: 79,
        sellerId: lina.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Desk Lamp",
        description: "Adjustable LED lamp with three brightness levels.",
        price: "34.00",
        stock: 29,
        sellerId: lina.id,
      },
    }),
  ]);

  await prisma.order.create({
    data: {
      userId: karim.id,
      status: "paid",
      items: {
        create: [
          { productId: headphones.id, quantity: 1, price: headphones.price },
          { productId: mug.id, quantity: 1, price: mug.price },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: lina.id,
      status: "shipped",
      items: {
        create: [{ productId: keyboard.id, quantity: 1, price: keyboard.price }],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: sara.id,
      status: "pending",
      items: {
        create: [{ productId: tshirt.id, quantity: 2, price: tshirt.price }],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: omar.id,
      status: "delivered",
      items: {
        create: [{ productId: lamp.id, quantity: 1, price: lamp.price }],
      },
    },
  });

  const [users, products, orders, items] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
  ]);

  console.log(
    `Seeded ${users} users, ${products} products, ${orders} orders, ${items} order items.`,
  );
  console.log(`Login password for every user: ${PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

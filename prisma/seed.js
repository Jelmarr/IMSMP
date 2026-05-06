/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("Fetching required users (Dustin, Raven, Acepogi)...");

  const nurse = await db.user.findUnique({ where: { username: "Dustin" } });
  const pharmacist = await db.user.findUnique({ where: { username: "Raven" } });
  const cashier = await db.user.findUnique({ where: { username: "Acepogi" } });

  if (!nurse || !pharmacist || !cashier) {
    throw new Error("Required users missing. Ensure Dustin, Raven, and Acepogi exist.");
  }

  const products = await db.product.findMany({ take: 10 });
  if (products.length === 0) {
    throw new Error("No products found.");
  }

  console.log("Seeding 30 days of transactions for presentable charts...");

  // Generate data for the last 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - dayOffset);
    // Randomize time of day slightly
    transactionDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 59));

    // Create 2-3 transactions per day to make the chart look active
    const transactionsPerDay = Math.floor(Math.random() * 2) + 1;

    for (let j = 0; j < transactionsPerDay; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const itemTotal = Number(product.price) * qty;

      // 1. Create Patient
      const patient = await db.patient.create({
        data: {
          patientName: `Patient-${dayOffset}-${j}`,
          createdAt: transactionDate,
        }
      });

      // 2. Order Request (Directly, no MedTech)
      const orderReq = await db.orderRequest.create({
        data: {
          patientId: patient.id,
          userId: nurse.id,
          status: "paid",
          remarks: "dispensed",
          type: "REGULAR",
          totalAmount: itemTotal,
          preparedById: pharmacist.id,
          dispensedById: pharmacist.id,
          createdAt: transactionDate,
          updatedAt: transactionDate,
          items: {
            create: {
              productId: product.id,
              quantityOrdered: qty,
              price: product.price,
              totalPrice: itemTotal,
              refundedQuantity: 0
            }
          }
        }
      });

      // 3. Clinical Payment
      const vatRate = 0.12;
      const subTotal = itemTotal / (1 + vatRate);

      await db.payment.create({
        data: {
          orderRequestId: orderReq.id,
          subTotal: subTotal,
          vatAmount: itemTotal - subTotal,
          vatRate: 12,
          amountDue: itemTotal,
          amountTendered: itemTotal,
          discountType: "NONE",
          processedById: cashier.id,
          createdAt: transactionDate,
        }
      });

      // 4. Walk-In Transaction
      const walkInQty = Math.floor(Math.random() * 2) + 1;
      const walkInTotal = Number(product.price) * walkInQty;

      const walkInTransaction = await db.walkInTransaction.create({
        data: {
          customer_name: `Walk-in-${dayOffset}-${j}`,
          status: "paid",
          totalAmount: walkInTotal,
          userId: pharmacist.id,
          createdAt: transactionDate,
          items: {
            create: {
              productId: product.id,
              quantity: walkInQty,
              price: product.price,
              total: walkInTotal,
            }
          }
        }
      });

      // 5. Walk-In Payment
      await db.payment.create({
        data: {
          walkInOrderId: walkInTransaction.id,
          subTotal: walkInTotal / (1 + vatRate),
          vatAmount: walkInTotal - (walkInTotal / (1 + vatRate)),
          amountDue: walkInTotal,
          amountTendered: walkInTotal,
          processedById: cashier.id,
          createdAt: transactionDate,
        }
      });
    }
  }

  console.log("✅ Seeded 30 days of distributed sales data.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
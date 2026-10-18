import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

const VALID_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

// POST /api/orders
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "userId and a non-empty items array are required" });
    }

    for (const item of items) {
      if (
        !Number.isInteger(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Each item needs an integer productId and quantity >= 1",
        });
      }
    }

    // لو نفس المنتج اتكرر، ندمج الكميات (عشان الـ @@unique)
    const merged = new Map<number, number>();
    for (const item of items) {
      merged.set(
        item.productId,
        (merged.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const productIds = [...merged.keys()];

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new HttpError(404, "One or more products not found");
      }

      // تحقق من المخزون
      for (const product of products) {
        const qty = merged.get(product.id)!;
        if (product.stock < qty) {
          throw new HttpError(
            400,
            `Not enough stock for "${product.name}" (available: ${product.stock})`,
          );
        }
      }

      // إنشاء الأوردر وعناصره
      const created = await tx.order.create({
        data: {
          userId,
          items: {
            create: products.map((p) => ({
              productId: p.id,
              quantity: merged.get(p.id)!,
              price: p.price,
            })),
          },
        },
        include: { items: true },
      });

      // إنقاص المخزون (الشرط gte بيحمي من التزامن)
      for (const product of products) {
        const qty = merged.get(product.id)!;
        const result = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        if (result.count === 0) {
          throw new HttpError(400, `Not enough stock for "${product.name}"`);
        }
      }

      return created;
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.query;
    const orders = await prisma.order.findMany({
      where: userId ? { userId: Number(userId) } : undefined,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
export const getOrderById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // الإجمالي بيتحسب من العناصر
    const total = order.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    res.json({ ...order, total });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// كلاس بسيط عشان نرجّع status code مخصص من جوه الـ transaction
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

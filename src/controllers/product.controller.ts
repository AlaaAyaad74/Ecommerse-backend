import { NextFunction, Request, Response } from "express";

import prisma from "../lib/prisma";

// GET /products
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// GET /products/:id
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// POST /products
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, price, description, sellerId } = req.body;
    if (!name || !price || !description || sellerId) {
      return res
        .status(400)
        .json({ message: "Please provide name, price, description and image" });
    }
    const product = await prisma.product.create({
      data: {
        name,
        price,
        description,
        sellerId,
      },
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// PUT /products/:id
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, price, description, sellerId } = req.body;
    if (!name || !price || !description || !sellerId) {
      return res
        .status(400)
        .json({ message: "Please provide name, price, description and image" });
    }
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        price,
        description,
        sellerId,
      },
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// DELETE /products/:id
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.delete({
      where: { id: Number(id) },
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

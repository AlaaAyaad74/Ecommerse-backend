import { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(err);
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
};

import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.route";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", productRoutes);
app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;

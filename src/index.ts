import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import BrandRouter from "./routes/brand/router";
import prisma from "./utils/db";
import RedisClientSingleton from "./utils/redis";   
import ProductRouter from "./routes/product/router";
import UserRouter from "./routes/user/router";


// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/brand", BrandRouter);
app.use("/api/product", ProductRouter);
app.use("/api/user", UserRouter);

// Sample route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is live on port 4000" });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const startServer = async () => {
  try {
    await RedisClientSingleton.getRedisClient();
    app.listen(4000, () => {
      console.log("Server is running on port 4000");
    });
  } catch (err) {
    console.error("Error starting server:", err);
  }
};

// Start application
startServer().catch(console.error);

export default app;

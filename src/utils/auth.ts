import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (
  req: any,
  res: any,
  next: any
) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    console.log(token);
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    console.log(decoded);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

export const verifyWebSocketToken = (
    authHeader: string
  ): any => {
    const token = authHeader?.split(",")[1]?.trim();
    if (!token) {
      console.error("No token found, connection closed.");
      return null;
    }
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error: any) {
      console.error("Invalid token:", error.message);
      return null;
    }
  };
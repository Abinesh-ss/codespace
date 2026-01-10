import { Router } from "express";
import { verifyToken } from "../lib/auth/jwt";

const router = Router();

/**
 * GET /api/auth/me
 * Returns logged-in user
 */
router.get("/me", (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = verifyToken(token);

    return res.json({
      id: user.id,
      email: user.email,
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;


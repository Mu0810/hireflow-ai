import { Request, Response, NextFunction } from "express";
import { UserRole } from "@hireflow/shared";

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

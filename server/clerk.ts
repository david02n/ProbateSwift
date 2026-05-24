import type { Express, Request, RequestHandler, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { storage } from "./storage";

function getPrimaryEmail(user: Awaited<ReturnType<typeof clerkClient.users.getUser>>) {
  const primaryId = user.primaryEmailAddressId;
  const email = user.emailAddresses.find((entry) => entry.id === primaryId) ?? user.emailAddresses[0];
  return email?.emailAddress ?? null;
}

async function buildAppUser(userId: string) {
  const clerkUser = await clerkClient.users.getUser(userId);

  return storage.upsertUser({
    id: clerkUser.id,
    email: getPrimaryEmail(clerkUser),
    firstName: clerkUser.firstName ?? null,
    lastName: clerkUser.lastName ?? null,
    profileImageUrl: clerkUser.imageUrl ?? null,
  });
}

export const requireClerkAuth: RequestHandler = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    (req as any).user = await buildAppUser(auth.userId);
    next();
  } catch (error) {
    next(error);
  }
};

export function setupClerkAuth(app: Express) {
  app.get("/api/user", async (req: Request, res: Response) => {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.json(null);
    }

    const user = await buildAppUser(auth.userId);
    res.json(user);
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await buildAppUser(auth.userId);
    res.json(user);
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    // Clerk signs out on the client; this endpoint exists for app compatibility.
    res.status(204).end();
  });

  // Debug endpoint — development only
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/test-auth", requireClerkAuth, (req: Request, res: Response) => {
      res.json({ message: "Authentication successful", user: (req as any).user });
    });
  }
}

import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/security';
import { z } from 'zod';

const router = Router();
const authService = AuthService.getInstance();

// Google Sign-in
const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  
});

router.post('/google', 
  validateRequest({ body: googleAuthSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userData = await authService.handleGoogleAuth(req, res);
    res.json(userData);
  })
);

// Logout
router.post('/logout',
  asyncHandler(async (req: Request, res: Response) => {
    await authService.handleLogout(req, res);
    res.json({ message: 'Logged out successfully' });
  })
);

// Get current user
router.get('/me',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req);
    const { password: _, ...userData } = user;
    res.json(userData);
  })
);

export default router; 
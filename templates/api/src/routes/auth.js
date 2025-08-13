import { Router } from 'express';
import { loginController } from '#app/controllers/auth/index.js';

const router = Router();

router.post('/login', loginController);

export default router;
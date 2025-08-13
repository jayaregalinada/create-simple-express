import { Router } from 'express';
import { loginAction, registerAction, getCurrentUserAction } from '#app/actions/auth/index.js';

const router = Router();

router.post('/login', loginAction);

export default router;
import express from 'express';
import { login, register } from '../controllers/authController';
import { validateRequest } from '@arcane/shared';
import { loginSchema, registerSchema } from '../schemas';

const router = express.Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);

export default router;

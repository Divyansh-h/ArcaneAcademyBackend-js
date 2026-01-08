import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BadRequestError, MessageQueue } from '@arcane/shared';

// Helper to generate JWT
const generateToken = (user: User) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1h' }
    );
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // console.log('[Auth Debug] Register Payload:', req.body); // REMOVED: Sensitive data logging
        const { email, password, name, role } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new BadRequestError('Email in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Default to student if no role provided, or use provided role
        const userRole = role || 'student';
        const user = await User.create({ email, password: hashedPassword, name, role: userRole });

        const token = generateToken(user);

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
        });

        // Publish event to RabbitMQ
        await MessageQueue.getInstance().publish('USER_REGISTERED', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        res.status(201).json({
            message: 'User registered successfully',
            // token, // Token is now in cookie
            user: { id: user.id, email: user.email, role: user.role, name: user.name }
        });
    } catch (error) {
        next(error);
    }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log(`Login failed: User not found for email ${email}`);
            throw new BadRequestError('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        // console.log(`Login attempt for ${email}. Match: ${isMatch}. Stored hash: ${user.password.substring(0, 10)}...`); // REMOVED: Sensitive data logging

        if (!isMatch) {
            throw new BadRequestError('Invalid credentials');
        }

        const token = generateToken(user);

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
        });

        res.json({
            message: 'Login successful',
            // token, // Token is now in cookie
            user: { id: user.id, email: user.email, role: user.role, name: user.name }
        });
    } catch (error) {
        next(error);
    }
};

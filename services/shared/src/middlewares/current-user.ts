import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
    id: number;
    email: string;
    role: string;
    name: string;
}

declare global {
    namespace Express {
        interface Request {
            currentUser?: UserPayload;
        }
    }
}

export const currentUser = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
        return next();
    }

    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as UserPayload;
        req.currentUser = payload;
    } catch (err) { }

    next();
};

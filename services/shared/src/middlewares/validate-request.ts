import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { RequestValidationError } from '../errors/request-validation-error';

export const validateRequest = (schema: AnyZodObject) => async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error: any) {
        throw new RequestValidationError(error);
    }
};

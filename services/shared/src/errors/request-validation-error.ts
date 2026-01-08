import { CustomError } from './custom-error';
import { ZodError } from 'zod';

export class RequestValidationError extends CustomError {
    statusCode = 400;

    constructor(public errors: ZodError) {
        super('Invalid request parameters');
        Object.setPrototypeOf(this, RequestValidationError.prototype);
    }

    serializeErrors() {
        return this.errors.errors.map((err) => {
            // Handle array of strings or simple messages
            return { message: err.message, field: err.path.join('.') };
        });
    }
}

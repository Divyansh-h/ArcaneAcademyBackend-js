import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure directories exist
const createDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/others';

        // Determine path based on field name or route
        if (file.fieldname === 'assignmentFile') {
            uploadPath = 'uploads/assignments';
        } else if (file.fieldname === 'submissionFile') {
            uploadPath = 'uploads/submissions';
        } else if (file.fieldname === 'gradedFile') {
            uploadPath = 'uploads/graded';
        }

        // Create directory relative to the service root
        createDir(path.resolve(__dirname, '../../', uploadPath));
        cb(null, path.resolve(__dirname, '../../', uploadPath));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'));
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

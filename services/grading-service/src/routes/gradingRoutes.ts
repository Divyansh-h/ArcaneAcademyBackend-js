import express from 'express';
import { upload } from '../middleware/uploadMiddleware';
import {
    createAssignment,
    getAssignments,
    createSubmission,
    getPendingSubmissions,
    gradeSubmission,
    downloadFile
} from '../controllers/gradingController';
import { currentUser, requireAuth } from '@arcane/shared';

const router = express.Router();

router.use(currentUser);
router.use(requireAuth);

// Assignments
router.post('/assignments', upload.single('assignmentFile'), createAssignment);
router.get('/assignments', getAssignments);

// Submissions
router.post('/submissions', upload.single('submissionFile'), createSubmission);
router.get('/submissions/pending', getPendingSubmissions);
router.post('/submissions/:id/grade', upload.single('gradedFile'), gradeSubmission);

// Downloads
router.get('/download/:type/:id', downloadFile);

export default router;

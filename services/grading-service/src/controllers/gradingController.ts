import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { Submission } from '../models/Submission';
import path from 'path';
import fs from 'fs';
import { MessageQueue } from '@arcane/shared';

export const createAssignment = async (req: Request, res: Response) => {
    try {
        const { title, description, classId, teacherId, dueDate } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Assignment PDF file is required' });
        }

        const assignment = await Assignment.create({
            title,
            description,
            classId,
            teacherId,
            dueDate,
            fileUrl: req.file.path // Store full local path for now
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const { classId, teacherId } = req.query;
        const whereClause: any = {};
        if (classId) whereClause.classId = classId;
        if (teacherId) whereClause.teacherId = teacherId;

        const assignments = await Assignment.findAll({ where: whereClause });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createSubmission = async (req: Request, res: Response) => {
    try {
        const { assignmentId, studentId } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Submission PDF file is required' });
        }

        const submission = await Submission.create({
            assignmentId,
            studentId,
            fileUrl: req.file.path,
            status: 'pending'
        });

        res.status(201).json(submission);
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get pending submissions for a teacher (could filter by class)
export const getPendingSubmissions = async (req: Request, res: Response) => {
    try {
        // In a real app, join with Assignment to check teacherId
        // For now, just return all pending
        const submissions = await Submission.findAll({
            where: { status: 'pending' }
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const gradeSubmission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { grade, feedback } = req.body;

        const submission = await Submission.findByPk(id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // 1. Update status to 'processing' immediately
        submission.status = 'processing';
        if (req.file) {
            submission.gradedFileUrl = req.file.path; // Save file path immediately
        }
        await submission.save();

        // 2. Publish to RabbitMQ
        const message = {
            submissionId: id,
            grade,
            feedback,
            gradedFileUrl: req.file ? req.file.path : undefined
        };

        const published = await MessageQueue.getInstance().publish('GRADE_SUBMISSION', message);

        if (!published) {
            // Fallback if queue fails: process immediately or error out
            console.error('Failed to queue grading job');
            return res.status(500).json({ message: 'Failed to queue grading job' });
        }

        // 3. Return immediate response
        res.json({
            message: 'Grading submitted for processing',
            status: 'processing',
            submissionId: id
        });

    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const downloadFile = async (req: Request, res: Response) => {
    try {
        // This is a naive implementation. In production, prevent path traversal!
        // We will trust the IDs for now as they come from DB lookups
        const { type, id } = req.params;

        let filePath = '';
        if (type === 'assignment') {
            const assignment = await Assignment.findByPk(id);
            if (assignment) filePath = assignment.fileUrl;
        } else if (type === 'submission') {
            const submission = await Submission.findByPk(id);
            if (submission) filePath = submission.fileUrl;
        } else if (type === 'graded') {
            const submission = await Submission.findByPk(id);
            if (submission) filePath = submission.gradedFileUrl || '';
        }

        if (!filePath) {
            return res.status(404).json({ message: 'File not found' });
        }

        const uploadsDir = path.resolve(__dirname, '../../uploads');
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(uploadsDir)) {
            return res.status(403).json({ message: 'Forbidden: Invalid path' });
        }

        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(resolvedPath);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

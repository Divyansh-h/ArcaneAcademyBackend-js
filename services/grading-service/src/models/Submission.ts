import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export interface SubmissionAttributes {
    id?: string;
    assignmentId: string;
    studentId: string;
    fileUrl: string; // Original student submission
    gradedFileUrl?: string; // Annotated PDF
    grade?: number;
    feedback?: string;
    status: 'pending' | 'processing' | 'graded';
}

export class Submission extends Model<SubmissionAttributes> implements SubmissionAttributes {
    public id!: string;
    public assignmentId!: string;
    public studentId!: string;
    public fileUrl!: string;
    public gradedFileUrl?: string;
    public grade?: number;
    public feedback?: string;
    public status!: 'pending' | 'processing' | 'graded';
}

Submission.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    assignmentId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gradedFileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    grade: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'graded'),
        defaultValue: 'pending',
    },
}, {
    sequelize,
    modelName: 'Submission',
});

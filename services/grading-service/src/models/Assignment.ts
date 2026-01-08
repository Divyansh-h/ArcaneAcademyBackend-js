import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export interface AssignmentAttributes {
    id?: string;
    title: string;
    description?: string;
    fileUrl: string; // Path to PDF
    teacherId: string;
    classId: string;
    dueDate?: Date;
}

export class Assignment extends Model<AssignmentAttributes> implements AssignmentAttributes {
    public id!: string;
    public title!: string;
    public description?: string;
    public fileUrl!: string;
    public teacherId!: string;
    public classId!: string;
    public dueDate?: Date;
}

Assignment.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    teacherId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    classId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Assignment',
});

import { pool } from '../config/db';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  created_at: Date;
  updated_at: Date;
}

export class CourseRepository {
  /**
   * Fetch a course by ID using parameterized queries to prevent SQL injection.
   */
  static async getCourseById(courseId: string): Promise<Course | null> {
    const query = `
      SELECT id, title, description, teacher_id, created_at, updated_at
      FROM courses
      WHERE id = $1
    `;
    
    // The pool.query method automatically checks out a client, runs the query, and returns the client
    const { rows } = await pool.query<Course>(query, [courseId]);
    return rows[0] || null;
  }

  /**
   * Fetch all courses for a specific teacher.
   */
  static async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    const query = `
      SELECT id, title, description, teacher_id, created_at, updated_at
      FROM courses
      WHERE teacher_id = $1
      ORDER BY created_at DESC
    `;
    
    const { rows } = await pool.query<Course>(query, [teacherId]);
    return rows;
  }

  /**
   * Create a new course safely using parameterized inputs.
   */
  static async createCourse(title: string, description: string | null, teacherId: string): Promise<Course> {
    const query = `
      INSERT INTO courses (title, description, teacher_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const { rows } = await pool.query<Course>(query, [title, description, teacherId]);
    return rows[0];
  }
}

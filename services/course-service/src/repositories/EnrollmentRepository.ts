import { pool } from '../config/db';

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  created_at: Date;
  updated_at: Date;
}

export class EnrollmentRepository {
  /**
   * Enroll a student into a course. Handles the UNIQUE constraint safely.
   */
  static async enrollStudent(studentId: string, courseId: string): Promise<Enrollment> {
    const query = `
      INSERT INTO enrollments (student_id, course_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    try {
      const { rows } = await pool.query<Enrollment>(query, [studentId, courseId]);
      return rows[0];
    } catch (err: any) {
      // 23505 is the PostgreSQL error code for unique_violation
      if (err.code === '23505') {
        throw new Error('Student is already enrolled in this course.');
      }
      throw err;
    }
  }

  /**
   * Remove a student from a course.
   */
  static async unenrollStudent(studentId: string, courseId: string): Promise<void> {
    const query = `
      DELETE FROM enrollments
      WHERE student_id = $1 AND course_id = $2
    `;
    
    await pool.query(query, [studentId, courseId]);
  }

  /**
   * Check enrollment status.
   */
  static async checkEnrollment(studentId: string, courseId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM enrollments
      WHERE student_id = $1 AND course_id = $2
      LIMIT 1
    `;
    
    const { rowCount } = await pool.query(query, [studentId, courseId]);
    return rowCount !== null && rowCount > 0;
  }
}

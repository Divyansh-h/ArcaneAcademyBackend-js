import { Request, Response } from 'express';
import { pool } from '../config/db';

export class CourseController {
  
  /* 
   * THE N+1 PROBLEM (Simulated example of what causes API slowdowns)
   * If there are 100 courses, this executes 101 separate SQL queries!
   * 
   * static async getCoursesWithStudentsBad(req: Request, res: Response) {
   *   const { rows: courses } = await pool.query('SELECT * FROM courses');
   *   for (const course of courses) {
   *     const { rows: students } = await pool.query('SELECT u.* FROM users u JOIN enrollments e ON u.id = e.student_id WHERE e.course_id = $1', [course.id]);
   *     course.students = students;
   *   }
   *   res.json(courses);
   * }
   */

  /**
   * THE OPTIMIZED APPROACH (1 Query)
   * Uses PostgreSQL's `json_agg` and `json_build_object` to perform 
   * the nesting directly in the database. 
   * This guarantees exactly 1 DB query is executed regardless of how many courses exist.
   */
  static async getCoursesWithStudents(req: Request, res: Response) {
    const query = `
      SELECT 
        c.id, 
        c.title,
        COALESCE(
          json_agg(
            json_build_object('id', u.id, 'name', u.name, 'email', u.email)
          ) FILTER (WHERE u.id IS NOT NULL), 
          '[]'
        ) AS students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN users u ON e.student_id = u.id
      GROUP BY c.id
    `;
    
    try {
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
}

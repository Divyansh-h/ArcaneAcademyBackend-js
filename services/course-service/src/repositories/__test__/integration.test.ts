import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { pool, closePool } from '../../config/db';
import { CourseRepository } from '../CourseRepository';
import { EnrollmentRepository } from '../EnrollmentRepository';

describe('Course & Enrollment Repository Integration Tests', () => {
  let teacherId: string;
  let student1Id: string;
  let student2Id: string;
  let courseId: string;

  beforeAll(async () => {
    teacherId = crypto.randomUUID();
    student1Id = crypto.randomUUID();
    student2Id = crypto.randomUUID();
    
    // Create test users (acting as Postgres superuser so RLS is bypassed for setup)
    await pool.query(`INSERT INTO users (id, name, email, password_hash, role) VALUES 
      ($1, 'Test Teacher', 't@t.com', 'hash', 'teacher'),
      ($2, 'Test Student 1', 's1@t.com', 'hash', 'student'),
      ($3, 'Test Student 2', 's2@t.com', 'hash', 'student')`, 
    [teacherId, student1Id, student2Id]);

    const course = await CourseRepository.createCourse('Vitest DB Testing', 'Testing transactions', teacherId);
    courseId = course.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [teacherId, student1Id, student2Id]);
    // Close pool so Vitest doesn't hang
    await closePool();
  });

  it('should enroll a student successfully', async () => {
    const enrollment = await EnrollmentRepository.enrollStudent(student1Id, courseId);
    expect(enrollment.student_id).toBe(student1Id);
    expect(enrollment.course_id).toBe(courseId);
  });

  it('should violate UNIQUE constraint on double enrollment', async () => {
    await expect(
      EnrollmentRepository.enrollStudent(student1Id, courseId)
    ).rejects.toThrow('Student is already enrolled in this course.');
  });

  it('should rollback transaction on failed batch enrollment', async () => {
    // student1Id is already enrolled. 
    // If we batch enroll student2Id and student1Id, it should fail and rollback student2Id.
    await expect(
      EnrollmentRepository.enrollMultipleWithTransaction([student2Id, student1Id], courseId)
    ).rejects.toThrow(); // Will throw unique constraint error internally

    // Verify student2Id was NOT enrolled because of the transaction rollback
    const isEnrolled = await EnrollmentRepository.checkEnrollment(student2Id, courseId);
    expect(isEnrolled).toBe(false);
  });

  it('should paginate courses using keyset pagination', async () => {
    // Create multiple courses
    await CourseRepository.createCourse('Course A', 'A', teacherId);
    await CourseRepository.createCourse('Course B', 'B', teacherId);
    await CourseRepository.createCourse('Course C', 'C', teacherId);

    // Fetch limit 2
    const firstPage = await CourseRepository.getCoursesKeyset(null, 2);
    expect(firstPage.length).toBe(2);

    // Fetch next page using the last ID
    const lastId = firstPage[1].id;
    const secondPage = await CourseRepository.getCoursesKeyset(lastId, 2);
    
    // Ensure the ID of the first item in second page is strictly greater than lastId
    // Because UUIDs are random, string comparison works for the query `> $1`
    expect(secondPage.length).toBeGreaterThan(0);
    expect(secondPage[0].id > lastId).toBe(true);
  });

  it('should trigger cascading deletes when a course is deleted', async () => {
    // Ensure student1Id is enrolled in courseId
    const isEnrolled = await EnrollmentRepository.checkEnrollment(student1Id, courseId);
    expect(isEnrolled).toBe(true);

    // Delete the course directly
    await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);

    // Check if enrollment was deleted automatically (Cascading Delete test)
    const isStillEnrolled = await EnrollmentRepository.checkEnrollment(student1Id, courseId);
    expect(isStillEnrolled).toBe(false);
  });
});

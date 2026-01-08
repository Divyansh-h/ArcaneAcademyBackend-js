import { MessageQueue } from '@arcane/shared';
import { Submission } from '../models/Submission';

const QUEUE_NAME = 'GRADE_SUBMISSION';

export const startWorker = async () => {
    console.log('👷 Grade Worker Initializing...');

    await MessageQueue.getInstance().consume(QUEUE_NAME, async (msg: any) => {
        const { submissionId, grade, feedback, gradedFileUrl } = msg;
        console.log(`📥 Received grading job for Submission #${submissionId}`);

        try {
            // Simulate heavy processing (e.g., burning annotations, AI grading)
            await new Promise(resolve => setTimeout(resolve, 5000));

            const submission = await Submission.findByPk(submissionId);
            if (!submission) {
                console.error(`❌ Submission #${submissionId} not found`);
                return;
            }

            // Update submission status
            submission.grade = grade ? Number(grade) : submission.grade;
            submission.feedback = feedback || submission.feedback;
            submission.status = 'graded';
            if (gradedFileUrl) {
                submission.gradedFileUrl = gradedFileUrl;
            }

            await submission.save();
            console.log(`✅ Submission #${submissionId} processed successfully!`);
        } catch (error) {
            console.error(`❌ Error processing submission #${submissionId}:`, error);
        }
    });
};

// Auto-start if imported directly (optional pattern, but keeping simple for now)
startWorker();

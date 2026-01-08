import { MessageQueue } from '@arcane/shared';

const QUEUE_NAME = 'USER_REGISTERED';

export const startUserConsumer = async () => {
    console.log('👤 User Consumer Initializing...');

    await MessageQueue.getInstance().consume(QUEUE_NAME, async (msg: any) => {
        const { id, name, email, role } = msg;
        console.log(`📥 Received USER_REGISTERED event for: ${email} (${role})`);

        // TODO: Create user profile in User Service DB
        // For now, just log it to verify decoupling
        console.log(`✅ User Profile created mock for ${name}`);
    });
};

startUserConsumer();

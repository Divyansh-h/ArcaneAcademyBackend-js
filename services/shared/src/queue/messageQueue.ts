import client, { Channel, Connection, ConsumeMessage } from 'amqplib';

export class MessageQueue {
    private static instance: MessageQueue;
    private connection: any = null;
    private channel: any = null;
    private connected: boolean = false;

    private constructor() { }

    public static getInstance(): MessageQueue {
        if (!MessageQueue.instance) {
            MessageQueue.instance = new MessageQueue();
        }
        return MessageQueue.instance;
    }

    public async connect(url: string): Promise<void> {
        if (this.connected && this.channel) return;

        try {
            console.log(`Connecting to RabbitMQ at ${url}`);
            this.connection = await client.connect(url);
            if (!this.connection) {
                throw new Error("Failed to create connection");
            }
            this.channel = await this.connection.createChannel();
            this.connected = true;
            console.log('✅ Connected to RabbitMQ');
        } catch (error) {
            console.error('❌ Failed to connect to RabbitMQ:', error);
            // Retry logic could be added here
            setTimeout(() => this.connect(url), 5000);
        }
    }

    public async publish(queue: string, message: any): Promise<boolean> {
        if (!this.channel) {
            console.error('RabbitMQ channel not initialized');
            return false;
        }

        try {
            await this.channel.assertQueue(queue, { durable: true });
            const result = this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
                persistent: true,
            });
            console.log(`[MessageQueue] Published to ${queue}: ${result}`);
            return result;
        } catch (error) {
            console.error(`Error publishing to queue ${queue}:`, error);
            return false;
        }
    }

    public async consume(queue: string, onMessage: (msg: any) => Promise<void>): Promise<void> {
        if (!this.channel) {
            console.error('RabbitMQ channel not initialized');
            return;
        }

        try {
            await this.channel.assertQueue(queue, { durable: true });
            await this.channel.consume(queue, async (msg: ConsumeMessage | null) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await onMessage(content);
                        this.channel?.ack(msg);
                    } catch (error) {
                        console.error(`Error processing message from ${queue}:`, error);
                        // Depending on error type, might want to nack or reject
                        this.channel?.nack(msg, false, false); // Fail and don't requeue for now to prevent infinite loops
                    }
                }
            });
            console.log(`Listening on queue: ${queue}`);
        } catch (error) {
            console.error(`Error consuming from queue ${queue}:`, error);
        }
    }
}

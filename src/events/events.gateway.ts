import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*', // Allow all origins for now, restrict in production
    },
    namespace: 'events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-job')
    handleJoinJob(
        @MessageBody() data: { jobId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { jobId } = data;
        client.join(`job:${jobId}`);
        this.logger.log(`Client ${client.id} joined job:${jobId}`);
        return { event: 'joined-job', data: { jobId } };
    }

    // Method to emit progress updates (called from service/processor)
    emitProgress(jobId: string, progress: number, status: string, resultKey?: string) {
        if (this.server) {
            this.server.to(`job:${jobId}`).emit('job-progress', {
                jobId,
                progress,
                status,
                resultKey,
            });
        }
    }
}

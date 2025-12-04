import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinJob(data: {
        jobId: string;
    }, client: Socket): {
        event: string;
        data: {
            jobId: string;
        };
    };
    emitProgress(jobId: string, progress: number, status: string, resultKey?: string): void;
}

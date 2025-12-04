import { HealthCheckService, HealthIndicator, HealthIndicatorResult, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaHealthIndicator extends HealthIndicator {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
export declare class HealthController {
    private health;
    private prismaHealth;
    private memory;
    private disk;
    constructor(health: HealthCheckService, prismaHealth: PrismaHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    ready(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    live(): {
        status: string;
    };
}

import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { MergeService } from './merge.service';
export declare class MergeController {
    private readonly mergeService;
    constructor(mergeService: MergeService);
    createMergeJob(createMergeJobDto: CreateMergeJobDto): Promise<{
        files: import("@prisma/client/runtime/client").JsonValue;
        options: import("@prisma/client/runtime/client").JsonValue | null;
        error: string | null;
        id: string;
        status: import(".prisma/client").$Enums.MergeJobStatus;
        progress: number;
        resultKey: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getJobStatus(id: string): Promise<{
        files: import("@prisma/client/runtime/client").JsonValue;
        options: import("@prisma/client/runtime/client").JsonValue | null;
        error: string | null;
        id: string;
        status: import(".prisma/client").$Enums.MergeJobStatus;
        progress: number;
        resultKey: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDownloadUrl(id: string): Promise<{
        downloadUrl: string;
    }>;
}

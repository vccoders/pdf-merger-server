"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MergeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const s3_service_1 = require("../s3/s3.service");
let MergeService = MergeService_1 = class MergeService {
    constructor(mergeQueue, prisma, s3Service) {
        this.mergeQueue = mergeQueue;
        this.prisma = prisma;
        this.s3Service = s3Service;
        this.logger = new common_1.Logger(MergeService_1.name);
    }
    async createJob(createMergeJobDto) {
        const job = await this.prisma.job.create({
            data: {
                status: client_1.MergeJobStatus.PENDING,
                files: createMergeJobDto.files,
                options: createMergeJobDto.options,
            },
        });
        this.logger.log(`Created job ${job.id} in DB`);
        await this.mergeQueue.add('merge-job', {
            jobId: job.id,
            files: createMergeJobDto.files,
            options: createMergeJobDto.options,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.log(`Enqueued job ${job.id}`);
        return job;
    }
    async getJob(id) {
        return this.prisma.job.findUnique({
            where: { id },
        });
    }
    async getDownloadUrl(id) {
        const job = await this.getJob(id);
        if (!job || !job.resultKey) {
            throw new Error('Job not found or not completed');
        }
        const options = job.options;
        const filename = (options === null || options === void 0 ? void 0 : options.outputFilename) || `merged-${id}.pdf`;
        const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
        const url = await this.s3Service.getSignedDownloadUrl(job.resultKey, 3600, finalFilename);
        return { downloadUrl: url };
    }
};
exports.MergeService = MergeService;
exports.MergeService = MergeService = MergeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('merge-queue')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        s3_service_1.S3Service])
], MergeService);
//# sourceMappingURL=merge.service.js.map
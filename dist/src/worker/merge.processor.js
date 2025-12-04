"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MergeProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const s3_service_1 = require("../s3/s3.service");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const pdf_lib_1 = require("pdf-lib");
const config_1 = require("@nestjs/config");
const events_gateway_1 = require("../events/events.gateway");
let MergeProcessor = MergeProcessor_1 = class MergeProcessor {
    constructor(s3Service, prisma, configService, eventsGateway) {
        this.s3Service = s3Service;
        this.prisma = prisma;
        this.configService = configService;
        this.eventsGateway = eventsGateway;
        this.logger = new common_1.Logger(MergeProcessor_1.name);
        this.tempDir = this.configService.get('TEMP_DIR', './tmp');
        fs.ensureDirSync(this.tempDir);
    }
    async handleMerge(job) {
        const { jobId, files, options } = job.data;
        this.logger.log(`Processing job ${jobId}`);
        const jobDir = path.join(this.tempDir, jobId);
        await fs.ensureDir(jobDir);
        try {
            await this.prisma.job.update({
                where: { id: jobId },
                data: { status: client_1.MergeJobStatus.PROCESSING, progress: 10 },
            });
            this.eventsGateway.emitProgress(jobId, 10, client_1.MergeJobStatus.PROCESSING);
            const localFilePaths = [];
            for (const [index, file] of files.entries()) {
                const localPath = path.join(jobDir, `${index}-${path.basename(file.fileKey)}`);
                await this.s3Service.downloadFile(file.fileKey, localPath);
                localFilePaths.push(localPath);
                const progress = 10 + Math.round(((index + 1) / files.length) * 40);
                await job.progress(progress);
                await this.prisma.job.update({
                    where: { id: jobId },
                    data: { progress },
                });
                this.eventsGateway.emitProgress(jobId, progress, client_1.MergeJobStatus.PROCESSING);
            }
            const mergedPdf = await pdf_lib_1.PDFDocument.create();
            for (const filePath of localFilePaths) {
                const fileBuffer = await fs.readFile(filePath);
                const pdf = await pdf_lib_1.PDFDocument.load(fileBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const mergedPdfBytes = await mergedPdf.save();
            const outputFilename = (options === null || options === void 0 ? void 0 : options.outputFilename) || `merged-${jobId}.pdf`;
            const outputPath = path.join(jobDir, outputFilename);
            await fs.writeFile(outputPath, mergedPdfBytes);
            await job.progress(80);
            await this.prisma.job.update({
                where: { id: jobId },
                data: { progress: 80 },
            });
            this.eventsGateway.emitProgress(jobId, 80, client_1.MergeJobStatus.PROCESSING);
            const resultKey = `merged/${jobId}/${outputFilename}`;
            await this.s3Service.uploadFile(resultKey, outputPath, 'application/pdf');
            await this.prisma.job.update({
                where: { id: jobId },
                data: {
                    status: client_1.MergeJobStatus.COMPLETED,
                    progress: 100,
                    resultKey,
                },
            });
            this.eventsGateway.emitProgress(jobId, 100, client_1.MergeJobStatus.COMPLETED, resultKey);
            this.logger.log(`Job ${jobId} completed successfully`);
        }
        catch (error) {
            const err = error;
            this.logger.error(`Job ${jobId} failed: ${err.message}`, err.stack);
            await this.prisma.job.update({
                where: { id: jobId },
                data: {
                    status: client_1.MergeJobStatus.FAILED,
                    error: err.message,
                },
            });
            this.eventsGateway.emitProgress(jobId, 0, client_1.MergeJobStatus.FAILED);
            throw err;
        }
        finally {
            await fs.remove(jobDir);
        }
    }
};
exports.MergeProcessor = MergeProcessor;
__decorate([
    (0, bull_1.Process)('merge-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MergeProcessor.prototype, "handleMerge", null);
exports.MergeProcessor = MergeProcessor = MergeProcessor_1 = __decorate([
    (0, bull_1.Processor)('merge-queue'),
    __metadata("design:paramtypes", [s3_service_1.S3Service,
        prisma_service_1.PrismaService,
        config_1.ConfigService,
        events_gateway_1.EventsGateway])
], MergeProcessor);
//# sourceMappingURL=merge.processor.js.map
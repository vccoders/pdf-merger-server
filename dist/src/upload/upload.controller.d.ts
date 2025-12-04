import { S3Service } from '../s3/s3.service';
export declare class PresignUploadDto {
    fileName: string;
    fileType: string;
    fileSize?: number;
}
export declare class UploadController {
    private readonly s3Service;
    constructor(s3Service: S3Service);
    getPresignedUrl(dto: PresignUploadDto): Promise<{
        url: string;
        key: string;
        fileId: string;
    }>;
}

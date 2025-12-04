import { Controller, Post, Body } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class PresignUploadDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

@Controller('uploads')
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presign')
  async getPresignedUrl(@Body() dto: PresignUploadDto) {
    const key = `uploads/${Date.now()}-${dto.fileName}`;
    const url = await this.s3Service.getSignedUploadUrl(
      key,
      dto.fileType,
      3600,
      dto.fileSize,
    );

    return {
      url,
      key,
      fileId: key, // Alias for client convenience
    };
  }
}

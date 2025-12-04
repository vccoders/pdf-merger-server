import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class MergeFileDto {
    @IsString()
    fileKey: string;

    @IsNumber()
    order: number;

    @IsOptional()
    @IsString()
    ranges?: string; // e.g., "1-3,5"
}

export enum PageSize {
    A4 = 'A4',
    LETTER = 'Letter',
    ORIGINAL = 'Original',
}

export class MergeOptionsDto {
    @IsOptional()
    @IsString()
    outputFilename?: string;

    @IsOptional()
    @IsEnum(PageSize)
    pageSize?: PageSize;

    @IsOptional()
    @IsBoolean()
    optimize?: boolean;
}

export class CreateMergeJobDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MergeFileDto)
    files: MergeFileDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => MergeOptionsDto)
    options?: MergeOptionsDto;
}

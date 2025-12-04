export declare class MergeFileDto {
    fileKey: string;
    order: number;
    ranges?: string;
}
export declare enum PageSize {
    A4 = "A4",
    LETTER = "Letter",
    ORIGINAL = "Original"
}
export declare class MergeOptionsDto {
    outputFilename?: string;
    pageSize?: PageSize;
    optimize?: boolean;
}
export declare class CreateMergeJobDto {
    files: MergeFileDto[];
    options?: MergeOptionsDto;
}

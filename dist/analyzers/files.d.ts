import { FileInfo } from '../utils/files';
export interface LargestFile {
    path: string;
    lines: number;
    size: number;
}
export interface FolderStats {
    path: string;
    fileCount: number;
    totalLines: number;
}
export interface FileAnalysisResult {
    largestFiles: LargestFile[];
    folderStats: FolderStats[];
    totalFiles: number;
    totalSize: number;
}
export declare function analyzeFiles(files: FileInfo[], topN?: number): FileAnalysisResult;
export declare function formatBytes(bytes: number): string;
//# sourceMappingURL=files.d.ts.map
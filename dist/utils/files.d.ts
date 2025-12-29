export interface FileInfo {
    path: string;
    relativePath: string;
    extension: string;
    language: string;
    size: number;
}
export declare function getLanguageFromExtension(ext: string): string;
export declare function walkFiles(targetPath: string, ignorePatterns?: string[]): Promise<FileInfo[]>;
//# sourceMappingURL=files.d.ts.map
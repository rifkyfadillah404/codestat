import { FileInfo } from '../utils/files';
import { ParseResult } from '../parsers/generic';
export interface LanguageStats extends ParseResult {
    language: string;
    files: number;
}
export interface LOCResult {
    byLanguage: LanguageStats[];
    totals: {
        files: number;
        code: number;
        comments: number;
        blank: number;
        total: number;
    };
}
export declare function analyzeLOC(files: FileInfo[]): LOCResult;
//# sourceMappingURL=loc.d.ts.map
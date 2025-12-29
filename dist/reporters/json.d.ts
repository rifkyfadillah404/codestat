import { LOCResult } from '../analyzers/loc';
import { FileAnalysisResult } from '../analyzers/files';
export interface JsonReportData {
    projectName: string;
    generatedAt: string;
    loc: LOCResult;
    files: FileAnalysisResult;
}
export declare function renderJsonReport(data: {
    projectName: string;
    loc: LOCResult;
    files: FileAnalysisResult;
}): string;
//# sourceMappingURL=json.d.ts.map
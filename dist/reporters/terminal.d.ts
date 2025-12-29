import { LOCResult } from '../analyzers/loc';
import { FileAnalysisResult } from '../analyzers/files';
export interface ReportData {
    projectName: string;
    loc: LOCResult;
    files: FileAnalysisResult;
}
export declare function renderTerminalReport(data: ReportData): void;
//# sourceMappingURL=terminal.d.ts.map
import { LOCResult } from '../analyzers/loc';
import { FileAnalysisResult } from '../analyzers/files';

export interface JsonReportData {
  projectName: string;
  generatedAt: string;
  loc: LOCResult;
  files: FileAnalysisResult;
}

export function renderJsonReport(data: {
  projectName: string;
  loc: LOCResult;
  files: FileAnalysisResult;
}): string {
  const output: JsonReportData = {
    projectName: data.projectName,
    generatedAt: new Date().toISOString(),
    loc: data.loc,
    files: data.files,
  };

  return JSON.stringify(output, null, 2);
}

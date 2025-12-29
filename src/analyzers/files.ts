import * as fs from 'fs';
import * as path from 'path';
import { FileInfo } from '../utils/files';
import { parseContent } from '../parsers/generic';

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

export function analyzeFiles(files: FileInfo[], topN: number = 10): FileAnalysisResult {
  const fileLines: LargestFile[] = [];
  const folderMap = new Map<string, { fileCount: number; totalLines: number }>();
  let totalSize = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const lines = content.split('\n').length;
      
      fileLines.push({
        path: file.relativePath,
        lines,
        size: file.size,
      });

      totalSize += file.size;

      const folder = path.dirname(file.relativePath);
      const existing = folderMap.get(folder);
      if (existing) {
        existing.fileCount += 1;
        existing.totalLines += lines;
      } else {
        folderMap.set(folder, { fileCount: 1, totalLines: lines });
      }
    } catch {
      // Skip files that can't be read
    }
  }

  const largestFiles = fileLines
    .sort((a, b) => b.lines - a.lines)
    .slice(0, topN);

  const folderStats = Array.from(folderMap.entries())
    .map(([folderPath, stats]) => ({
      path: folderPath,
      fileCount: stats.fileCount,
      totalLines: stats.totalLines,
    }))
    .sort((a, b) => b.fileCount - a.fileCount)
    .slice(0, topN);

  return {
    largestFiles,
    folderStats,
    totalFiles: files.length,
    totalSize,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

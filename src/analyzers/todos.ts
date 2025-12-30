import * as fs from 'fs';
import { FileInfo } from '../utils/files';

export interface TodoItem {
  type: 'TODO' | 'FIXME' | 'HACK' | 'XXX' | 'BUG' | 'NOTE';
  text: string;
  file: string;
  line: number;
}

export interface TodoResult {
  items: TodoItem[];
  byType: Record<string, number>;
  byFile: { file: string; count: number }[];
  total: number;
}

const TODO_PATTERNS = [
  { type: 'TODO' as const, pattern: /(?:\/\/|#|\/\*|<!--)\s*TODO[:\s](.+?)(?:\*\/|-->)?$/i },
  { type: 'FIXME' as const, pattern: /(?:\/\/|#|\/\*|<!--)\s*FIXME[:\s](.+?)(?:\*\/|-->)?$/i },
  { type: 'HACK' as const, pattern: /(?:\/\/|#|\/\*|<!--)\s*HACK[:\s](.+?)(?:\*\/|-->)?$/i },
  { type: 'XXX' as const, pattern: /(?:\/\/|#|\/\*|<!--)\s*XXX[:\s](.+?)(?:\*\/|-->)?$/i },
  { type: 'BUG' as const, pattern: /(?:\/\/|#|\/\*|<!--)\s*BUG[:\s](.+?)(?:\*\/|-->)?$/i },
  { type: 'NOTE' as const, pattern: /(?:\/\/|#|\/\*|<!--)\s*NOTE[:\s](.+?)(?:\*\/|-->)?$/i },
];

export function analyzeTodos(files: FileInfo[], topN: number = 15): TodoResult {
  const items: TodoItem[] = [];
  const fileCountMap = new Map<string, number>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const { type, pattern } of TODO_PATTERNS) {
          const match = line.match(pattern);
          if (match) {
            items.push({
              type,
              text: match[1]?.trim() || line.trim(),
              file: file.relativePath,
              line: index + 1,
            });
            fileCountMap.set(file.relativePath, (fileCountMap.get(file.relativePath) || 0) + 1);
            break;
          }
        }
      });
    } catch {
      // Skip files that can't be read
    }
  }

  const byType: Record<string, number> = {};
  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
  }

  const byFile = Array.from(fileCountMap.entries())
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return {
    items: items.slice(0, 100),
    byType,
    byFile,
    total: items.length,
  };
}

import * as fs from 'fs';
import { FileInfo } from '../utils/files';
import { parseContent, ParseResult } from '../parsers/generic';

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

export function analyzeLOC(files: FileInfo[]): LOCResult {
  const languageMap = new Map<string, LanguageStats>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const result = parseContent(content, file.language);

      const existing = languageMap.get(file.language);
      if (existing) {
        existing.code += result.code;
        existing.comments += result.comments;
        existing.blank += result.blank;
        existing.total += result.total;
        existing.files += 1;
      } else {
        languageMap.set(file.language, {
          language: file.language,
          code: result.code,
          comments: result.comments,
          blank: result.blank,
          total: result.total,
          files: 1,
        });
      }
    } catch {
      // Skip files that can't be read
    }
  }

  const byLanguage = Array.from(languageMap.values()).sort(
    (a, b) => b.code - a.code
  );

  const totals = byLanguage.reduce(
    (acc, lang) => ({
      files: acc.files + lang.files,
      code: acc.code + lang.code,
      comments: acc.comments + lang.comments,
      blank: acc.blank + lang.blank,
      total: acc.total + lang.total,
    }),
    { files: 0, code: 0, comments: 0, blank: 0, total: 0 }
  );

  return { byLanguage, totals };
}

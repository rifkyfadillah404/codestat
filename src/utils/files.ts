import fg from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';

export interface FileInfo {
  path: string;
  relativePath: string;
  extension: string;
  language: string;
  size: number;
}

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.go': 'Go',
  '.rs': 'Rust',
  '.c': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.h': 'C/C++ Header',
  '.hpp': 'C++ Header',
  '.cs': 'C#',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.scala': 'Scala',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'Sass',
  '.less': 'Less',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.xml': 'XML',
  '.md': 'Markdown',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.ps1': 'PowerShell',
  '.r': 'R',
  '.lua': 'Lua',
  '.dart': 'Dart',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.erl': 'Erlang',
  '.hs': 'Haskell',
  '.clj': 'Clojure',
  '.elm': 'Elm',
  '.graphql': 'GraphQL',
  '.gql': 'GraphQL',
  '.proto': 'Protocol Buffers',
  '.tf': 'Terraform',
  '.dockerfile': 'Dockerfile',
};

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/vendor/**',
  '**/__pycache__/**',
  '**/venv/**',
  '**/.venv/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/target/**',
  '**/bin/**',
  '**/obj/**',
];

export function getLanguageFromExtension(ext: string): string {
  return EXTENSION_TO_LANGUAGE[ext.toLowerCase()] || 'Other';
}

export async function walkFiles(
  targetPath: string,
  ignorePatterns: string[] = []
): Promise<FileInfo[]> {
  const absolutePath = path.resolve(targetPath);
  
  const files = await fg('**/*', {
    cwd: absolutePath,
    onlyFiles: true,
    dot: false,
    ignore: [...DEFAULT_IGNORE, ...ignorePatterns],
    absolute: true,
  });

  const fileInfos: FileInfo[] = [];

  for (const filePath of files) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath);
      
      fileInfos.push({
        path: filePath,
        relativePath: path.relative(absolutePath, filePath),
        extension: ext,
        language: getLanguageFromExtension(ext),
        size: stats.size,
      });
    } catch {
      // Skip files that can't be read
    }
  }

  return fileInfos;
}

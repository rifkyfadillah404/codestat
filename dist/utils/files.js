"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLanguageFromExtension = getLanguageFromExtension;
exports.walkFiles = walkFiles;
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const EXTENSION_TO_LANGUAGE = {
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
function getLanguageFromExtension(ext) {
    return EXTENSION_TO_LANGUAGE[ext.toLowerCase()] || 'Other';
}
async function walkFiles(targetPath, ignorePatterns = []) {
    const absolutePath = path.resolve(targetPath);
    const files = await (0, fast_glob_1.default)('**/*', {
        cwd: absolutePath,
        onlyFiles: true,
        dot: false,
        ignore: [...DEFAULT_IGNORE, ...ignorePatterns],
        absolute: true,
    });
    const fileInfos = [];
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
        }
        catch {
            // Skip files that can't be read
        }
    }
    return fileInfos;
}
//# sourceMappingURL=files.js.map
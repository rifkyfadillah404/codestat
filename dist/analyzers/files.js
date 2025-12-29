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
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFiles = analyzeFiles;
exports.formatBytes = formatBytes;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function analyzeFiles(files, topN = 10) {
    const fileLines = [];
    const folderMap = new Map();
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
            }
            else {
                folderMap.set(folder, { fileCount: 1, totalLines: lines });
            }
        }
        catch {
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
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
//# sourceMappingURL=files.js.map
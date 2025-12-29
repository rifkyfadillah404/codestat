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
exports.analyzeLOC = analyzeLOC;
const fs = __importStar(require("fs"));
const generic_1 = require("../parsers/generic");
function analyzeLOC(files) {
    const languageMap = new Map();
    for (const file of files) {
        try {
            const content = fs.readFileSync(file.path, 'utf-8');
            const result = (0, generic_1.parseContent)(content, file.language);
            const existing = languageMap.get(file.language);
            if (existing) {
                existing.code += result.code;
                existing.comments += result.comments;
                existing.blank += result.blank;
                existing.total += result.total;
                existing.files += 1;
            }
            else {
                languageMap.set(file.language, {
                    language: file.language,
                    code: result.code,
                    comments: result.comments,
                    blank: result.blank,
                    total: result.total,
                    files: 1,
                });
            }
        }
        catch {
            // Skip files that can't be read
        }
    }
    const byLanguage = Array.from(languageMap.values()).sort((a, b) => b.code - a.code);
    const totals = byLanguage.reduce((acc, lang) => ({
        files: acc.files + lang.files,
        code: acc.code + lang.code,
        comments: acc.comments + lang.comments,
        blank: acc.blank + lang.blank,
        total: acc.total + lang.total,
    }), { files: 0, code: 0, comments: 0, blank: 0, total: 0 });
    return { byLanguage, totals };
}
//# sourceMappingURL=loc.js.map
#!/usr/bin/env node
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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const files_1 = require("./utils/files");
const loc_1 = require("./analyzers/loc");
const files_2 = require("./analyzers/files");
const terminal_1 = require("./reporters/terminal");
const json_1 = require("./reporters/json");
const dashboard_1 = require("./dashboard");
const program = new commander_1.Command();
program
    .name('codestat')
    .description('CLI tool untuk analisis codebase - LOC, file stats, dan lainnya')
    .version('1.0.0')
    .argument('[path]', 'Path to the codebase to analyze')
    .option('-f, --format <format>', 'Output format: terminal, json', 'terminal')
    .option('-o, --output <file>', 'Write output to file')
    .option('-i, --ignore <patterns>', 'Comma-separated glob patterns to ignore')
    .option('-l, --lang <languages>', 'Comma-separated list of languages to include')
    .option('-t, --top <number>', 'Number of top items to show', '10')
    .option('-d, --dashboard', 'Run in dashboard mode with modern TUI')
    .action(async (targetPath, options) => {
    // If --dashboard flag or no path, run dashboard mode
    if (options.dashboard || !targetPath) {
        await (0, dashboard_1.runDashboard)(targetPath);
        return;
    }
    try {
        const absolutePath = path.resolve(targetPath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`Error: Path "${absolutePath}" does not exist`);
            process.exit(1);
        }
        const projectName = path.basename(absolutePath);
        const ignorePatterns = options.ignore
            ? options.ignore.split(',').map((p) => p.trim())
            : [];
        const topN = parseInt(options.top, 10) || 10;
        // Walk files
        let files = await (0, files_1.walkFiles)(absolutePath, ignorePatterns);
        // Filter by language if specified
        if (options.lang) {
            const langs = options.lang.split(',').map((l) => l.trim().toLowerCase());
            files = files.filter(f => langs.some((l) => f.language.toLowerCase().includes(l)));
        }
        if (files.length === 0) {
            console.error('No files found to analyze');
            process.exit(1);
        }
        // Analyze
        const locResult = (0, loc_1.analyzeLOC)(files);
        const fileResult = (0, files_2.analyzeFiles)(files, topN);
        const reportData = {
            projectName,
            loc: locResult,
            files: fileResult,
        };
        // Output
        if (options.format === 'json') {
            const jsonOutput = (0, json_1.renderJsonReport)(reportData);
            if (options.output) {
                fs.writeFileSync(options.output, jsonOutput);
                console.log(`Report written to ${options.output}`);
            }
            else {
                console.log(jsonOutput);
            }
        }
        else {
            (0, terminal_1.renderTerminalReport)(reportData);
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map
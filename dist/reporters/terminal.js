"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTerminalReport = renderTerminalReport;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const files_1 = require("../analyzers/files");
function formatNumber(num) {
    return num.toLocaleString();
}
function renderTerminalReport(data) {
    const { projectName, loc, files } = data;
    console.log();
    console.log(chalk_1.default.bold.cyan(`  Codebase Statistics: ${projectName}`));
    console.log(chalk_1.default.gray('  ' + '='.repeat(50)));
    console.log();
    // Overview
    console.log(chalk_1.default.bold.white('  Overview'));
    console.log(chalk_1.default.gray(`     Total Files:    ${formatNumber(files.totalFiles)}`));
    console.log(chalk_1.default.gray(`     Total Lines:    ${formatNumber(loc.totals.total)}`));
    console.log(chalk_1.default.gray(`     Total Size:     ${(0, files_1.formatBytes)(files.totalSize)}`));
    console.log(chalk_1.default.gray(`     Languages:      ${loc.byLanguage.length}`));
    console.log();
    // LOC Table
    console.log(chalk_1.default.bold.white('  Lines of Code'));
    const locTable = new cli_table3_1.default({
        head: [
            chalk_1.default.white('Language'),
            chalk_1.default.white('Files'),
            chalk_1.default.white('Code'),
            chalk_1.default.white('Comments'),
            chalk_1.default.white('Blank'),
        ],
        style: { head: [], border: ['gray'] },
        chars: {
            'top': '-', 'top-mid': '+', 'top-left': '  +', 'top-right': '+',
            'bottom': '-', 'bottom-mid': '+', 'bottom-left': '  +', 'bottom-right': '+',
            'left': '  |', 'left-mid': '  +', 'mid': '-', 'mid-mid': '+',
            'right': '|', 'right-mid': '+', 'middle': '|'
        },
    });
    for (const lang of loc.byLanguage.slice(0, 15)) {
        locTable.push([
            chalk_1.default.yellow(lang.language),
            formatNumber(lang.files),
            chalk_1.default.green(formatNumber(lang.code)),
            chalk_1.default.blue(formatNumber(lang.comments)),
            chalk_1.default.gray(formatNumber(lang.blank)),
        ]);
    }
    // Totals row
    locTable.push([
        chalk_1.default.bold('Total'),
        chalk_1.default.bold(formatNumber(loc.totals.files)),
        chalk_1.default.bold.green(formatNumber(loc.totals.code)),
        chalk_1.default.bold.blue(formatNumber(loc.totals.comments)),
        chalk_1.default.bold.gray(formatNumber(loc.totals.blank)),
    ]);
    console.log(locTable.toString());
    console.log();
    // Largest Files
    console.log(chalk_1.default.bold.white('  Largest Files'));
    for (let i = 0; i < files.largestFiles.length; i++) {
        const file = files.largestFiles[i];
        const num = chalk_1.default.gray(`${i + 1}.`);
        const filePath = chalk_1.default.yellow(file.path);
        const lines = chalk_1.default.cyan(`(${formatNumber(file.lines)} lines)`);
        console.log(`     ${num} ${filePath} ${lines}`);
    }
    console.log();
    // Top Folders
    console.log(chalk_1.default.bold.white('  Top Folders by File Count'));
    for (let i = 0; i < Math.min(5, files.folderStats.length); i++) {
        const folder = files.folderStats[i];
        const num = chalk_1.default.gray(`${i + 1}.`);
        const folderPath = chalk_1.default.yellow(folder.path || '.');
        const count = chalk_1.default.cyan(`(${folder.fileCount} files)`);
        console.log(`     ${num} ${folderPath} ${count}`);
    }
    console.log();
}
//# sourceMappingURL=terminal.js.map
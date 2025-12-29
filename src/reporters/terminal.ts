import chalk from 'chalk';
import Table from 'cli-table3';
import { LOCResult } from '../analyzers/loc';
import { FileAnalysisResult, formatBytes } from '../analyzers/files';

export interface ReportData {
  projectName: string;
  loc: LOCResult;
  files: FileAnalysisResult;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function renderTerminalReport(data: ReportData): void {
  const { projectName, loc, files } = data;

  console.log();
  console.log(chalk.bold.cyan(`  Codebase Statistics: ${projectName}`));
  console.log(chalk.gray('  ' + '='.repeat(50)));
  console.log();

  // Overview
  console.log(chalk.bold.white('  Overview'));
  console.log(chalk.gray(`     Total Files:    ${formatNumber(files.totalFiles)}`));
  console.log(chalk.gray(`     Total Lines:    ${formatNumber(loc.totals.total)}`));
  console.log(chalk.gray(`     Total Size:     ${formatBytes(files.totalSize)}`));
  console.log(chalk.gray(`     Languages:      ${loc.byLanguage.length}`));
  console.log();

  // LOC Table
  console.log(chalk.bold.white('  Lines of Code'));
  const locTable = new Table({
    head: [
      chalk.white('Language'),
      chalk.white('Files'),
      chalk.white('Code'),
      chalk.white('Comments'),
      chalk.white('Blank'),
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
      chalk.yellow(lang.language),
      formatNumber(lang.files),
      chalk.green(formatNumber(lang.code)),
      chalk.blue(formatNumber(lang.comments)),
      chalk.gray(formatNumber(lang.blank)),
    ]);
  }

  // Totals row
  locTable.push([
    chalk.bold('Total'),
    chalk.bold(formatNumber(loc.totals.files)),
    chalk.bold.green(formatNumber(loc.totals.code)),
    chalk.bold.blue(formatNumber(loc.totals.comments)),
    chalk.bold.gray(formatNumber(loc.totals.blank)),
  ]);

  console.log(locTable.toString());
  console.log();

  // Largest Files
  console.log(chalk.bold.white('  Largest Files'));
  for (let i = 0; i < files.largestFiles.length; i++) {
    const file = files.largestFiles[i];
    const num = chalk.gray(`${i + 1}.`);
    const filePath = chalk.yellow(file.path);
    const lines = chalk.cyan(`(${formatNumber(file.lines)} lines)`);
    console.log(`     ${num} ${filePath} ${lines}`);
  }
  console.log();

  // Top Folders
  console.log(chalk.bold.white('  Top Folders by File Count'));
  for (let i = 0; i < Math.min(5, files.folderStats.length); i++) {
    const folder = files.folderStats[i];
    const num = chalk.gray(`${i + 1}.`);
    const folderPath = chalk.yellow(folder.path || '.');
    const count = chalk.cyan(`(${folder.fileCount} files)`);
    console.log(`     ${num} ${folderPath} ${count}`);
  }
  console.log();
}

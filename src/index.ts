#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { walkFiles } from './utils/files';
import { analyzeLOC } from './analyzers/loc';
import { analyzeFiles } from './analyzers/files';
import { renderTerminalReport } from './reporters/terminal';
import { renderJsonReport } from './reporters/json';

const program = new Command();

program
  .name('codestat')
  .description('CLI tool untuk analisis codebase - LOC, file stats, dan lainnya')
  .version('1.0.0')
  .argument('[path]', 'Path to the codebase to analyze', '.')
  .option('-f, --format <format>', 'Output format: terminal, json', 'terminal')
  .option('-o, --output <file>', 'Write output to file')
  .option('-i, --ignore <patterns>', 'Comma-separated glob patterns to ignore')
  .option('-l, --lang <languages>', 'Comma-separated list of languages to include')
  .option('-t, --top <number>', 'Number of top items to show', '10')
  .action(async (targetPath: string, options) => {
    try {
      const absolutePath = path.resolve(targetPath);
      
      if (!fs.existsSync(absolutePath)) {
        console.error(`Error: Path "${absolutePath}" does not exist`);
        process.exit(1);
      }

      const projectName = path.basename(absolutePath);
      const ignorePatterns = options.ignore 
        ? options.ignore.split(',').map((p: string) => p.trim())
        : [];
      const topN = parseInt(options.top, 10) || 10;

      // Walk files
      let files = await walkFiles(absolutePath, ignorePatterns);

      // Filter by language if specified
      if (options.lang) {
        const langs: string[] = options.lang.split(',').map((l: string) => l.trim().toLowerCase());
        files = files.filter(f => 
          langs.some((l: string) => f.language.toLowerCase().includes(l))
        );
      }

      if (files.length === 0) {
        console.error('No files found to analyze');
        process.exit(1);
      }

      // Analyze
      const locResult = analyzeLOC(files);
      const fileResult = analyzeFiles(files, topN);

      const reportData = {
        projectName,
        loc: locResult,
        files: fileResult,
      };

      // Output
      if (options.format === 'json') {
        const jsonOutput = renderJsonReport(reportData);
        if (options.output) {
          fs.writeFileSync(options.output, jsonOutput);
          console.log(`Report written to ${options.output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        renderTerminalReport(reportData);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

import inquirer from 'inquirer';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { walkFiles } from './utils/files';
import { analyzeLOC } from './analyzers/loc';
import { analyzeFiles } from './analyzers/files';
import { renderTerminalReport } from './reporters/terminal';
import { renderJsonReport } from './reporters/json';

interface InteractiveOptions {
  targetPath: string;
  format: 'terminal' | 'json';
  outputFile?: string;
  languages?: string[];
  ignorePatterns?: string[];
  topN: number;
}

async function selectPath(): Promise<string> {
  const { pathChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'pathChoice',
      message: 'Pilih folder yang mau di-scan:',
      choices: [
        { name: '📁 Current directory (.)', value: '.' },
        { name: '📂 Pilih folder lain...', value: 'custom' },
      ],
    },
  ]);

  if (pathChoice === 'custom') {
    const { customPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customPath',
        message: 'Masukkan path folder:',
        validate: (input: string) => {
          if (!input.trim()) return 'Path tidak boleh kosong';
          if (!fs.existsSync(input)) return 'Folder tidak ditemukan';
          return true;
        },
      },
    ]);
    return customPath;
  }

  return pathChoice;
}

async function selectOptions(): Promise<Partial<InteractiveOptions>> {
  const { wantOptions } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'wantOptions',
      message: 'Mau atur opsi tambahan?',
      default: false,
    },
  ]);

  if (!wantOptions) {
    return { format: 'terminal', topN: 10 };
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Output format:',
      choices: [
        { name: '🖥️  Terminal (colorful)', value: 'terminal' },
        { name: '📄 JSON', value: 'json' },
      ],
    },
    {
      type: 'confirm',
      name: 'saveToFile',
      message: 'Simpan hasil ke file?',
      default: false,
      when: (ans: { format: string }) => ans.format === 'json',
    },
    {
      type: 'input',
      name: 'outputFile',
      message: 'Nama file output:',
      default: 'codestat-report.json',
      when: (ans: { saveToFile: boolean }) => ans.saveToFile,
    },
    {
      type: 'input',
      name: 'topN',
      message: 'Jumlah top files yang ditampilkan:',
      default: '10',
      validate: (input: string) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1) return 'Harus angka positif';
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'filterLang',
      message: 'Filter bahasa tertentu?',
      default: false,
    },
    {
      type: 'checkbox',
      name: 'languages',
      message: 'Pilih bahasa:',
      choices: [
        { name: 'TypeScript', value: 'typescript' },
        { name: 'JavaScript', value: 'javascript' },
        { name: 'Python', value: 'python' },
        { name: 'Go', value: 'go' },
        { name: 'Rust', value: 'rust' },
        { name: 'Java', value: 'java' },
        { name: 'C/C++', value: 'c' },
        { name: 'Ruby', value: 'ruby' },
        { name: 'PHP', value: 'php' },
        { name: 'CSS/SCSS', value: 'css' },
        { name: 'HTML', value: 'html' },
      ],
      when: (ans: { filterLang: boolean }) => ans.filterLang,
    },
    {
      type: 'input',
      name: 'ignoreInput',
      message: 'Pattern yang di-ignore (pisah koma, kosongkan jika tidak ada):',
      default: '',
    },
  ]);

  interface AnswersType {
    format: 'terminal' | 'json';
    outputFile?: string;
    topN: string;
    languages?: string[];
    ignoreInput?: string;
  }
  const typedAnswers = answers as AnswersType;

  return {
    format: typedAnswers.format,
    outputFile: typedAnswers.outputFile,
    topN: parseInt(typedAnswers.topN) || 10,
    languages: typedAnswers.languages?.length ? typedAnswers.languages : undefined,
    ignorePatterns: typedAnswers.ignoreInput
      ? typedAnswers.ignoreInput.split(',').map((p: string) => p.trim()).filter(Boolean)
      : undefined,
  };
}

export async function runInteractive(): Promise<void> {
  console.log();
  console.log(chalk.bold.cyan('  ╔═══════════════════════════════════╗'));
  console.log(chalk.bold.cyan('  ║') + chalk.bold.white('     CODESTAT - Codebase Analyzer  ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('  ╚═══════════════════════════════════╝'));
  console.log();

  try {
    // Select path
    const targetPath = await selectPath();
    const absolutePath = path.resolve(targetPath);
    const projectName = path.basename(absolutePath);

    // Select options
    const options = await selectOptions();

    console.log();
    const spinner = ora({
      text: chalk.yellow(`Scanning ${projectName}...`),
      spinner: 'dots',
    }).start();

    // Walk files
    let files = await walkFiles(absolutePath, options.ignorePatterns || []);

    // Filter by language
    if (options.languages && options.languages.length > 0) {
      files = files.filter((f) =>
        options.languages!.some((l) => f.language.toLowerCase().includes(l))
      );
    }

    if (files.length === 0) {
      spinner.fail(chalk.red('Tidak ada file yang ditemukan!'));
      return;
    }

    spinner.text = chalk.yellow(`Analyzing ${files.length} files...`);

    // Analyze
    const locResult = analyzeLOC(files);
    const fileResult = analyzeFiles(files, options.topN || 10);

    spinner.succeed(chalk.green(`Selesai! ${files.length} files analyzed.`));

    const reportData = {
      projectName,
      loc: locResult,
      files: fileResult,
    };

    // Output
    if (options.format === 'json') {
      const jsonOutput = renderJsonReport(reportData);
      if (options.outputFile) {
        fs.writeFileSync(options.outputFile, jsonOutput);
        console.log(chalk.green(`\n✅ Report saved to ${options.outputFile}`));
      } else {
        console.log(jsonOutput);
      }
    } else {
      renderTerminalReport(reportData);
    }

    // Ask for next action
    const { nextAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'nextAction',
        message: 'Mau ngapain lagi?',
        choices: [
          { name: '🔄 Scan folder lain', value: 'rescan' },
          { name: '💾 Export hasil ke JSON', value: 'export' },
          { name: '👋 Exit', value: 'exit' },
        ],
      },
    ]);

    if (nextAction === 'rescan') {
      await runInteractive();
    } else if (nextAction === 'export') {
      const { exportPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'exportPath',
          message: 'Nama file:',
          default: `${projectName}-codestat.json`,
        },
      ]);
      fs.writeFileSync(exportPath, renderJsonReport(reportData));
      console.log(chalk.green(`\n✅ Exported to ${exportPath}`));
    }

    console.log(chalk.cyan('\n👋 Thanks for using codestat!\n'));
  } catch (error) {
    if ((error as Error).name === 'ExitPromptError') {
      console.log(chalk.yellow('\n👋 Cancelled by user\n'));
    } else {
      throw error;
    }
  }
}

import blessed from 'blessed';
import * as path from 'path';
import * as fs from 'fs';
import { walkFiles } from './utils/files';
import { analyzeLOC, LOCResult } from './analyzers/loc';
import { analyzeFiles, FileAnalysisResult, formatBytes } from './analyzers/files';

interface DashboardData {
  projectName: string;
  loc: LOCResult;
  files: FileAnalysisResult;
}

const LOGO = `
 ██████╗ ██████╗ ██████╗ ███████╗███████╗████████╗ █████╗ ████████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝
██║     ██║   ██║██║  ██║█████╗  ███████╗   ██║   ███████║   ██║   
██║     ██║   ██║██║  ██║██╔══╝  ╚════██║   ██║   ██╔══██║   ██║   
╚██████╗╚██████╔╝██████╔╝███████╗███████║   ██║   ██║  ██║   ██║   
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   
`;

const SMALL_LOGO = `┌─────────────────────────────────┐
│   CODESTAT - Codebase Analyzer  │
└─────────────────────────────────┘`;

function createProgressBar(percent: number, width: number, color: string): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `{${color}-fg}${bar}{/${color}-fg}`;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str.padEnd(len);
  return '...' + str.slice(-(len - 3));
}

export async function runDashboard(targetPath?: string): Promise<void> {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'CODESTAT',
    fullUnicode: true,
  });

  // Header box with big logo
  const header = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 8,
    content: `{center}{cyan-fg}${LOGO}{/cyan-fg}{/center}`,
    tags: true,
    style: {
      fg: 'cyan',
    },
  });

  // Overview panel
  const overview = blessed.box({
    parent: screen,
    label: ' {bold}{cyan-fg}Overview{/cyan-fg}{/bold} ',
    top: 8,
    left: 0,
    width: '25%',
    height: '35%',
    border: { type: 'line' },
    tags: true,
    padding: { left: 1, right: 1, top: 0 },
    style: {
      border: { fg: 'cyan' },
    },
  });

  // Languages panel
  const languages = blessed.box({
    parent: screen,
    label: ' {bold}{cyan-fg}Languages{/cyan-fg}{/bold} ',
    top: 8,
    left: '25%',
    width: '40%',
    height: '35%',
    border: { type: 'line' },
    tags: true,
    padding: { left: 1, right: 1, top: 0 },
    style: {
      border: { fg: 'cyan' },
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      style: { bg: 'cyan' },
    },
  });

  // LOC breakdown panel
  const locBreakdown = blessed.box({
    parent: screen,
    label: ' {bold}{cyan-fg}LOC Breakdown{/cyan-fg}{/bold} ',
    top: 8,
    left: '65%',
    width: '35%',
    height: '35%',
    border: { type: 'line' },
    tags: true,
    padding: { left: 1, right: 1, top: 0 },
    style: {
      border: { fg: 'cyan' },
    },
  });

  // Largest files panel
  const filesPanel = blessed.list({
    parent: screen,
    label: ' {bold}{cyan-fg}Largest Files{/cyan-fg}{/bold} ',
    top: '43%',
    left: 0,
    width: '50%',
    height: '45%',
    border: { type: 'line' },
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    style: {
      border: { fg: 'cyan' },
      selected: { bg: 'cyan', fg: 'black', bold: true },
      item: { fg: 'white' },
    },
    scrollbar: {
      style: { bg: 'cyan' },
    },
  });

  // Folders panel
  const foldersPanel = blessed.list({
    parent: screen,
    label: ' {bold}{cyan-fg}Top Folders{/cyan-fg}{/bold} ',
    top: '43%',
    left: '50%',
    width: '50%',
    height: '45%',
    border: { type: 'line' },
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    style: {
      border: { fg: 'cyan' },
      selected: { bg: 'cyan', fg: 'black', bold: true },
      item: { fg: 'white' },
    },
    scrollbar: {
      style: { bg: 'cyan' },
    },
  });

  // Status bar
  const statusBar = blessed.box({
    parent: screen,
    bottom: 1,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue',
    },
    padding: { left: 1 },
  });

  // Help bar
  const helpBar = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' {bold}Q{/bold} Quit │ {bold}R{/bold} Refresh │ {bold}S{/bold} Scan Path │ {bold}E{/bold} Export │ {bold}Tab{/bold} Switch Panel │ {bold}↑↓{/bold} Navigate',
    tags: true,
    style: {
      fg: 'white',
      bg: '#333',
    },
  });

  let currentData: DashboardData | null = null;
  let currentFocus = 0;
  const focusables = [filesPanel, foldersPanel];
  let isScanning = false;

  function updateDashboard(data: DashboardData) {
    currentData = data;
    const { projectName, loc, files } = data;

    // Update overview
    overview.setContent(
      `{bold}{white-fg}Project:{/white-fg}{/bold}\n` +
      `  {cyan-fg}${projectName}{/cyan-fg}\n\n` +
      `{bold}{white-fg}Statistics:{/white-fg}{/bold}\n` +
      `  Files:     {green-fg}${files.totalFiles.toLocaleString()}{/green-fg}\n` +
      `  Size:      {green-fg}${formatBytes(files.totalSize)}{/green-fg}\n` +
      `  Languages: {green-fg}${loc.byLanguage.length}{/green-fg}\n\n` +
      `{bold}{white-fg}Lines:{/white-fg}{/bold}\n` +
      `  Total:     {yellow-fg}${loc.totals.total.toLocaleString()}{/yellow-fg}\n` +
      `  Code:      {green-fg}${loc.totals.code.toLocaleString()}{/green-fg}\n` +
      `  Comments:  {blue-fg}${loc.totals.comments.toLocaleString()}{/blue-fg}\n` +
      `  Blank:     {gray-fg}${loc.totals.blank.toLocaleString()}{/gray-fg}`
    );

    // Update languages with progress bars
    const langColors = ['green', 'yellow', 'blue', 'magenta', 'cyan', 'red', 'white'];
    let langContent = '{bold}Language         Files    Code    %{/bold}\n';
    langContent += '─'.repeat(40) + '\n';
    
    loc.byLanguage.slice(0, 12).forEach((lang, i) => {
      const percent = Math.round((lang.code / loc.totals.code) * 100) || 0;
      const color = langColors[i % langColors.length];
      const name = lang.language.substring(0, 12).padEnd(12);
      const fileCount = lang.files.toString().padStart(5);
      const codeCount = lang.code.toLocaleString().padStart(8);
      const bar = createProgressBar(percent, 15, color);
      langContent += `{${color}-fg}${name}{/${color}-fg} ${fileCount} ${codeCount} ${bar} ${percent}%\n`;
    });
    languages.setContent(langContent);

    // Update LOC breakdown visual
    const codePercent = Math.round((loc.totals.code / loc.totals.total) * 100) || 0;
    const commentPercent = Math.round((loc.totals.comments / loc.totals.total) * 100) || 0;
    const blankPercent = Math.round((loc.totals.blank / loc.totals.total) * 100) || 0;

    locBreakdown.setContent(
      `{bold}Total Lines: {yellow-fg}${loc.totals.total.toLocaleString()}{/yellow-fg}{/bold}\n\n` +
      `{green-fg}Code{/green-fg}\n` +
      `${createProgressBar(codePercent, 25, 'green')} ${codePercent}%\n` +
      `${loc.totals.code.toLocaleString()} lines\n\n` +
      `{blue-fg}Comments{/blue-fg}\n` +
      `${createProgressBar(commentPercent, 25, 'blue')} ${commentPercent}%\n` +
      `${loc.totals.comments.toLocaleString()} lines\n\n` +
      `{gray-fg}Blank{/gray-fg}\n` +
      `${createProgressBar(blankPercent, 25, 'gray')} ${blankPercent}%\n` +
      `${loc.totals.blank.toLocaleString()} lines`
    );

    // Update files list
    const fileItems = files.largestFiles.map((f, i) => {
      const num = (i + 1).toString().padStart(2);
      const name = truncate(f.path.replace(/\\/g, '/'), 35);
      const lines = f.lines.toLocaleString().padStart(8);
      const size = formatBytes(f.size).padStart(10);
      return ` ${num}. ${name} ${lines} lines ${size}`;
    });
    filesPanel.setItems(fileItems);

    // Update folders list
    const folderItems = files.folderStats.map((f, i) => {
      const num = (i + 1).toString().padStart(2);
      const name = truncate(f.path || '.', 35);
      const count = f.fileCount.toString().padStart(5);
      const lines = f.totalLines.toLocaleString().padStart(8);
      return ` ${num}. ${name} ${count} files ${lines} lines`;
    });
    foldersPanel.setItems(folderItems);

    // Update status
    statusBar.setContent(
      ` {bold}${projectName}{/bold} │ ` +
      `{green-fg}${files.totalFiles} files{/green-fg} │ ` +
      `{yellow-fg}${loc.totals.total.toLocaleString()} lines{/yellow-fg} │ ` +
      `{cyan-fg}${loc.byLanguage.length} languages{/cyan-fg} │ ` +
      `Updated: ${new Date().toLocaleTimeString()}`
    );

    screen.render();
  }

  function scanProject(scanPath: string): Promise<DashboardData | null> {
    return new Promise((resolve) => {
      setImmediate(async () => {
        if (isScanning) {
          statusBar.setContent(` {yellow-fg}Scan sedang berjalan, tunggu sebentar...{/yellow-fg}`);
          screen.render();
          resolve(null);
          return;
        }

        try {
          isScanning = true;
          const absolutePath = path.resolve(scanPath);
          
          if (!fs.existsSync(absolutePath)) {
            statusBar.setContent(` {red-fg}Error: Path "${scanPath}" tidak ditemukan{/red-fg}`);
            screen.render();
            resolve(null);
            return;
          }

          const stat = fs.statSync(absolutePath);
          if (!stat.isDirectory()) {
            statusBar.setContent(` {red-fg}Error: "${scanPath}" bukan folder{/red-fg}`);
            screen.render();
            resolve(null);
            return;
          }

          const projectName = path.basename(absolutePath);
          statusBar.setContent(` {yellow-fg}⏳ Scanning ${projectName}...{/yellow-fg}`);
          screen.render();

          const files = await walkFiles(absolutePath, []);
          
          if (files.length === 0) {
            statusBar.setContent(` {red-fg}Tidak ada file yang ditemukan di ${projectName}{/red-fg}`);
            screen.render();
            resolve(null);
            return;
          }

          statusBar.setContent(` {yellow-fg}⏳ Analyzing ${files.length} files...{/yellow-fg}`);
          screen.render();

          const locResult = analyzeLOC(files);
          const fileResult = analyzeFiles(files, 15);

          resolve({ projectName, loc: locResult, files: fileResult });
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          statusBar.setContent(` {red-fg}Error: ${errMsg}{/red-fg}`);
          screen.render();
          resolve(null);
        } finally {
          isScanning = false;
        }
      });
    });
  }

  function showInputDialog(title: string, callback: (value: string) => Promise<void>) {
    const inputBox = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '70%',
      height: 7,
      border: { type: 'line' },
      style: {
        bg: '#1a1a2e',
        border: { fg: 'cyan' },
      },
    });

    const inputLabel = blessed.text({
      parent: inputBox,
      top: 0,
      left: 1,
      content: `{bold}{cyan-fg}${title}{/cyan-fg}{/bold}`,
      tags: true,
    });

    const inputHint = blessed.text({
      parent: inputBox,
      top: 1,
      left: 1,
      content: '{gray-fg}Contoh: C:/code/project, . (current dir), atau ../folder-lain{/gray-fg}',
      tags: true,
    });

    const input = blessed.textbox({
      parent: inputBox,
      top: 3,
      left: 1,
      right: 1,
      height: 1,
      style: {
        fg: 'white',
        bg: '#333',
      },
      inputOnFocus: true,
    });

    const inputHelp = blessed.text({
      parent: inputBox,
      bottom: 0,
      left: 1,
      content: '{gray-fg}[Enter] Scan  [Esc] Cancel{/gray-fg}',
      tags: true,
    });

    let isProcessing = false;
    let inputSubmitted = false;

    const closeDialog = () => {
      if (!inputSubmitted) {
        inputSubmitted = true;
        inputBox.destroy();
        filesPanel.focus();
        screen.render();
      }
    };

    input.key(['escape'], () => {
      if (!isProcessing) {
        closeDialog();
      }
    });

    input.key(['enter'], async () => {
      if (isProcessing || inputSubmitted) return;
      
      inputSubmitted = true;
      const value = input.getValue();
      inputBox.destroy();
      
      if (!value || !value.trim()) {
        statusBar.setContent(' {yellow-fg}Scan dibatalkan - path kosong{/yellow-fg}');
        filesPanel.focus();
        screen.render();
        return;
      }

      const trimmedValue = value.trim();
      
      // Basic validation
      if (trimmedValue.length > 500) {
        statusBar.setContent(' {red-fg}Error: Path terlalu panjang (max 500 karakter){/red-fg}');
        filesPanel.focus();
        screen.render();
        return;
      }

      // Check for obviously invalid characters (Windows & Unix)
      const invalidChars = /[<>"|?*\x00-\x1f]/;
      if (invalidChars.test(trimmedValue)) {
        statusBar.setContent(' {red-fg}Error: Path mengandung karakter invalid{/red-fg}');
        filesPanel.focus();
        screen.render();
        return;
      }

      isProcessing = true;
      statusBar.setContent(` {yellow-fg}⏳ Validating path...{/yellow-fg}`);
      screen.render();

      try {
        await callback(trimmedValue);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        statusBar.setContent(` {red-fg}Error: ${errMsg}{/red-fg}`);
      } finally {
        isProcessing = false;
        filesPanel.focus();
        screen.render();
      }
    });

    input.focus();
    screen.render();
  }

  function showMessage(message: string, type: 'error' | 'success' | 'info' = 'info') {
    const colors = {
      error: 'red',
      success: 'green',
      info: 'cyan',
    };
    const icons = {
      error: '✖',
      success: '✔',
      info: 'ℹ',
    };

    const msgBox = blessed.message({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 5,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: '#1a1a2e',
        border: { fg: colors[type] },
      },
      tags: true,
    });

    msgBox.display(`{center}{${colors[type]}-fg}${icons[type]} ${message}{/${colors[type]}-fg}{/center}`, 2, () => {
      filesPanel.focus();
      screen.render();
    });
  }

  function exportJson() {
    if (!currentData) return;
    const filename = `${currentData.projectName}-codestat-${Date.now()}.json`;
    const output = {
      projectName: currentData.projectName,
      generatedAt: new Date().toISOString(),
      loc: currentData.loc,
      files: currentData.files,
    };
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    statusBar.setContent(` {green-fg}Exported to ${filename}{/green-fg}`);
    screen.render();
  }

  // Key bindings
  screen.key(['q', 'C-c'], () => {
    screen.destroy();
    process.exit(0);
  });

  screen.key(['r'], async () => {
    if (currentData) {
      const data = await scanProject(targetPath || '.');
      if (data) updateDashboard(data);
    }
  });

  screen.key(['s'], () => {
    showInputDialog('Masukkan path folder yang mau di-scan', async (value) => {
      const data = await scanProject(value);
      if (data) {
        targetPath = value;
        updateDashboard(data);
        showMessage(`Berhasil scan ${data.projectName}!`, 'success');
      } else {
        showMessage('Path tidak valid atau folder kosong!', 'error');
      }
    });
  });

  screen.key(['e'], () => exportJson());

  screen.key(['tab'], () => {
    currentFocus = (currentFocus + 1) % focusables.length;
    focusables[currentFocus].focus();
    screen.render();
  });

  // Initial scan
  const data = await scanProject(targetPath || '.');
  if (data) {
    updateDashboard(data);
  } else {
    overview.setContent('{center}{red-fg}No files found!{/red-fg}\n\nPress {bold}S{/bold} to scan{/center}');
  }

  filesPanel.focus();
  screen.render();
}

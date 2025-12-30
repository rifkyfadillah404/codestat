# CODESTAT

<img width="1600" height="899" alt="image" src="https://github.com/user-attachments/assets/be8781aa-0e32-4bb4-8f84-4e65c07da91f" />

> CLI tool untuk analisis codebase - LOC, file stats, health score, dan visualisasi modern di terminal.

## Features

- **Lines of Code Counter** - Hitung LOC per bahasa (code, comments, blank)
- **File Analysis** - Top largest files, folder statistics
- **TODO/FIXME Tracker** - Scan semua TODO, FIXME, HACK, BUG, NOTE comments
- **Git Statistics** - Commits, contributors, file churn (hot files)
- **Dependency Scanner** - List semua dependencies, detect package manager
- **Health Score** - Grade A-F berdasarkan code quality, maintenance, docs, activity
- **Modern TUI Dashboard** - Full-screen terminal UI dengan ASCII art
- **Progress Bars** - Visualisasi persentase per bahasa
- **Multiple Output Formats** - Terminal colorful atau JSON export
- **40+ Languages Supported** - TypeScript, Python, Go, Rust, Java, dll

## Installation

```bash
# Clone repo
git clone https://github.com/rifkyfadillah404/codestat.git
cd codestat

# Install dependencies
npm install

# Build
npm run build

# (Optional) Install globally
npm link
```

## Usage

### Dashboard Mode (Default)

Jalankan tanpa argument untuk membuka TUI dashboard:

```bash
codestat
# atau
codestat --dashboard
codestat -d
```

**Dashboard Panels:**
| Panel | Info |
|-------|------|
| **Overview** | Project name, health grade, stats summary |
| **Languages** | LOC breakdown per bahasa dengan progress bars |
| **LOC Breakdown** | Code vs Comments vs Blank lines |
| **Largest Files** | Top files by line count |
| **TODOs/FIXMEs** | List semua TODO, FIXME, HACK, BUG comments |
| **Git Stats** | Commits, contributors, hot files |

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `Q` | Quit |
| `R` | Refresh/rescan |
| `S` | Scan path baru |
| `E` | Export ke JSON |
| `Tab` | Switch panel |
| `↑↓` | Navigate list |

### Quick Scan Mode

Scan langsung tanpa dashboard:

```bash
# Scan current directory
codestat .

# Scan specific folder
codestat /path/to/project

# Output as JSON
codestat . --format json

# Save to file
codestat . --format json --output report.json

# Filter by language
codestat . --lang ts,js,py

# Ignore patterns
codestat . --ignore "test,fixtures,*.spec.ts"

# Show top N files
codestat . --top 20
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--format <format>` | `-f` | Output format: `terminal` atau `json` |
| `--output <file>` | `-o` | Save output ke file |
| `--ignore <patterns>` | `-i` | Comma-separated patterns to ignore |
| `--lang <languages>` | `-l` | Filter by languages |
| `--top <number>` | `-t` | Number of top items (default: 10) |
| `--dashboard` | `-d` | Run in dashboard mode |
| `--version` | `-V` | Show version |
| `--help` | `-h` | Show help |

## Health Score

CodeStat menghitung health score (0-100) dan grade (A-F) berdasarkan:

| Category | What's Checked |
|----------|----------------|
| **Code Quality** | Large files (>500 lines), comment ratio |
| **Maintenance** | TODO/FIXME count, critical issues (BUG), lockfile |
| **Documentation** | README exists, comment coverage |
| **Activity** | Recent commits, contributor count |

Contoh output:
```
Health: B (78/100)

Issues:
- 5 files with >500 lines
- 12 TODOs/FIXMEs
- No commits in the last 30 days

Recommendations:
- Consider splitting large files into smaller modules
- Address TODO items to reduce tech debt
```

## Example Output

### Terminal Mode

```
  Codebase Statistics: my-project
  ==================================================

  Overview
     Total Files:    234
     Total Lines:    45,892
     Total Size:     1.2 MB
     Languages:      5

  Lines of Code
  +──────────────+────────+──────────+───────+
  │ Language     │ Files  │ Code     │ Blank │
  +──────────────+────────+──────────+───────+
  │ TypeScript   │ 120    │ 28,450   │ 4,100 │
  │ JavaScript   │ 45     │ 5,230    │ 720   │
  │ CSS          │ 30     │ 2,100    │ 300   │
  +──────────────+────────+──────────+───────+

  Largest Files
     1. src/components/Dashboard.tsx    (1,245 lines)
     2. src/utils/parser.ts             (892 lines)
     3. src/api/handlers.ts             (756 lines)
```

### JSON Export

Export dengan pencet `E` di dashboard atau `--format json`:

```json
{
  "projectName": "my-project",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "health": {
    "grade": "B",
    "score": 78,
    "breakdown": {
      "codeQuality": 20,
      "maintenance": 18,
      "documentation": 22,
      "activity": 18
    },
    "issues": ["5 files with >500 lines"],
    "recommendations": ["Consider splitting large files"]
  },
  "loc": {
    "byLanguage": [...],
    "totals": { "files": 234, "code": 35780, "comments": 4090, "blank": 5120 }
  },
  "todos": {
    "total": 12,
    "items": [{ "type": "TODO", "text": "implement feature", "file": "src/api.ts", "line": 45 }],
    "byType": { "TODO": 8, "FIXME": 3, "HACK": 1 }
  },
  "git": {
    "totalCommits": 156,
    "contributors": [{ "name": "John", "commits": 120 }],
    "fileChurn": [{ "file": "src/index.ts", "changes": 45 }]
  },
  "deps": {
    "packageManager": "npm",
    "hasLockfile": true,
    "totalDeps": 25,
    "summary": { "prod": 10, "dev": 15 }
  }
}
```

## Supported Languages

TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, C, C++, C#, Ruby, PHP, Swift, Scala, Vue, Svelte, HTML, CSS, SCSS, Sass, Less, JSON, YAML, XML, Markdown, SQL, Shell, PowerShell, Lua, Dart, Elixir, Erlang, Haskell, Clojure, Elm, GraphQL, Protocol Buffers, Terraform, Dockerfile, dan lainnya.

## Default Ignore Patterns

Folder berikut otomatis di-ignore:
- `node_modules/`
- `dist/`, `build/`
- `.git/`
- `vendor/`
- `__pycache__/`, `venv/`
- `coverage/`
- `.next/`, `.nuxt/`
- `target/`, `bin/`, `obj/`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in dev mode
npm run dev
```

## Tech Stack

- **TypeScript** - Type-safe development
- **Commander** - CLI framework
- **Blessed** - Terminal UI
- **Chalk** - Terminal styling
- **Fast-glob** - File discovery

## License

MIT

---

Made with terminal magic by [@rifkyfadillah404](https://github.com/rifkyfadillah404)

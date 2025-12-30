import { execSync } from 'child_process';
import * as path from 'path';

export interface ContributorStats {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface FileChurn {
  file: string;
  changes: number;
}

export interface CommitActivity {
  date: string;
  commits: number;
}

export interface GitResult {
  isGitRepo: boolean;
  totalCommits: number;
  contributors: ContributorStats[];
  fileChurn: FileChurn[];
  recentActivity: CommitActivity[];
  firstCommit: string | null;
  lastCommit: string | null;
  branches: number;
}

function execGit(cwd: string, args: string): string | null {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

export function analyzeGit(targetPath: string, topN: number = 10): GitResult {
  const absolutePath = path.resolve(targetPath);
  
  // Check if it's a git repo
  const gitCheck = execGit(absolutePath, 'rev-parse --git-dir');
  if (!gitCheck) {
    return {
      isGitRepo: false,
      totalCommits: 0,
      contributors: [],
      fileChurn: [],
      recentActivity: [],
      firstCommit: null,
      lastCommit: null,
      branches: 0,
    };
  }

  // Total commits
  const totalCommitsStr = execGit(absolutePath, 'rev-list --count HEAD');
  const totalCommits = totalCommitsStr ? parseInt(totalCommitsStr, 10) : 0;

  // Contributors with stats
  const contributors: ContributorStats[] = [];
  const shortlogOutput = execGit(absolutePath, 'shortlog -sne HEAD');
  if (shortlogOutput) {
    const lines = shortlogOutput.split('\n').filter(l => l.trim());
    for (const line of lines.slice(0, topN)) {
      const match = line.match(/^\s*(\d+)\s+(.+?)\s+<(.+?)>$/);
      if (match) {
        contributors.push({
          name: match[2].trim(),
          email: match[3].trim(),
          commits: parseInt(match[1], 10),
          additions: 0,
          deletions: 0,
        });
      }
    }
  }

  // File churn (most changed files)
  const fileChurn: FileChurn[] = [];
  const churnOutput = execGit(absolutePath, 'log --pretty=format: --name-only HEAD');
  if (churnOutput) {
    const fileChanges = new Map<string, number>();
    const files = churnOutput.split('\n').filter(f => f.trim());
    for (const file of files) {
      fileChanges.set(file, (fileChanges.get(file) || 0) + 1);
    }
    const sorted = Array.from(fileChanges.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    for (const [file, changes] of sorted) {
      fileChurn.push({ file, changes });
    }
  }

  // Recent activity (last 30 days)
  const recentActivity: CommitActivity[] = [];
  const activityOutput = execGit(absolutePath, 'log --since="30 days ago" --pretty=format:"%ad" --date=short HEAD');
  if (activityOutput) {
    const dateCount = new Map<string, number>();
    const dates = activityOutput.split('\n').filter(d => d.trim());
    for (const date of dates) {
      dateCount.set(date, (dateCount.get(date) || 0) + 1);
    }
    const sorted = Array.from(dateCount.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [date, commits] of sorted) {
      recentActivity.push({ date, commits });
    }
  }

  // First and last commit dates
  const firstCommit = execGit(absolutePath, 'log --reverse --pretty=format:"%ad" --date=short HEAD | head -1') 
    || execGit(absolutePath, 'log --reverse --pretty=format:%ad --date=short -1');
  const lastCommit = execGit(absolutePath, 'log -1 --pretty=format:%ad --date=short HEAD');

  // Branch count
  const branchOutput = execGit(absolutePath, 'branch -a');
  const branches = branchOutput ? branchOutput.split('\n').filter(b => b.trim()).length : 0;

  return {
    isGitRepo: true,
    totalCommits,
    contributors,
    fileChurn,
    recentActivity,
    firstCommit,
    lastCommit,
    branches,
  };
}

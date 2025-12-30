import { LOCResult } from './loc';
import { FileAnalysisResult } from './files';
import { TodoResult } from './todos';
import { GitResult } from './git';
import { DepsResult } from './deps';

export interface HealthScore {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number; // 0-100
  breakdown: {
    codeQuality: number;
    maintenance: number;
    documentation: number;
    activity: number;
  };
  issues: string[];
  recommendations: string[];
}

export function calculateHealthScore(
  loc: LOCResult,
  files: FileAnalysisResult,
  todos: TodoResult,
  git: GitResult,
  deps: DepsResult
): HealthScore {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Code Quality Score (25 points max)
  let codeQuality = 25;
  
  // Penalize for too many large files (>500 lines)
  const largeFiles = files.largestFiles.filter(f => f.lines > 500).length;
  if (largeFiles > 0) {
    codeQuality -= Math.min(10, largeFiles * 2);
    issues.push(`${largeFiles} files with >500 lines`);
    recommendations.push('Consider splitting large files into smaller modules');
  }

  // Check comment ratio (should be 10-30%)
  const commentRatio = loc.totals.comments / (loc.totals.code || 1);
  if (commentRatio < 0.05) {
    codeQuality -= 5;
    issues.push('Very few comments in codebase');
    recommendations.push('Add more documentation comments');
  } else if (commentRatio > 0.5) {
    codeQuality -= 3;
    issues.push('Excessive comments (may indicate commented-out code)');
  }

  // Maintenance Score (25 points max)
  let maintenance = 25;

  // TODOs/FIXMEs indicate tech debt
  const todoCount = todos.total;
  if (todoCount > 50) {
    maintenance -= 15;
    issues.push(`${todoCount} TODOs/FIXMEs - high tech debt`);
    recommendations.push('Address TODO items to reduce tech debt');
  } else if (todoCount > 20) {
    maintenance -= 8;
    issues.push(`${todoCount} TODOs/FIXMEs`);
  } else if (todoCount > 10) {
    maintenance -= 4;
  }

  // Check for FIXMEs and BUGs specifically
  const criticalTodos = todos.items.filter(t => 
    t.type === 'FIXME' || t.type === 'BUG' || t.type === 'XXX'
  ).length;
  if (criticalTodos > 5) {
    maintenance -= 5;
    issues.push(`${criticalTodos} critical issues (FIXME/BUG)`);
    recommendations.push('Prioritize fixing BUG and FIXME items');
  }

  // Dependencies health
  if (deps.totalDeps > 0) {
    if (!deps.hasLockfile) {
      maintenance -= 5;
      issues.push('No lockfile found');
      recommendations.push('Add a lockfile (package-lock.json) for reproducible builds');
    }
    if (deps.outdatedCount > 10) {
      maintenance -= 5;
      issues.push(`${deps.outdatedCount} outdated dependencies`);
      recommendations.push('Update outdated dependencies');
    }
  }

  // Documentation Score (25 points max)
  let documentation = 25;

  // Check if README exists (approximation: check for markdown files)
  const hasMarkdown = loc.byLanguage.some(l => l.language === 'Markdown');
  if (!hasMarkdown) {
    documentation -= 10;
    issues.push('No markdown documentation found');
    recommendations.push('Add a README.md file');
  }

  // Low comment ratio affects documentation score too
  if (commentRatio < 0.1) {
    documentation -= 5;
  }

  // Activity Score (25 points max)
  let activity = 25;

  if (git.isGitRepo) {
    // Check recent activity
    const recentCommits = git.recentActivity.reduce((sum, a) => sum + a.commits, 0);
    if (recentCommits === 0) {
      activity -= 10;
      issues.push('No commits in the last 30 days');
      recommendations.push('Repository appears inactive');
    } else if (recentCommits < 5) {
      activity -= 5;
      issues.push('Low commit activity in the last 30 days');
    }

    // Check for multiple contributors (healthy for larger projects)
    if (git.contributors.length === 1 && git.totalCommits > 50) {
      activity -= 3;
      issues.push('Single contributor on a large project');
    }
  } else {
    activity -= 15;
    issues.push('Not a git repository');
    recommendations.push('Initialize git for version control');
  }

  // Calculate total score
  codeQuality = Math.max(0, codeQuality);
  maintenance = Math.max(0, maintenance);
  documentation = Math.max(0, documentation);
  activity = Math.max(0, activity);

  const score = codeQuality + maintenance + documentation + activity;

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    grade,
    score,
    breakdown: {
      codeQuality,
      maintenance,
      documentation,
      activity,
    },
    issues: issues.slice(0, 10),
    recommendations: recommendations.slice(0, 5),
  };
}

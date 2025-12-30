import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface Dependency {
  name: string;
  version: string;
  type: 'prod' | 'dev' | 'peer' | 'optional';
  latest?: string;
  outdated?: boolean;
}

export interface DepsResult {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  hasLockfile: boolean;
  dependencies: Dependency[];
  devDependencies: Dependency[];
  totalDeps: number;
  outdatedCount: number;
  summary: {
    prod: number;
    dev: number;
    peer: number;
    optional: number;
  };
}

function detectPackageManager(targetPath: string): { manager: 'npm' | 'yarn' | 'pnpm' | 'unknown'; hasLock: boolean } {
  const yarnLock = fs.existsSync(path.join(targetPath, 'yarn.lock'));
  const pnpmLock = fs.existsSync(path.join(targetPath, 'pnpm-lock.yaml'));
  const npmLock = fs.existsSync(path.join(targetPath, 'package-lock.json'));

  if (pnpmLock) return { manager: 'pnpm', hasLock: true };
  if (yarnLock) return { manager: 'yarn', hasLock: true };
  if (npmLock) return { manager: 'npm', hasLock: true };
  
  return { manager: 'unknown', hasLock: false };
}

function getOutdatedPackages(targetPath: string, manager: string): Map<string, string> {
  const outdated = new Map<string, string>();
  
  try {
    let cmd = '';
    if (manager === 'npm') {
      cmd = 'npm outdated --json';
    } else if (manager === 'yarn') {
      cmd = 'yarn outdated --json';
    } else if (manager === 'pnpm') {
      cmd = 'pnpm outdated --format json';
    } else {
      return outdated;
    }

    const result = execSync(cmd, { 
      cwd: targetPath, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000
    });

    if (manager === 'npm') {
      const data = JSON.parse(result || '{}');
      for (const [name, info] of Object.entries(data)) {
        const pkgInfo = info as { latest?: string };
        if (pkgInfo.latest) {
          outdated.set(name, pkgInfo.latest);
        }
      }
    }
  } catch {
    // npm outdated returns exit code 1 when there are outdated packages
    // Try to parse the output anyway
    try {
      const match = arguments[0]?.toString().match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        for (const [name, info] of Object.entries(data)) {
          const pkgInfo = info as { latest?: string };
          if (pkgInfo.latest) {
            outdated.set(name, pkgInfo.latest);
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return outdated;
}

export function analyzeDeps(targetPath: string, checkOutdated: boolean = false): DepsResult {
  const absolutePath = path.resolve(targetPath);
  const packageJsonPath = path.join(absolutePath, 'package.json');

  const emptyResult: DepsResult = {
    packageManager: 'unknown',
    hasLockfile: false,
    dependencies: [],
    devDependencies: [],
    totalDeps: 0,
    outdatedCount: 0,
    summary: { prod: 0, dev: 0, peer: 0, optional: 0 },
  };

  if (!fs.existsSync(packageJsonPath)) {
    return emptyResult;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const { manager, hasLock } = detectPackageManager(absolutePath);

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    const peerDeps = packageJson.peerDependencies || {};
    const optionalDeps = packageJson.optionalDependencies || {};

    let outdatedMap = new Map<string, string>();
    if (checkOutdated && manager !== 'unknown') {
      outdatedMap = getOutdatedPackages(absolutePath, manager);
    }

    const dependencies: Dependency[] = Object.entries(deps).map(([name, version]) => ({
      name,
      version: version as string,
      type: 'prod' as const,
      latest: outdatedMap.get(name),
      outdated: outdatedMap.has(name),
    }));

    const devDependencies: Dependency[] = Object.entries(devDeps).map(([name, version]) => ({
      name,
      version: version as string,
      type: 'dev' as const,
      latest: outdatedMap.get(name),
      outdated: outdatedMap.has(name),
    }));

    const peerDependencies: Dependency[] = Object.entries(peerDeps).map(([name, version]) => ({
      name,
      version: version as string,
      type: 'peer' as const,
    }));

    const optionalDependencies: Dependency[] = Object.entries(optionalDeps).map(([name, version]) => ({
      name,
      version: version as string,
      type: 'optional' as const,
    }));

    const allDeps = [...dependencies, ...devDependencies];
    const outdatedCount = allDeps.filter(d => d.outdated).length;

    return {
      packageManager: manager,
      hasLockfile: hasLock,
      dependencies,
      devDependencies,
      totalDeps: dependencies.length + devDependencies.length + peerDependencies.length + optionalDependencies.length,
      outdatedCount,
      summary: {
        prod: dependencies.length,
        dev: devDependencies.length,
        peer: peerDependencies.length,
        optional: optionalDependencies.length,
      },
    };
  } catch {
    return emptyResult;
  }
}

import * as fs from "fs";
import * as path from "path";

export interface CopyResult {
  action: "copied" | "skipped" | "updated";
  dst: string;
}

export function copyDir(
  src: string,
  dst: string,
  opts: { dryRun: boolean; overwrite?: boolean },
): CopyResult {
  if (fs.existsSync(dst)) {
    if (!opts.overwrite) {
      return { action: "skipped", dst };
    }
    if (!opts.dryRun) {
      fs.rmSync(dst, { recursive: true });
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.cpSync(src, dst, { recursive: true });
    }
    return { action: "updated", dst };
  }

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(src, dst, { recursive: true });
  }

  return { action: "copied", dst };
}

export function copyFile(
  src: string,
  dst: string,
  opts: { dryRun: boolean; executable?: boolean; overwrite?: boolean },
): CopyResult {
  if (fs.existsSync(dst)) {
    if (!opts.overwrite) {
      return { action: "skipped", dst };
    }
    if (!opts.dryRun) {
      fs.copyFileSync(src, dst);
      if (opts.executable) {
        fs.chmodSync(dst, 0o755);
      }
    }
    return { action: "updated", dst };
  }

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    if (opts.executable) {
      fs.chmodSync(dst, 0o755);
    }
  }

  return { action: "copied", dst };
}

export function ensureDir(dirPath: string, opts: { dryRun: boolean }): boolean {
  if (fs.existsSync(dirPath)) return false;
  if (!opts.dryRun) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return true;
}

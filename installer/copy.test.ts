import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { copyDir, copyFile, ensureDir } from "./copy.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copy-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("ensureDir", () => {
  it("creates a directory that does not exist", () => {
    const dir = path.join(tmpDir, "new-dir");
    const created = ensureDir(dir, { dryRun: false });
    expect(created).toBe(true);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("returns false if the directory already exists", () => {
    const dir = path.join(tmpDir, "existing");
    fs.mkdirSync(dir);
    const created = ensureDir(dir, { dryRun: false });
    expect(created).toBe(false);
  });

  it("does not create the directory in dry-run mode", () => {
    const dir = path.join(tmpDir, "dry-run-dir");
    const created = ensureDir(dir, { dryRun: true });
    expect(created).toBe(true);
    expect(fs.existsSync(dir)).toBe(false);
  });
});

describe("copyFile", () => {
  let srcFile: string;

  beforeEach(() => {
    srcFile = path.join(tmpDir, "src.txt");
    fs.writeFileSync(srcFile, "hello");
  });

  it("copies a file to a new destination", () => {
    const dst = path.join(tmpDir, "dst.txt");
    const result = copyFile(srcFile, dst, { dryRun: false });
    expect(result).toEqual({ action: "copied", dst });
    expect(fs.readFileSync(dst, "utf-8")).toBe("hello");
  });

  it("creates parent directories for the destination", () => {
    const dst = path.join(tmpDir, "sub", "dir", "dst.txt");
    const result = copyFile(srcFile, dst, { dryRun: false });
    expect(result.action).toBe("copied");
    expect(fs.readFileSync(dst, "utf-8")).toBe("hello");
  });

  it("skips if destination exists and overwrite is false", () => {
    const dst = path.join(tmpDir, "dst.txt");
    fs.writeFileSync(dst, "old");
    const result = copyFile(srcFile, dst, { dryRun: false, overwrite: false });
    expect(result.action).toBe("skipped");
    expect(fs.readFileSync(dst, "utf-8")).toBe("old");
  });

  it("overwrites if destination exists and overwrite is true", () => {
    const dst = path.join(tmpDir, "dst.txt");
    fs.writeFileSync(dst, "old");
    const result = copyFile(srcFile, dst, { dryRun: false, overwrite: true });
    expect(result.action).toBe("updated");
    expect(fs.readFileSync(dst, "utf-8")).toBe("hello");
  });

  it("sets executable permission when requested", () => {
    const dst = path.join(tmpDir, "script.sh");
    copyFile(srcFile, dst, { dryRun: false, executable: true });
    const mode = fs.statSync(dst).mode;
    expect(mode & 0o755).toBe(0o755);
  });

  it("does not copy in dry-run mode", () => {
    const dst = path.join(tmpDir, "dry.txt");
    const result = copyFile(srcFile, dst, { dryRun: true });
    expect(result.action).toBe("copied");
    expect(fs.existsSync(dst)).toBe(false);
  });

  it("returns updated in dry-run mode when destination exists and overwrite is true", () => {
    const dst = path.join(tmpDir, "existing.txt");
    fs.writeFileSync(dst, "old");
    const result = copyFile(srcFile, dst, { dryRun: true, overwrite: true });
    expect(result.action).toBe("updated");
    expect(fs.readFileSync(dst, "utf-8")).toBe("old");
  });
});

describe("copyDir", () => {
  let srcDir: string;

  beforeEach(() => {
    srcDir = path.join(tmpDir, "src-dir");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "a.txt"), "aaa");
    fs.mkdirSync(path.join(srcDir, "sub"));
    fs.writeFileSync(path.join(srcDir, "sub", "b.txt"), "bbb");
  });

  it("copies a directory recursively", () => {
    const dst = path.join(tmpDir, "dst-dir");
    const result = copyDir(srcDir, dst, { dryRun: false });
    expect(result.action).toBe("copied");
    expect(fs.readFileSync(path.join(dst, "a.txt"), "utf-8")).toBe("aaa");
    expect(fs.readFileSync(path.join(dst, "sub", "b.txt"), "utf-8")).toBe("bbb");
  });

  it("skips if destination exists and overwrite is false", () => {
    const dst = path.join(tmpDir, "dst-dir");
    fs.mkdirSync(dst);
    fs.writeFileSync(path.join(dst, "old.txt"), "old");
    const result = copyDir(srcDir, dst, { dryRun: false, overwrite: false });
    expect(result.action).toBe("skipped");
    expect(fs.existsSync(path.join(dst, "old.txt"))).toBe(true);
    expect(fs.existsSync(path.join(dst, "a.txt"))).toBe(false);
  });

  it("overwrites if destination exists and overwrite is true", () => {
    const dst = path.join(tmpDir, "dst-dir");
    fs.mkdirSync(dst);
    fs.writeFileSync(path.join(dst, "old.txt"), "old");
    const result = copyDir(srcDir, dst, { dryRun: false, overwrite: true });
    expect(result.action).toBe("updated");
    expect(fs.readFileSync(path.join(dst, "a.txt"), "utf-8")).toBe("aaa");
    // old file should be removed since the entire directory is replaced
    expect(fs.existsSync(path.join(dst, "old.txt"))).toBe(false);
  });

  it("does not copy in dry-run mode", () => {
    const dst = path.join(tmpDir, "dry-dir");
    const result = copyDir(srcDir, dst, { dryRun: true });
    expect(result.action).toBe("copied");
    expect(fs.existsSync(dst)).toBe(false);
  });
});

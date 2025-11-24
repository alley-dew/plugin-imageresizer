#!/usr/bin/env node

/**
 * Append a timestamped summary of staged/unstaged changes to history.md.
 * Usage: npm run update-history
 */

const { execSync } = require("node:child_process");
const { appendFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");

const REPO_ROOT = resolve(__dirname, "..");
const HISTORY_FILE = resolve(REPO_ROOT, "history.md");
const GIT_DIR = resolve(REPO_ROOT, ".git");

function run(cmd) {
  return execSync(cmd, {
    cwd: REPO_ROOT,
    encoding: "utf-8"
  }).trim();
}

function getChangedFiles() {
  if (!existsSync(GIT_DIR)) {
    console.warn(".git 디렉터리를 찾을 수 없어 history 업데이트를 건너뜁니다.");
    return [];
  }
  try {
    const output = run("git status --short");
    if (!output) return [];
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const status = line.slice(0, 2).trim();
        const file = line.slice(3).trim();
        return { status, file };
      })
      .filter(({ file }) => file !== "history.md");
  } catch (error) {
    console.error("git 상태를 읽을 수 없습니다.", error.message);
    return [];
  }
}

function buildTimestamp() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: false
  });
  // sv-SE medium format -> "24 nov. 2025 16:30:00". Replace month text.
  const parts = formatter.formatToParts(new Date());
  const pad = (value) => String(value).padStart(2, "0");
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const year = partMap.year;
  const month = pad(partToNumber(partMap.month));
  const day = pad(partMap.day);
  const hour = pad(partMap.hour);
  const minute = pad(partMap.minute);
  const second = pad(partMap.second);
  return `${year}-${month}-${day} ${hour}:${minute}:${second} KST`;
}

function partToNumber(value) {
  if (!value) return value;
  const map = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    maj: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    okt: 10,
    nov: 11,
    dec: 12
  };
  const lower = value.toLowerCase().replace(".", "");
  return map[lower] || Number(value);
}

function appendHistory(changes) {
  if (!existsSync(HISTORY_FILE)) {
    appendFileSync(HISTORY_FILE, "# 변경 이력\n\n");
  }
  const timestamp = buildTimestamp();
  const lines = [];
  lines.push(`## ${timestamp}`);
  changes.forEach(({ status, file }) => {
    lines.push(`- ${status || "?"} ${file}`);
  });
  lines.push("");
  appendFileSync(HISTORY_FILE, `${lines.join("\n")}\n`);
  console.log(`history.md에 ${changes.length}개 변경을 기록했습니다.`);
}

function main() {
  const changes = getChangedFiles();
  if (!changes.length) {
    console.log("기록할 변경 사항이 없습니다.");
    return;
  }
  appendHistory(changes);
}

main();


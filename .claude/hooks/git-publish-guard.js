#!/usr/bin/env node
// PreToolUse hook on Bash: refuses what no Claude session may do, in any permission mode —
// committing, pushing, and merging a pull request.

const fs = require("node:fs");

const command = JSON.parse(fs.readFileSync(0, "utf-8"))?.tool_input?.command ?? "";
const reason = refusal(command);
if (reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Blocked by git-publish-guard: ${reason}`,
      },
    }),
  );
}

function refusal(text) {
  if (/\bgh\s+pr\s+merge\b/.test(text) || /\/pulls\/[^\s/]+\/merge\b/.test(text)) {
    return "merging a pull request is the user's alone.";
  }
  if (/\b(mergePullRequest|enablePullRequestAutoMerge)\b/.test(text)) {
    return "merging a pull request is the user's alone.";
  }
  if (/\bgit(?:\s+-C\s+\S+)*\s+push\b/.test(text)) {
    return "pushing is the user's alone.";
  }
  if (/\bgit(?:\s+-C\s+\S+)*\s+commit\b/.test(text)) {
    return "committing is the user's alone.";
  }
  return null;
}

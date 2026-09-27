#!/usr/bin/env bash
# UserPromptSubmit hook.
# When the user's message sounds like a complaint or a request to fix/redo something, reminds
# Claude of core.md §6: if the cause is in the template, log an entry to TEMPLATE-FIXES.md before
# fixing. Silent on every other message. Never blocks.
#
# Input : JSON on stdin ({ prompt, ... })
# Output: JSON with hookSpecificOutput.additionalContext (or nothing)

set -u

prompt=$(node -e '
  let d = "";
  process.stdin.on("data", c => (d += c));
  process.stdin.on("end", () => {
    try { process.stdout.write(JSON.parse(d).prompt || ""); } catch { process.stdout.write(""); }
  });
' 2>/dev/null)

# Ukrainian, Russian and English cues for "something is wrong / fix / redo / I do not like"
if printf '%s' "$prompt" | grep -qiE 'не подоба|не так|не працю|не работа|непра|неправ|помилк|ошибк|баг|bug|пофікс|пофикс|фікс|fix|виправ|исправ|переро|передел|зміни|измени|change|wrong|broken|dislike|redo|rework|прибер|убер|remove|чому |почему |why '; then
  context="TEMPLATE FEEDBACK (core.md §6): if what the user dislikes or wants fixed comes from the template (rule, skill, hook, tokens/utilities structure, layout, script, dev page, convention, default) and this is a client project, append an entry to TEMPLATE-FIXES.md (title, Problem with file/line and the user's words, Template file(s), Fix, Why — in the user's language) BEFORE fixing, then fix, then say it was logged. In the template repo itself apply the change directly. Content-only requests are not logged."
  esc=$(printf '%s' "$context" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"%s"}}\n' "$esc"
fi
exit 0

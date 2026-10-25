# Cameras Decoded — Agent Skill

One skill that teaches any AI assistant how to help a photographer use Cameras Decoded: tonight's blind-judged photo challenge (the Arena), the right lesson in the Field Manual or Protocols, and a link into the app at the right place.

Read-only. The skill never enters a photo, votes, buys, or changes account state. Those steps happen in the app, by the member.

## Install

Copy this folder into your agent's skills directory:

| Agent | Install |
|---|---|
| Claude Code | `cp -r cameras-decoded ~/.claude/skills/` (personal) or `.claude/skills/` (one project) |
| Codex | `cp -r cameras-decoded ~/.codex/skills/` |
| Gemini CLI | `cp -r cameras-decoded ~/.gemini/skills/` (or `.agents/skills/`) |
| Copilot | `cp -r cameras-decoded .github/skills/` (or `.agents/skills/`) |
| Cursor | `cp -r cameras-decoded ~/.cursor/skills/` |
| Any agent (`npx skills`) | `npx skills add CamerasDecoded/CamerasDecoded --skill cameras-decoded` |

Or download `SKILL.md` directly: `https://camerasdecoded.com/skills/cameras-decoded/SKILL.md`

## What it does

- Answers "what is tonight's challenge?" from `https://camerasdecoded.com/tonight.json` (date-checked, never invented).
- Points to the right Field Manual chapter or Protocol for what the user wants to learn, with a link — never a summary from memory.
- Explains the Arena, Pro pricing, and the free tier in the platform's own words.
- Refuses to enter, vote, or buy on the user's behalf, and links them to the app instead.

## Format

Open Agent Skills standard: one `SKILL.md` with YAML frontmatter (`name`, `description`) and a Markdown body. No server, no auth, no dependencies.

## Links

- Install page: `https://camerasdecoded.com/agents.html`
- Agent-readable index: `https://camerasdecoded.com/llms.txt` (full version: `llms-full.txt`)
- Tonight's challenge: `https://camerasdecoded.com/tonight.json`

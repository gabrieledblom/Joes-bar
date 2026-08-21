# Joe's Bar

## Agent skills

This project leans on a set of design and frontend [Agent Skills](https://code.claude.com/docs/en/skills).
They are **not vendored** into this repo — `scripts/install-skills.sh` fetches them
from their upstream sources on demand:

```bash
./scripts/install-skills.sh
```

That installs into `~/.claude/skills` (global, available to every project). To
install into this repo instead — `./.claude/skills`, checked against
`.gitignore` — use:

```bash
SKILLS_SCOPE=-p ./scripts/install-skills.sh
```

Re-running the script is safe; it overwrites each skill with the current
upstream version.

> Skills run with full agent permissions. Review a skill's `SKILL.md` before
> relying on it.

### What gets installed

| Source | Skills | Covers |
| --- | --- | --- |
| [`emilkowalski/skill`](https://github.com/emilkowalski/skill) | 9 | Animation and motion craft, UI polish, prototyping |
| [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) | 10 | Visual direction, brand kits, image-led frontend |
| [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | 1 | Broad frontend design and critique pass |
| [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 7 | Design tokens, palettes, style libraries, slides |
| [`anthropics/skills`](https://github.com/anthropics/skills) | 9 | Frontend design, brand guidelines, docs, artifacts |
| [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills) | 9 | React/Next.js practices, deploys, guideline reviews |
| [`remotion-dev/skills`](https://github.com/remotion-dev/skills) | 12 | Programmatic video with Remotion |
| [`bencium/bencium-marketplace`](https://github.com/bencium/bencium-marketplace) | 7 | UX design perspectives, design audits, AEO |
| [`AccessLint/skills`](https://github.com/AccessLint/skills) | 5 | Accessibility scan, inspect, audit, fix, diff |

69 skills total. The exact list per source lives in `scripts/install-skills.sh`.

### Requirements

Node.js 18+ (`npx`). Nothing else.

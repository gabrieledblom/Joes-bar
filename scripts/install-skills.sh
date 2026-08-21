#!/usr/bin/env bash
#
# Install the design/dev Agent Skills this project works with.
#
# Skills are fetched from their upstream repos at run time (nothing is vendored
# here), so re-running this picks up whatever upstream has published since.
#
# Usage:
#   ./scripts/install-skills.sh            # install globally (~/.claude/skills)
#   SKILLS_SCOPE=-p ./scripts/install-skills.sh   # install into ./.claude/skills
#   SKILLS_AGENT=codex ./scripts/install-skills.sh
#
# Requires: node + npx (Node 18+).

set -uo pipefail

SKILLS_SCOPE="${SKILLS_SCOPE:--g}"
SKILLS_AGENT="${SKILLS_AGENT:-claude-code}"

if ! command -v npx >/dev/null 2>&1; then
  echo "error: npx not found on PATH. Install Node.js 18+ first." >&2
  exit 1
fi

failed=()

# add <repo> [extra args...]
add() {
  local repo="$1"; shift
  echo
  echo "==> $repo"
  if ! npx -y skills@latest add "$repo" "$SKILLS_SCOPE" -a "$SKILLS_AGENT" "$@" -y; then
    echo "!!! failed: $repo" >&2
    failed+=("$repo")
  fi
}

# Motion, interaction and UI-polish craft.
add emilkowalski/skill \
  -s animate \
  -s animation-vocabulary \
  -s apple-design \
  -s emil-design-eng \
  -s find-animation-opportunities \
  -s improve-animations \
  -s pick-ui-library \
  -s prototype \
  -s review-animations

# Visual direction, brand kits and image-led frontend work.
add Leonxlnx/taste-skill \
  -s brandkit \
  -s industrial-brutalist-ui \
  -s image-to-code \
  -s imagegen-frontend-mobile \
  -s imagegen-frontend-web \
  -s minimalist-ui \
  -s redesign-existing-projects \
  -s high-end-visual-design \
  -s stitch-design-taste \
  -s design-taste-frontend

# Broad frontend design/critique pass.
add pbakaus/impeccable \
  -s impeccable

# UI/UX system: tokens, palettes, styles, slides.
add nextlevelbuilder/ui-ux-pro-max-skill \
  -s banner-design \
  -s brand \
  -s design \
  -s design-system \
  -s slides \
  -s ui-styling \
  -s ui-ux-pro-max

# Anthropic's own design, docs and artifact skills.
add anthropics/skills \
  -s algorithmic-art \
  -s brand-guidelines \
  -s doc-coauthoring \
  -s frontend-design \
  -s internal-comms \
  -s mcp-builder \
  -s slack-gif-creator \
  -s theme-factory \
  -s web-artifacts-builder

# React/Next.js practices, deployment and guideline reviews.
add vercel-labs/agent-skills \
  -s vercel-composition-patterns \
  -s deploy-to-vercel \
  -s vercel-react-best-practices \
  -s vercel-react-native-skills \
  -s vercel-react-view-transitions \
  -s vercel-cli-with-tokens \
  -s vercel-optimize \
  -s web-design-guidelines \
  -s writing-guidelines

# Programmatic video (all skills in the repo).
add remotion-dev/skills --skill '*'

# UX design perspectives, design audits and AEO.
add bencium/bencium-marketplace \
  -s bencium-controlled-ux-designer \
  -s bencium-innovative-ux-designer \
  -s bencium-impact-designer \
  -s design-audit \
  -s bencium-aeo \
  -s renaissance-architecture \
  -s "Agentic UX Design - Relationship-Centric Interfaces"

# Accessibility: scan, inspect, audit, fix, diff (all skills in the repo).
add AccessLint/skills --skill '*'

echo
if [ ${#failed[@]} -gt 0 ]; then
  echo "Finished with ${#failed[@]} failed source(s):" >&2
  printf '  - %s\n' "${failed[@]}" >&2
  exit 1
fi

echo "All skill sources installed."
echo "Review skills before use; they run with full agent permissions."

#!/bin/bash
# Install the Knutpunkt skills for Claude Code.
#
# Symlinks each skill in this directory into ~/.claude/skills/ so it is available from
# every project, while this repository stays the source of truth — edits here take
# effect immediately, with no reinstall.
#
# Usage:
#   ./skills/install.sh            # install (symlink)
#   ./skills/install.sh --copy     # install a copy instead of a symlink
#   ./skills/install.sh --uninstall

set -e

SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.claude/skills"
MODE="symlink"

for arg in "$@"; do
    case "$arg" in
        --copy)      MODE="copy" ;;
        --uninstall) MODE="uninstall" ;;
        -h|--help)   sed -n '2,12p' "$0"; exit 0 ;;
        *)           echo "Unknown option: $arg" >&2; exit 1 ;;
    esac
done

mkdir -p "$TARGET_DIR"

for skill_path in "$SKILLS_DIR"/*/; do
    skill=$(basename "$skill_path")
    [ -f "$skill_path/SKILL.md" ] || continue
    target="$TARGET_DIR/$skill"

    if [ "$MODE" = "uninstall" ]; then
        if [ -e "$target" ] || [ -L "$target" ]; then
            rm -rf "$target"
            echo "Removed $target"
        fi
        continue
    fi

    if [ -e "$target" ] || [ -L "$target" ]; then
        echo "Replacing existing $target"
        rm -rf "$target"
    fi

    if [ "$MODE" = "copy" ]; then
        cp -R "$skill_path" "$target"
        echo "Copied  $skill -> $target"
    else
        ln -s "${skill_path%/}" "$target"
        echo "Linked  $target -> ${skill_path%/}"
    fi

    chmod +x "$skill_path"scripts/* 2>/dev/null || true
done

[ "$MODE" = "uninstall" ] && exit 0

cat <<EOF

Installed. The kp CLI is at:
  $TARGET_DIR/knutpunkt/scripts/kp

Optional — put it on PATH so 'kp' works anywhere:
  ln -s $TARGET_DIR/knutpunkt/scripts/kp ~/.local/bin/kp

Optional — avoid a permission prompt per call by adding to ~/.claude/settings.json:
  "permissions": { "allow": ["Bash(kp:*)"] }
EOF

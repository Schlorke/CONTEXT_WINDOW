#!/usr/bin/env python3
"""Create a conservative portable Agent Skill scaffold without overwriting."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ALLOWED_RESOURCES = {"scripts", "references", "assets"}


def yaml_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def title_from_name(name: str) -> str:
    return " ".join(part.capitalize() for part in name.split("-"))


def parse_resources(value: str) -> list[str]:
    resources = [item.strip() for item in value.split(",") if item.strip()]
    invalid = sorted(set(resources) - ALLOWED_RESOURCES)
    if invalid:
        raise argparse.ArgumentTypeError(
            f"unsupported resources: {', '.join(invalid)}; choose scripts,references,assets"
        )
    return resources


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create a portable Agent Skill directory without overwriting it."
    )
    parser.add_argument("skill_name")
    parser.add_argument("--path", required=True, help="Parent collection directory")
    parser.add_argument("--resources", default="", type=parse_resources)
    parser.add_argument("--display-name")
    parser.add_argument("--short-description")
    parser.add_argument("--default-prompt")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    name = args.skill_name.strip()
    if not NAME_PATTERN.fullmatch(name) or len(name) > 64:
        raise SystemExit(
            "skill_name must be lowercase kebab-case, at most 64 characters"
        )

    skill_dir = Path(args.path).resolve() / name
    if skill_dir.exists():
        raise SystemExit(f"refusing to overwrite existing directory: {skill_dir}")

    display_name = args.display_name or title_from_name(name)
    short_description = args.short_description or f"Create and maintain {display_name} workflows"
    if not 25 <= len(short_description) <= 64:
        raise SystemExit("short_description must contain 25 to 64 characters")
    default_prompt = args.default_prompt or (
        f"Use ${name} to create or update this skill safely."
    )
    if f"${name}" not in default_prompt:
        raise SystemExit(f"default_prompt must mention ${name}")

    (skill_dir / "agents").mkdir(parents=True)
    for resource in args.resources:
        (skill_dir / resource).mkdir()

    skill_md = f'''---
name: {name}
description: "TODO: Describe what this skill does and the concrete tasks that trigger it."
metadata:
  author: "TODO"
  version: "0.1.0"
  last_validated: "TODO: YYYY-MM-DD"
  sources: []
---

# {display_name}

TODO: State the outcome this skill enables.

## Workflow

1. TODO: Inspect local instructions and current state.
2. TODO: Perform the domain-specific work.
3. TODO: Validate the result.

## Fallback Clause

TODO: Explain how to proceed safely when required context or tooling is absent.

## Anti-Patterns

- TODO: List concrete mistakes this skill prevents.

## Enforcement

TODO: State the non-negotiable rules when this skill triggers.

## Source References

- TODO: List bundled references and authoritative external sources.
'''
    openai_yaml = f'''interface:
  display_name: {yaml_quote(display_name)}
  short_description: {yaml_quote(short_description)}
  default_prompt: {yaml_quote(default_prompt)}
'''

    (skill_dir / "SKILL.md").write_text(skill_md, encoding="utf-8")
    (skill_dir / "agents" / "openai.yaml").write_text(
        openai_yaml, encoding="utf-8"
    )
    print(f"Created portable skill scaffold: {skill_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

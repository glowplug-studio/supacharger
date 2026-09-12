# Free public skill installer

Canonical implementation of the public Glowplug skills installer, distributed byte-identically in the Supacharger CLI at `commands/skills/installer.cjs`. It is separate from application extensions, paid modules and the Core lock.

Run `npm ci && npm test` in this directory. The CLI supplies command registration and initialisation prompts. `runSkills` supports checkbox selection; `installSelection` validates committed source files and preserves local changes. Source defaults to the public HTTPS Glowplug repository; `--source` exports a committed local checkout for maintainer tests. Downloads never execute skill scripts.

The installer records SHA-256 content hashes and the immutable source commit in `.supacharger/skills-lock.json`. A lock serialises installations; writes are staged and normal failures roll back. If a process is killed, inspect `.supacharger/skills-install.lock` and any `skills-transaction-*` directory before retrying; do not delete recovery backups blindly. Existing untracked folders, local edits, symlinks and invalid metadata stop installation.

Use [Agent guidance](https://supacharger.dev/docs/agents) and [Skills](https://supacharger.dev/docs/skills) for the user workflow. This code must be released in the CLI before published commands are available to all users; catalogue commits must likewise be published on GitHub before remote installation can retrieve them.

# Agent skills installer

Canonical implementation of the Glowplug skills installer, distributed byte-identically in the Supacharger CLI at `commands/skills/installer.cjs`. The default source is the free public catalogue. An authorised committed local checkout supplied through `--source` may provide licensed skills. It is separate from application extensions and the Core lock.

The CLI supplies command registration and initialisation prompts. `runSkills` supports checkbox selection; `installSelection` validates committed source files and preserves local changes. Source defaults to the public HTTPS Glowplug repository; `--source` accepts an authorised committed checkout. Downloads never execute skill scripts.

The installer records one SHA-256 digest for the complete skill directory, the actual GitHub source repository and the immutable source commit in `.supacharger/skills-lock.json`. It refuses to update a tracked skill from a different repository. Developers and agents must not edit this generated record manually. A lock serialises installations; writes are staged and normal failures roll back. If a process is killed, inspect `.supacharger/skills-install.lock` and any `skills-transaction-*` directory before retrying; do not delete recovery backups blindly. Existing untracked folders, local edits, symlinks and invalid metadata stop installation.

Use [Agent guidance](https://supacharger.dev/docs/agents) and [Skills](https://supacharger.dev/docs/skills) for the user workflow. This code must be released in the CLI before published commands are available to all users; catalogue commits must likewise be published on GitHub before remote installation can retrieve them.

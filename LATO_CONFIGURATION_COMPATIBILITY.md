# Lato Configuration Compatibility

## Compatibility Contract

Lato owns its global configuration identity while continuing to read supported
OpenCode configuration sources. Provider IDs, including `opencode` and
`opencode-go`, remain unchanged.

The compatibility order is:

1. Remote well-known configuration.
2. Legacy OpenCode global configuration.
3. Lato global configuration.
4. `OPENCODE_CONFIG`.
5. `LATO_CONFIG`.
6. Legacy project files.
7. Lato project files.
8. `.opencode` directories.
9. `.lato` directories.
10. `OPENCODE_CONFIG_DIR`.
11. `OPENCODE_CONFIG_CONTENT`.
12. `LATO_CONFIG_CONTENT`.
13. Account configuration.
14. Managed configuration and MDM.

Later sources override earlier sources according to the existing V1 merge
engine. V2 preserves its ordered-entry model and uses the same source ordering.

## Legacy Sources

The following remain readable:

- `${XDG_CONFIG_HOME:-~/.config}/opencode/config.json`
- `${XDG_CONFIG_HOME:-~/.config}/opencode/opencode.json`
- `${XDG_CONFIG_HOME:-~/.config}/opencode/opencode.jsonc`
- Extensionless legacy TOML `config` in the legacy global directory
- Existing project `opencode.json` and `opencode.jsonc`
- Existing `.opencode` directories
- Existing `OPENCODE_CONFIG_DIR` content
- Existing `tui.json` and `tui.jsonc`

Legacy global `AGENTS.md`, themes, skills, tools, and other supported assets
remain discoverable.

## Explicit Paths

`LATO_CONFIG` is strict: missing, unreadable, or invalid files report a clear
configuration error. `OPENCODE_CONFIG` retains compatibility behavior for
missing legacy files by warning and skipping them.

`LATO_CONFIG_DIR` is read without creating a configuration file. Explicit write
operations create the directory when necessary. `OPENCODE_CONFIG_DIR` retains
its legacy compatibility-directory behavior.

Inline configuration is virtual and never creates a file. If inline content is
active while a writer updates a file, the inline value continues to win for the
current process.

## Migration Safety

Lato does not perform destructive migration during reads.

- `$schema` is not injected into existing files.
- TOML is parsed without creating `config.json` or deleting `config`.
- Legacy TUI keys are projected into the TUI configuration in memory.
- `.tui-migration.bak` files are not created during reads.
- New `.lato` files are never processed by legacy TUI migration logic.

Previously migrated `tui.json` files remain supported.

## Writers

The active-source resolver applies to:

- Global and project configuration API updates.
- MCP server creation.
- CLI and TUI plugin installation.
- Agent creation.
- TUI theme installation.
- Uninstall configuration targeting.

Existing Lato files win. If no Lato file exists, an active legacy file is
updated. Only when neither exists is a Lato-native file created.

## Unchanged Ownership

Phase 4.2 does not move:

- Authentication state.
- Database files.
- Sessions.
- Runtime state.
- Cache data.
- Repository caches.
- Tool output storage.
- Provider endpoints or provider IDs.
- Managed OpenCode paths or MDM identifiers.

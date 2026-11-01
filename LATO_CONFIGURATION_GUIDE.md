# Lato Configuration Guide

## Global Configuration

Lato owns the platform-native global configuration directory:

- Linux: `$XDG_CONFIG_HOME/lato`, or `~/.config/lato` when `XDG_CONFIG_HOME` is unset.
- macOS: `~/Library/Application Support/Lato`.
- Windows: `%APPDATA%\\Lato`, falling back to `~/AppData/Roaming/Lato`.

Set `LATO_CONFIG_DIR` to use an explicit global configuration directory. The
directory override affects configuration only. Lato data, cache, state,
repositories, authentication, sessions, and the database retain their existing
OpenCode-derived locations.

The legacy OpenCode global directory remains readable at
`${XDG_CONFIG_HOME:-~/.config}/opencode`.

## Files

Global configuration is loaded in this order:

1. Legacy `config.json`.
2. Legacy `opencode.json`.
3. Legacy `opencode.jsonc`.
4. Lato `lato.json`.
5. Lato `lato.jsonc`.

Project configuration supports:

- `lato.jsonc`
- `lato.json`
- `opencode.jsonc`
- `opencode.json`
- `.lato/`
- `.opencode/`

New project configuration writes use Lato names. Existing OpenCode files remain
active and are updated when no higher-priority Lato file exists.

## Environment Variables

- `LATO_CONFIG`: explicit Lato configuration file.
- `LATO_CONFIG_DIR`: explicit Lato global configuration directory.
- `LATO_CONFIG_CONTENT`: inline Lato configuration.
- `OPENCODE_CONFIG`: legacy explicit configuration file.
- `OPENCODE_CONFIG_DIR`: legacy compatibility configuration directory.
- `OPENCODE_CONFIG_CONTENT`: legacy inline configuration.
- `OPENCODE_TUI_CONFIG`: explicit TUI configuration file.

When both Lato and legacy equivalents are present, the Lato source is loaded
later and overrides conflicting values.

## Project Discovery

Project files are discovered from the project root toward the current directory;

`.opencode` and `.lato` directories are discovered from the current directory
toward the project root. Existing directory merge behavior is preserved. Lato
directories are applied after OpenCode directories.

Normal discovery never creates a `.lato` directory or configuration file.

## Safe Reads

Configuration reads are non-destructive:

- Existing files are not rewritten to add `$schema`.
- Legacy extensionless TOML is read in place and is not deleted or converted.
- Legacy TUI keys are read in memory and do not create `tui.json` backups.
- A missing global configuration does not create a new configuration file.

Configuration-writing commands create files explicitly and may include the
existing OpenCode JSON schema URL for editor support.

## Writing Configuration

Writers select targets in this order:

1. Existing active Lato-native configuration.
2. Existing active legacy OpenCode configuration.
3. New Lato-native configuration.

Writers never copy a complete legacy configuration into a new Lato file and do
not create duplicate `.lato` and `.opencode` configuration directories.

If an explicit configuration file cannot safely identify a writable target, the
command reports the path and stops rather than guessing.

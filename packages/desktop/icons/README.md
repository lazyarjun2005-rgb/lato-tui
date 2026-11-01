# Desktop Icons

Lato desktop icon channels live in `dev/`, `beta/`, and `prod/`. `packages/desktop/scripts/copy-icons.ts` copies the selected channel to `resources/icons` before development or packaging.

The approved source artwork was supplied as a 181x181 PNG. `packages/desktop/app-icon.png` is a 1024x1024 resized master. The larger PNGs, `icon.ico`, and `icon.icns` are high-quality resizes derived from that master, not native high-resolution artwork. Replace `app-icon.png` and regenerate the channel resources when a larger source is available.

Electron uses `resources/icons/icon.icns` for macOS, `resources/icons/icon.ico` for Windows, and the PNG directory for Linux. macOS packaging and icon appearance have not been verified on this Linux development machine.

// @ts-nocheck
import * as mod from "./logo"

const docs = `### Overview
Lato logo assets: mark, splash, and wordmark.

Use Mark for compact spaces, Logo for headers, Splash for hero sections.

### API
- \`Mark\`, \`Splash\`, and \`Logo\` render the approved Lato PNG assets.

### Variants and states
- Multiple logo variants for different contexts.

### Behavior
- Raster assets imported through Vite.

### Accessibility
- The full wordmark includes a Lato accessible label.

### Theming/tokens
- Uses the approved Lato colors from the supplied artwork.

`

export default {
  title: "UI/Logo",
  id: "components-logo",
  component: mod.Logo,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: docs,
      },
    },
  },
}

export const Basic = {
  render: () => (
    <div style={{ display: "grid", gap: "16px", "align-items": "start" }}>
      <div>
        <div style={{ color: "var(--text-weak)", "font-size": "12px" }}>Mark</div>
        <mod.Mark />
      </div>
      <div>
        <div style={{ color: "var(--text-weak)", "font-size": "12px" }}>Splash</div>
        <mod.Splash class="w-20 h-20" />
      </div>
      <div>
        <div style={{ color: "var(--text-weak)", "font-size": "12px" }}>Logo</div>
        <mod.Logo class="w-50" />
      </div>
    </div>
  ),
}

# ResponsiveShot

Capture full-page screenshots at any viewport width. Switch between device presets for quick responsive testing.

## Features

- **Full-page screenshots** — captures the entire page, not just the visible viewport
- **Viewport presets** — mobile (360, 390, 428) and desktop (1024, 1280, 1536, 1920, 2560)
- **Batch capture** — "All" button screenshots every preset in one click
- **Print mode** — capture how the page looks when printed (Letter / A4)
- **DevTools-based emulation** — accurate viewport widths, even below Chrome's minimum window size
- **Smart height detection** — measures actual content height, ignoring `min-height: 100vh` inflation

## Install

### From source

1. Clone this repo
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder

### From Chrome Web Store

Coming soon.

## Usage

1. Navigate to the page you want to screenshot
2. Click the ResponsiveShot icon in the toolbar
3. Click a width preset to capture a screenshot at that size
4. Or click **Screenshot** for the current viewport width
5. Or click **All** to capture every preset at once

Screenshots are saved as `screenshot-{width}-{timestamp}.png`.

### Print mode

The **Print** presets (Letter / A4) emulate how the page looks when printed:

- Activates [`@media print`](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing) stylesheets
- Strips background colors, images, and shadows — matching the default browser behavior when "Background graphics" is off
- Respects [`print-color-adjust: exact`](https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust) on elements that explicitly opt in to keeping their backgrounds

This is useful for checking that your `@media print` styles work correctly and that content remains readable without decorative backgrounds. Print screenshots are saved as `print-{format}-{timestamp}.png` (e.g. `print-a4-1740000000.png`).

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Access the current tab for screenshotting |
| `downloads` | Save screenshot PNGs to disk |
| `scripting` | Read current viewport width |
| `debugger` | DevTools Protocol for viewport emulation and full-page capture |

## License

Copyright (c) 2026 Sebastian Software GmbH — [sebastian-software.com](https://www.sebastian-software.com)

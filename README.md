<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="ResponsiveShot">
</p>

<h1 align="center">ResponsiveShot</h1>

<p align="center">
  <strong>Full-page screenshots at every breakpoint. One click.</strong><br>
  Stop resizing your browser window. Stop cropping in Photoshop.<br>
  Just pick a width and get a pixel-perfect PNG.
</p>

<p align="center">
  <a href="#install">Install</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#usage">Usage</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#print-mode">Print Mode</a>
</p>

---

## Why ResponsiveShot?

Responsive testing shouldn't require a 12-step workflow. Open the popup, tap a preset, done. ResponsiveShot uses the Chrome DevTools Protocol under the hood to emulate any viewport width — yes, even narrower than Chrome's minimum window size. No window resizing, no workarounds, no extensions that screenshot the wrong thing.

## Features

- **Full-page capture** — the entire page from top to bottom, not just what's visible
- **8 viewport presets** — mobile (360, 390, 428) and desktop (1024, 1280, 1536, 1920, 2560)
- **Batch mode** — hit "All" and get every breakpoint in one go
- **Print preview** — see exactly what your page looks like on paper (Letter / A4)
- **Accurate emulation** — real DevTools Protocol, not window hacks
- **Smart height** — measures actual content, ignores `min-height: 100vh` padding
- **Zero config** — no options page, no accounts, no cloud. Just screenshots.

## Install

### From source

1. Clone this repo
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder

### Chrome Web Store

Coming soon.

## Usage

1. Navigate to any page
2. Click the ResponsiveShot icon
3. Pick a width — screenshot downloads instantly
4. Or hit **All** for every preset at once

Screenshots are saved as `screenshot-{width}-{timestamp}.png`.

### Print mode

The **Print** presets (Letter / A4) capture how the page looks when printed:

- Activates [`@media print`](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing) stylesheets
- Strips backgrounds and shadows — just like a real printer with "Background graphics" off
- Respects [`print-color-adjust: exact`](https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust) on elements that explicitly keep their backgrounds

Perfect for verifying your print styles before shipping. Saved as `print-{format}-{timestamp}.png`.

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Access the current tab |
| `downloads` | Save PNGs to disk |
| `scripting` | Read viewport width |
| `debugger` | DevTools Protocol for emulation + capture |

## License

Copyright (c) 2026 [Sebastian Software GmbH](https://www.sebastian-software.com)

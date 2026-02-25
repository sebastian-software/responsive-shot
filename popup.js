// Copyright (c) 2026 Sebastian Software GmbH
// https://www.sebastian-software.de

const PRESETS = [
  { label: "iPhone SE", width: 375, height: 667 },
  { label: "iPhone 14 Pro", width: 393, height: 852 },
  { label: "iPad", width: 768, height: 1024 },
  { label: "iPad Pro", width: 1024, height: 1366 },
  { label: "Desktop HD", width: 1920, height: 1080 },
  { label: "Desktop 4K", width: 2560, height: 1440 },
];

const presetsEl = document.getElementById("presets");
const currentSizeEl = document.getElementById("current-size");
const screenshotBtn = document.getElementById("screenshot");

// Build preset buttons
PRESETS.forEach((preset) => {
  const btn = document.createElement("button");
  btn.className = "preset-btn";
  btn.dataset.width = preset.width;
  btn.dataset.height = preset.height;
  btn.innerHTML = `<span class="label">${preset.label}</span><span class="size">${preset.width} × ${preset.height}</span>`;
  btn.addEventListener("click", () => applyPreset(preset));
  presetsEl.appendChild(btn);
});

// Get current viewport size and highlight matching preset
async function updateCurrentSize() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const win = await chrome.windows.get(tab.windowId);

  // Execute in the page to get actual viewport dimensions
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({ innerWidth: window.innerWidth, innerHeight: window.innerHeight }),
  });

  const vw = result.innerWidth;
  const vh = result.innerHeight;

  currentSizeEl.textContent = `Current viewport: ${vw} × ${vh}`;

  // Highlight matching preset
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    const match =
      parseInt(btn.dataset.width) === vw &&
      parseInt(btn.dataset.height) === vh;
    btn.classList.toggle("active", match);
  });

  // Return chrome offset for resize calculations
  return {
    windowId: win.id,
    tabId: tab.id,
    offsetW: win.width - vw,
    offsetH: win.height - vh,
  };
}

async function applyPreset(preset) {
  const info = await updateCurrentSize();
  const win = await chrome.windows.get(info.windowId);
  const originalWidth = win.width;
  const originalHeight = win.height;

  await chrome.windows.update(info.windowId, {
    width: preset.width + info.offsetW,
    height: preset.height + info.offsetH,
  });

  // Wait for the window to settle, take screenshot, then restore original size
  setTimeout(async () => {
    await updateCurrentSize();
    await takeScreenshot();

    await chrome.windows.update(info.windowId, {
      width: originalWidth,
      height: originalHeight,
    });

    setTimeout(() => updateCurrentSize(), 150);
  }, 300);
}

// Screenshot
async function takeScreenshot() {
  const info = await updateCurrentSize();
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: info.tabId },
    func: () => ({ innerWidth: window.innerWidth, innerHeight: window.innerHeight }),
  });

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "captureScreenshot",
        tabId: info.tabId,
        width: result.innerWidth,
        height: result.innerHeight,
      },
      (response) => {
        if (response?.error) {
          console.error("Screenshot failed:", response.error);
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      }
    );
  });
}

screenshotBtn.addEventListener("click", takeScreenshot);

// Init
updateCurrentSize();

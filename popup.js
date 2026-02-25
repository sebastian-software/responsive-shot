// Copyright (c) 2026 Sebastian Software GmbH
// https://www.sebastian-software.com

const PRESETS = {
  mobile: [360, 390, 428],
  desktop: [1024, 1280, 1536, 1920, 2560],
};

const ALL_WIDTHS = [...PRESETS.mobile, ...PRESETS.desktop];

const currentSizeEl = document.getElementById("current-size");
const screenshotBtn = document.getElementById("screenshot");
const screenshotAllBtn = document.getElementById("screenshot-all");

// Build preset buttons
function buildPresets(widths, containerId) {
  const container = document.getElementById(containerId);
  widths.forEach((width) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.dataset.width = width;
    btn.textContent = width;
    btn.addEventListener("click", () => sendMessage({
      action: "captureScreenshot",
      targetWidth: width,
    }));
    container.appendChild(btn);
  });
}

buildPresets(PRESETS.mobile, "presets-mobile");
buildPresets(PRESETS.desktop, "presets-desktop");

function getActiveTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    return tab || null;
  });
}

function sendMessage(msg) {
  getActiveTab().then((tab) => {
    if (!tab) return;
    chrome.runtime.sendMessage({ ...msg, tabId: tab.id }).catch(() => {});
  });
}

// Init — try to get viewport width, silently fail on protected pages
getActiveTab().then((tab) => {
  if (!tab) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.innerWidth,
  }).then(([{ result: vw }]) => {
    currentSizeEl.textContent = `${vw}px`;

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.dataset.width) === vw);
    });

    screenshotBtn.addEventListener("click", () => sendMessage({
      action: "captureScreenshot",
      targetWidth: vw,
    }));
  }).catch(() => {
    // Protected page (chrome://, etc.) — buttons still work, just no size display
  });
});

screenshotAllBtn.addEventListener("click", () => sendMessage({
  action: "captureAll",
  widths: ALL_WIDTHS,
}));
